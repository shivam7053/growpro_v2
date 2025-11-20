// services/paymentService.ts

import { loadRazorpay } from "@/utils/loadRazorpay";
import { PaymentDetails } from "@/types/masterclass";

export interface VerifyPaymentRequest {
  userId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}

export class PaymentService {
  /* ----------------------------------------------------
     🟦 CREATE ORDER
  ---------------------------------------------------- */
  static async createOrder(paymentDetails: PaymentDetails) {
    console.log("📝 Creating order...", paymentDetails);

    const response = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentDetails),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to create order");
    }

    return data;
  }

  /* ----------------------------------------------------
     🟩 VERIFY PAYMENT
  ---------------------------------------------------- */
  static async verifyPayment(request: VerifyPaymentRequest) {
    console.log("🔍 Verifying payment...");

    const response = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Payment verification failed");
    }

    return data;
  }

  /* ----------------------------------------------------
     🟥 MARK FAILED
  ---------------------------------------------------- */
  static async markTransactionAsFailed(payload: {
    userId: string;
    orderId: string;
    failureReason?: string;
    errorCode?: string;
    errorDescription?: string;
    masterclassId?: string;
    videoId?: string;
    amount?: number;
    type?: string;
  }) {
    console.log("❌ Mark failed:", payload);

    await fetch("/api/payment/mark-failed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  /* ----------------------------------------------------
     💳 PROCESS REAL RAZORPAY PAYMENT
  ---------------------------------------------------- */
  static async processRazorpayPayment(
    paymentDetails: PaymentDetails,
    purchaseTitle: string,
    onSuccess: (res: any) => void,
    onFailure: (err: any, orderId?: string) => void,
    onOrderCreated?: (orderId: string) => void
  ) {
    // Load script
    const loaded = await loadRazorpay();
    if (!loaded) throw new Error("Razorpay failed to load");

    try {
      /* -------------------------
         1️⃣ CREATE ORDER
      -------------------------- */
      const order = await this.createOrder(paymentDetails);
      if (onOrderCreated) onOrderCreated(order.orderId);

      /* -------------------------
         2️⃣ RAZORPAY OPTIONS
      -------------------------- */
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "GrowPro Masterclass",
        description: purchaseTitle,
        order_id: order.orderId,

        handler: (response: any) => {
          console.log("✅ Success:", response);

          onSuccess({
            userId: paymentDetails.userId,
            orderId: order.orderId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            type: paymentDetails.type,
          });
        },

        modal: {
          ondismiss: async () => {
            console.warn("⚠️ Payment dismissed");

            await PaymentService.markTransactionAsFailed({
              userId: paymentDetails.userId,
              orderId: order.orderId,
              failureReason: "Payment window closed",
              type: paymentDetails.type,
            });

            onFailure(
              { message: "Payment cancelled", code: "CANCELLED" },
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

      /* -------------------------
         🟥 FAILURE CALLBACK
      -------------------------- */
      razorpay.on("payment.failed", async (response: any) => {
        console.error("❌ Failed:", response.error);

        await PaymentService.markTransactionAsFailed({
          userId: paymentDetails.userId,
          orderId: order.orderId,
          failureReason: response.error.description,
          errorCode: response.error.code,
          errorDescription: response.error.description,
          masterclassId: paymentDetails.masterclassId,
          videoId: paymentDetails.videoId,
          amount: paymentDetails.amount,
          type: paymentDetails.type,
        });

        onFailure(response.error, order.orderId);
      });

      razorpay.open();
    } catch (err) {
      console.error("❌ Razorpay Error:", err);
      onFailure(err as any);
    }
  }

  /* ----------------------------------------------------
     🧩 DUMMY PAYMENT
  ---------------------------------------------------- */
  static async processDummyPayment(
    paymentDetails: PaymentDetails,
    onSuccess: (res: any) => void,
    onFailure: (err: any) => void
  ) {
    console.log("🧩 Dummy mode...");

    try {
      const orderId = `dummy_${Date.now()}`;
      const paymentId = `dummy_pay_${Date.now()}`;

      await new Promise((r) => setTimeout(r, 500));

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
      onFailure(e);
    }
  }
}
