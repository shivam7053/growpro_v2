// services/paymentService.ts

import { loadRazorpay } from "@/utils/loadRazorpay";
import { PaymentDetails } from "@/types/masterclass";

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  masterclassId: string;
  videoId?: string;
  userId: string;
  masterclassTitle: string;
  videoTitle?: string;
  amount: number;
  method: string;
  type: string;
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
      body: JSON.stringify({
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || "INR",
        masterclassId: paymentDetails.masterclassId,
        videoId: paymentDetails.videoId,
        userId: paymentDetails.userId,
        type: paymentDetails.type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create order");
    }

    const data = await response.json();

    if (!data.success || !data.orderId) {
      throw new Error(data.error || "Invalid order response");
    }

    // ✅ CRITICAL: Validate that key is present
    if (!data.key) {
      console.error("❌ Order response missing Razorpay key:", data);
      throw new Error(
        "Razorpay key not configured. Please contact support."
      );
    }

    console.log("✅ Order created successfully:", {
      orderId: data.orderId,
      amount: data.amount,
      hasKey: !!data.key,
    });

    return data;
  }

  /* ----------------------------------------------------
     🟩 VERIFY PAYMENT
  ---------------------------------------------------- */
  static async verifyPayment(request: VerifyPaymentRequest) {
    console.log("🔍 Verifying payment...", {
      orderId: request.razorpay_order_id,
      paymentId: request.razorpay_payment_id,
    });

    // ✅ Use correct Netlify endpoint
    const response = await fetch("/.netlify/functions/payment-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Payment verification failed");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Payment verification failed");
    }

    console.log("✅ Payment verified successfully");
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
    masterclassTitle?: string;
    videoTitle?: string;
  }) {
    console.log("❌ Marking transaction as failed:", payload);

    try {
      const response = await fetch("/api/payment/mark-failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        console.warn("⚠️ Failed to mark transaction:", data.error);
      }
    } catch (err) {
      console.error("❌ Error marking transaction as failed:", err);
      // Don't throw - this is a logging operation
    }
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
    try {
      // ============================================
      // STEP 1: Load Razorpay SDK
      // ============================================
      console.log("📦 Loading Razorpay SDK...");
      const loaded = await loadRazorpay();
      
      if (!loaded) {
        throw new Error("Failed to load Razorpay SDK. Please refresh the page.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not available. Please refresh the page.");
      }

      console.log("✅ Razorpay SDK loaded");

      // ============================================
      // STEP 2: Create Order
      // ============================================
      const order = await this.createOrder(paymentDetails);
      
      if (onOrderCreated) {
        onOrderCreated(order.orderId);
      }

      // ============================================
      // STEP 3: Configure Razorpay Options
      // ============================================
      const options = {
        key: order.key, // ✅ Use key from API response, NOT environment variable
        amount: order.amount,
        currency: order.currency || "INR",
        name: "GrowPro Masterclass",
        description: purchaseTitle,
        order_id: order.orderId,

        // Success handler
        handler: async (response: any) => {
          console.log("✅ Payment successful:", {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
          });

          onSuccess({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },

        // Modal configuration
        modal: {
          ondismiss: async () => {
            console.warn("⚠️ Payment modal dismissed by user");

            await PaymentService.markTransactionAsFailed({
              userId: paymentDetails.userId,
              orderId: order.orderId,
              failureReason: "Payment window closed by user",
              errorCode: "USER_CANCELLED",
              masterclassId: paymentDetails.masterclassId,
              videoId: paymentDetails.videoId,
              amount: paymentDetails.amount,
              type: paymentDetails.type,
              masterclassTitle: paymentDetails.masterclassTitle,
              videoTitle: paymentDetails.videoTitle,
            });

            onFailure(
              {
                error: {
                  code: "USER_CANCELLED",
                  description: "Payment was cancelled by user",
                },
              },
              order.orderId
            );
          },
        },

        // Prefill user data
        prefill: {
          email: paymentDetails.email || "",
          contact: paymentDetails.phone || "",
        },

        // Theme
        theme: {
          color: "#3B82F6",
        },

        // Retry configuration
        retry: {
          enabled: true,
          max_count: 2,
        },
      };

      console.log("🔵 Opening Razorpay checkout with key:", 
        order.key ? `${order.key.substring(0, 10)}...` : "MISSING"
      );

      // ============================================
      // STEP 4: Initialize Razorpay
      // ============================================
      const razorpay = new window.Razorpay(options);

      // Payment failure handler
      razorpay.on("payment.failed", async (response: any) => {
        console.error("❌ Payment failed:", response.error);

        const errorDetails = response.error || {};

        await PaymentService.markTransactionAsFailed({
          userId: paymentDetails.userId,
          orderId: order.orderId,
          failureReason: errorDetails.description || "Payment failed",
          errorCode: errorDetails.code || "PAYMENT_FAILED",
          errorDescription: errorDetails.description,
          masterclassId: paymentDetails.masterclassId,
          videoId: paymentDetails.videoId,
          amount: paymentDetails.amount,
          type: paymentDetails.type,
          masterclassTitle: paymentDetails.masterclassTitle,
          videoTitle: paymentDetails.videoTitle,
        });

        onFailure(response.error, order.orderId);
      });

      // Open payment modal
      razorpay.open();

    } catch (err: any) {
      console.error("❌ Razorpay payment error:", err);
      
      onFailure({
        error: {
          code: "PAYMENT_INIT_FAILED",
          description: err.message || "Failed to initialize payment",
        },
      });
    }
  }

  /* ----------------------------------------------------
     🧩 DUMMY PAYMENT (FOR TESTING)
  ---------------------------------------------------- */
  static async processDummyPayment(
    paymentDetails: PaymentDetails,
    onSuccess: (res: any) => void,
    onFailure: (err: any) => void
  ) {
    console.log("🧩 Processing dummy payment...", paymentDetails);

    try {
      const orderId = `dummy_${Date.now()}`;
      const paymentId = `dummy_pay_${Date.now()}`;

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // ✅ Call verification endpoint with correct structure
      const verifyRequest: VerifyPaymentRequest = {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: "dummy_signature",
        masterclassId: paymentDetails.masterclassId,
        videoId: paymentDetails.videoId,
        userId: paymentDetails.userId,
        masterclassTitle: paymentDetails.masterclassTitle || "Dummy Masterclass",
        videoTitle: paymentDetails.videoTitle,
        amount: paymentDetails.amount,
        method: "dummy",
        type: paymentDetails.type || "purchase",
      };

      const verifyData = await this.verifyPayment(verifyRequest);

      if (verifyData.success) {
        console.log("✅ Dummy payment successful");
        onSuccess({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: "dummy_signature",
        });
      } else {
        throw new Error("Dummy payment verification failed");
      }
    } catch (err: any) {
      console.error("❌ Dummy payment error:", err);
      onFailure({
        error: {
          code: "DUMMY_PAYMENT_FAILED",
          description: err.message || "Dummy payment failed",
        },
      });
    }
  }
}

// Global type declaration
declare global {
  interface Window {
    Razorpay?: any;
  }
}