// services/paymentService.ts

import { loadRazorpay } from "@/utils/loadRazorpay";

export interface PaymentDetails {
  amount: number;
  currency: string;
  masterclassId: string;
  masterclassTitle: string;
  userId: string;
  email?: string;
  phone?: string;
}

export interface VerifyPaymentRequest {
  userId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}

/* ============================================================
   PAYMENT SERVICE (UPDATED FOR NEW API + NEW TRANSACTION FORMAT)
   ============================================================ */
export class PaymentService {
  /* ----------------------------------------
   🟦 CREATE ORDER
  ---------------------------------------- */
  static async createOrder(paymentDetails: PaymentDetails): Promise<any> {
    console.log("📝 Creating order with backend...", paymentDetails);

    const response = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentDetails),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to create order");
    }

    console.log("✅ Order created:", data.orderId);
    return data;
  }

  /* ----------------------------------------
   🟩 VERIFY PAYMENT
  ---------------------------------------- */
  static async verifyPayment(request: VerifyPaymentRequest): Promise<any> {
    console.log("🔍 Verifying payment with backend...");

    const response = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Payment verification failed");
    }

    console.log("✅ Payment verified");
    return data;
  }

  /* ----------------------------------------
   🟥 MARK PAYMENT FAILED
  ---------------------------------------- */
  static async markTransactionAsFailed(payload: {
    userId: string;
    orderId: string;
    failureReason?: string;
    errorCode?: string;
    errorDescription?: string;
    masterclassId?: string;
    masterclassTitle?: string;
    amount?: number;
  }): Promise<void> {
    console.log("❌ Marking transaction as failed:", payload.orderId);

    await fetch("/api/payment/mark-failed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  /* ----------------------------------------
   💳 PROCESS RAZORPAY PAYMENT (REAL FLOW)
  ---------------------------------------- */
  static async processRazorpayPayment(
    paymentDetails: PaymentDetails,
    title: string,
    onSuccess: (res: any) => void,
    onFailure: (err: any, orderId?: string) => void,
    onOrderCreated?: (orderId: string) => void
  ) {
    // Load Razorpay script
    const isLoaded = await loadRazorpay();
    if (!isLoaded) throw new Error("Razorpay failed to load.");

    console.log("💳 Starting Razorpay checkout...");

    try {
      /* ----------------------------
         1️⃣ CREATE ORDER (BACKEND)
      ----------------------------- */
      const order = await this.createOrder(paymentDetails);

      if (onOrderCreated) onOrderCreated(order.orderId);

      /* ----------------------------
         2️⃣ RAZORPAY OPTIONS
      ----------------------------- */
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Masterclass Payment",
        description: title,
        order_id: order.orderId,

        /* ----------------------------
           🟩 PAYMENT SUCCESS
        ----------------------------- */
        handler: async function (response: any) {
          console.log("✅ Razorpay Success:", response);

          onSuccess({
            userId: paymentDetails.userId,
            orderId: order.orderId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
        },

        /* ----------------------------
           🟥 PAYMENT CANCELLED
        ----------------------------- */
        modal: {
          ondismiss: async () => {
            console.warn("⚠️ Payment dismissed by user");

            await PaymentService.markTransactionAsFailed({
              userId: paymentDetails.userId,
              orderId: order.orderId,
              failureReason: "Payment window closed by user",
            });

            onFailure(
              { message: "Payment cancelled", code: "PAYMENT_CANCELLED" },
              order.orderId
            );
          },
        },

        prefill: {
          email: paymentDetails.email || "",
          contact: paymentDetails.phone || "",
        },

        theme: { color: "#3B82F6" },

        retry: { enabled: true, max_count: 2 },
      };

      const razorpay = new (window as any).Razorpay(options);

      /* ----------------------------
         🟥 PAYMENT FAILED CALLBACK
      ----------------------------- */
      razorpay.on("payment.failed", async (response: any) => {
        console.error("❌ Razorpay Error:", response.error);

        await PaymentService.markTransactionAsFailed({
          userId: paymentDetails.userId,
          orderId: order.orderId,
          failureReason: response.error.description || "Payment failed",
          errorCode: response.error.code,
          errorDescription: response.error.description,
          masterclassId: paymentDetails.masterclassId,
          masterclassTitle: paymentDetails.masterclassTitle,
          amount: paymentDetails.amount,
        });

        onFailure(response.error, order.orderId);
      });

      console.log("🚀 Opening Razorpay...");
      razorpay.open();
    } catch (error: any) {
      console.error("❌ Razorpay Init Error:", error);
      onFailure(error);
    }
  }

  /* ----------------------------------------
   🧩 DUMMY PAYMENT (TESTING MODE)
  ---------------------------------------- */
  static async processDummyPayment(
    paymentDetails: PaymentDetails,
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void
  ) {
    console.log("🧩 Dummy payment simulation...");

    try {
      const orderId = `dummy_${Date.now()}`;
      const paymentId = `dummy_pay_${Date.now()}`;

      await new Promise((r) => setTimeout(r, 1000));

      const verify = await this.verifyPayment({
        userId: paymentDetails.userId,
        orderId,
        paymentId,
        signature: "dummy_signature",
      });

      if (verify.success) {
        onSuccess({ orderId, paymentId });
      } else {
        throw new Error("Dummy verification failed");
      }
    } catch (e) {
      console.error("❌ Dummy payment failed:", e);
      onFailure(e);
    }
  }
}
