// services/paymentService.ts

import { PaymentDetails, PaymentResponse } from "@/types/masterclass";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export class PaymentService {
  private static RAZORPAY_KEY =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_xxxxx";

  // 🔹 Load Razorpay script dynamically
  static loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        console.log("✅ Razorpay script already loaded");
        resolve(true);
        return;
      }

      console.log("🔵 Loading Razorpay script...");
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        console.log("✅ Razorpay script loaded successfully");
        resolve(true);
      };
      script.onerror = () => {
        console.error("❌ Failed to load Razorpay script");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  // 🔹 Razorpay Payment Flow
  static async processRazorpayPayment(
    details: PaymentDetails,
    masterclassTitle: string,
    onSuccess: (response: any) => void,
    onFailure: (error: any, orderId?: string) => void,
    onOrderCreated?: (orderId: string) => void
  ): Promise<void> {
    try {
      console.log("🔵 Initializing Razorpay payment...");
      const scriptLoaded = await this.loadRazorpayScript();

      if (!scriptLoaded) {
        console.error("❌ Razorpay SDK failed to load");
        onFailure({
          error:
            "Failed to load Razorpay SDK. Please check your internet connection.",
        });
        return;
      }

      // 🔵 Create order on backend (handles pending transaction)
      console.log("🔵 Creating Razorpay order...");
      const orderData = await this.createRazorpayOrder(details);
      console.log("✅ Order created:", orderData.orderId);

      // ✅ Notify parent component about order creation
      if (onOrderCreated) {
        onOrderCreated(orderData.orderId);
      }

      const options = {
        key: this.RAZORPAY_KEY,
        amount: details.amount * 100,
        currency: details.currency,
        name: "GrowPro",
        description: "Masterclass Purchase",
        order_id: orderData.orderId,
        handler: function (response: any) {
          console.log("✅ Payment handler called:", response);
          onSuccess(response);
        },
        prefill: {
          email: details.email || "",
          contact: details.phone || "",
        },
        theme: { color: "#000000" },
        modal: {
          ondismiss: function () {
            console.log("❌ Payment modal dismissed by user");
            onFailure({ error: "Payment cancelled by user" }, orderData.orderId);
          },
          escape: true,
          animation: true,
        },
      };

      console.log("🔵 Opening Razorpay checkout...");
      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response: any) {
        console.error("❌ Payment failed:", response.error);
        onFailure({
          error: response.error.description || "Payment failed",
          code: response.error.code,
          reason: response.error.reason,
        }, orderData.orderId);
      });

      try {
        razorpay.open();
      } catch (openError: any) {
        console.error("❌ Error opening Razorpay checkout:", openError);
        onFailure({
          error:
            "Failed to open payment window. Please check your Razorpay configuration.",
        }, orderData.orderId);
      }
    } catch (error: any) {
      console.error("❌ Razorpay initialization error:", error);
      onFailure({ error: error.message || "Failed to initialize payment" });
    }
  }

  // 🔹 Backend: Create Razorpay order
  private static async createRazorpayOrder(details: PaymentDetails): Promise<any> {
    try {
      console.log("🔵 Calling backend to create order...");
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });

      if (!response.ok) {
        console.error("❌ Order creation failed:", response.status);
        throw new Error("Failed to create order");
      }

      const data = await response.json();
      console.log("✅ Order created successfully");
      return data;
    } catch (error) {
      console.error("❌ Order creation error:", error);
      throw error;
    }
  }

  // 🔹 Backend: Verify payment (handles both dummy and Razorpay)
  static async verifyPayment(paymentData: any): Promise<boolean> {
    try {
      console.log("🔵 Verifying payment...", paymentData.method || "razorpay");
      const response = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Verification failed:", errorData);
        return false;
      }

      const data = await response.json();
      if (data.success === true) {
        console.log("✅ Payment verified successfully");
        return true;
      } else {
        console.error("❌ Payment verification returned false");
        return false;
      }
    } catch (error) {
      console.error("❌ Verification error:", error);
      return false;
    }
  }

  // 🔹 Backend: Mark transaction as failed
  static async markTransactionAsFailed(
    userId: string,
    orderId: string,
    reason: string
  ): Promise<boolean> {
    try {
      console.log("🔵 Marking transaction as failed...", orderId);
      const response = await fetch("/api/payment/mark-failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          orderId,
          failureReason: reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Failed to mark transaction:", errorData);
        return false;
      }

      const data = await response.json();
      console.log("✅ Transaction marked as failed");
      return data.success === true;
    } catch (error) {
      console.error("❌ Error marking transaction as failed:", error);
      return false;
    }
  }
}