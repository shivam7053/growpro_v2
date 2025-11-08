// services/paymentService.ts
import { PaymentDetails, PaymentResponse } from "@/types/masterclass";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export class PaymentService {
  private static RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_xxxxx";
  
  // Load Razorpay script
  static loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Process dummy payment (for testing)
  static async processDummyPayment(details: PaymentDetails): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: `TXN_${Date.now()}`,
          orderId: `ORD_${Date.now()}`,
        });
      }, 1500);
    });
  }

  // Process Razorpay payment
  static async processRazorpayPayment(
    details: PaymentDetails,
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void
  ): Promise<void> {
    const scriptLoaded = await this.loadRazorpayScript();
    
    if (!scriptLoaded) {
      onFailure({ error: "Failed to load Razorpay SDK" });
      return;
    }

    // Create order on backend (you'll need to implement this API endpoint)
    const orderData = await this.createRazorpayOrder(details);
    
    const options = {
      key: this.RAZORPAY_KEY,
      amount: details.amount * 100, // Convert to paise
      currency: details.currency,
      name: "GrowPro",
      description: "Masterclass Purchase",
      order_id: orderData.orderId,
      handler: function (response: any) {
        onSuccess(response);
      },
      prefill: {
        email: details.email,
        contact: details.phone,
      },
      theme: {
        color: "#000000",
      },
      modal: {
        ondismiss: function () {
          onFailure({ error: "Payment cancelled by user" });
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }

  // Create Razorpay order (backend API call)
  private static async createRazorpayOrder(details: PaymentDetails): Promise<any> {
    // TODO: Implement backend API call to create Razorpay order
    // For now, return dummy data
    return {
      orderId: `order_${Date.now()}`,
      amount: details.amount,
      currency: details.currency,
    };
    
    /* 
    // Actual implementation:
    const response = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });
    return await response.json();
    */
  }

  // Verify payment (backend API call)
  static async verifyPayment(paymentData: any): Promise<boolean> {
    try {
      const response = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Verification failed:", errorData);
        return false;
      }

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error("Verification error:", error);
      return false;
    }
  }
}