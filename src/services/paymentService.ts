// // services/paymentService.ts

// import { PaymentDetails, PaymentResponse } from "@/types/masterclass";

// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// export class PaymentService {
//   private static RAZORPAY_KEY =
//     process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_xxxxx";

//   // 🔹 Load Razorpay script dynamically
//   static loadRazorpayScript(): Promise<boolean> {
//     return new Promise((resolve) => {
//       if (typeof window !== "undefined" && window.Razorpay) {
//         console.log("✅ Razorpay script already loaded");
//         resolve(true);
//         return;
//       }

//       console.log("🔵 Loading Razorpay script...");
//       const script = document.createElement("script");
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.onload = () => {
//         console.log("✅ Razorpay script loaded successfully");
//         resolve(true);
//       };
//       script.onerror = () => {
//         console.error("❌ Failed to load Razorpay script");
//         resolve(false);
//       };
//       document.body.appendChild(script);
//     });
//   }

//   // 🔹 Razorpay Payment Flow
//   static async processRazorpayPayment(
//     details: PaymentDetails,
//     masterclassTitle: string,
//     onSuccess: (response: any) => void,
//     onFailure: (error: any, orderId?: string) => void,
//     onOrderCreated?: (orderId: string) => void
//   ): Promise<void> {
//     try {
//       console.log("🔵 Initializing Razorpay payment...");
//       const scriptLoaded = await this.loadRazorpayScript();

//       if (!scriptLoaded) {
//         console.error("❌ Razorpay SDK failed to load");
//         onFailure({
//           error:
//             "Failed to load Razorpay SDK. Please check your internet connection.",
//         });
//         return;
//       }

//       // 🔵 Create order on backend (handles pending transaction)
//       console.log("🔵 Creating Razorpay order...");
//       const orderData = await this.createRazorpayOrder(details);
//       console.log("✅ Order created:", orderData.orderId);

//       // ✅ Notify parent component about order creation
//       if (onOrderCreated) {
//         onOrderCreated(orderData.orderId);
//       }

//       const options = {
//         key: this.RAZORPAY_KEY,
//         amount: details.amount * 100,
//         currency: details.currency,
//         name: "GrowPro",
//         description: "Masterclass Purchase",
//         order_id: orderData.orderId,
//         handler: function (response: any) {
//           console.log("✅ Payment handler called:", response);
//           onSuccess(response);
//         },
//         prefill: {
//           email: details.email || "",
//           contact: details.phone || "",
//         },
//         theme: { color: "#000000" },
//         modal: {
//           ondismiss: function () {
//             console.log("❌ Payment modal dismissed by user");
//             onFailure({ error: "Payment cancelled by user" }, orderData.orderId);
//           },
//           escape: true,
//           animation: true,
//         },
//       };

//       console.log("🔵 Opening Razorpay checkout...");
//       const razorpay = new window.Razorpay(options);

//       razorpay.on("payment.failed", function (response: any) {
//         console.error("❌ Payment failed:", response.error);
//         onFailure({
//           error: response.error.description || "Payment failed",
//           code: response.error.code,
//           reason: response.error.reason,
//         }, orderData.orderId);
//       });

//       try {
//         razorpay.open();
//       } catch (openError: any) {
//         console.error("❌ Error opening Razorpay checkout:", openError);
//         onFailure({
//           error:
//             "Failed to open payment window. Please check your Razorpay configuration.",
//         }, orderData.orderId);
//       }
//     } catch (error: any) {
//       console.error("❌ Razorpay initialization error:", error);
//       onFailure({ error: error.message || "Failed to initialize payment" });
//     }
//   }

//   // 🔹 Backend: Create Razorpay order
//   private static async createRazorpayOrder(details: PaymentDetails): Promise<any> {
//     try {
//       console.log("🔵 Calling backend to create order...");
//       const response = await fetch("/api/payment/create-order", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(details),
//       });

//       if (!response.ok) {
//         console.error("❌ Order creation failed:", response.status);
//         throw new Error("Failed to create order");
//       }

//       const data = await response.json();
//       console.log("✅ Order created successfully");
//       return data;
//     } catch (error) {
//       console.error("❌ Order creation error:", error);
//       throw error;
//     }
//   }

//   // 🔹 Backend: Verify payment (handles both dummy and Razorpay)
//   static async verifyPayment(paymentData: any): Promise<boolean> {
//     try {
//       console.log("🔵 Verifying payment...", paymentData.method || "razorpay");
//       const response = await fetch("/api/payment/verify", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(paymentData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("❌ Verification failed:", errorData);
//         return false;
//       }

//       const data = await response.json();
//       if (data.success === true) {
//         console.log("✅ Payment verified successfully");
//         return true;
//       } else {
//         console.error("❌ Payment verification returned false");
//         return false;
//       }
//     } catch (error) {
//       console.error("❌ Verification error:", error);
//       return false;
//     }
//   }

//   // 🔹 Backend: Mark transaction as failed
//   static async markTransactionAsFailed(
//     userId: string,
//     orderId: string,
//     reason: string
//   ): Promise<boolean> {
//     try {
//       console.log("🔵 Marking transaction as failed...", orderId);
//       const response = await fetch("/api/payment/mark-failed", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           userId,
//           orderId,
//           failureReason: reason,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("❌ Failed to mark transaction:", errorData);
//         return false;
//       }

//       const data = await response.json();
//       console.log("✅ Transaction marked as failed");
//       return data.success === true;
//     } catch (error) {
//       console.error("❌ Error marking transaction as failed:", error);
//       return false;
//     }
//   }
// }

// services/paymentService.ts
import { PaymentDetails, TransactionType } from "@/types/masterclass";

interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  masterclassId: string;
  videoId?: string; // ✅ NEW
  userId: string;
  masterclassTitle: string;
  videoTitle?: string; // ✅ NEW
  amount: number;
  method?: "razorpay" | "dummy";
  type?: TransactionType; // ✅ NEW
}

export class PaymentService {
  /**
   * ✅ UPDATED: Create Razorpay order with video and type support
   */
  static async createOrder(paymentDetails: PaymentDetails) {
    try {
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentDetails),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      return data;
    } catch (error: any) {
      console.error("❌ Create order error:", error);
      throw error;
    }
  }

  /**
   * ✅ UPDATED: Verify payment with video and type support
   */
  static async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    try {
      const response = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data.success === true;
    } catch (error: any) {
      console.error("❌ Verify payment error:", error);
      throw error;
    }
  }

  /**
   * ✅ UPDATED: Process Razorpay payment with video support
   */
  static async processRazorpayPayment(
    paymentDetails: PaymentDetails,
    description: string,
    onSuccess: (response: any) => void,
    onError: (error: any, orderId?: string) => void,
    onOrderCreated?: (orderId: string) => void
  ) {
    try {
      // Create order
      const orderData = await this.createOrder(paymentDetails);

      if (onOrderCreated) {
        onOrderCreated(orderData.orderId);
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: paymentDetails.type === "upcoming_registration" 
          ? "Masterclass Registration" 
          : paymentDetails.type === "video_purchase"
          ? "Video Purchase"
          : "Masterclass Purchase",
        description: description,
        order_id: orderData.orderId,
        handler: onSuccess,
        modal: {
          ondismiss: async () => {
            console.log("❌ Payment modal dismissed");
            await this.markTransactionAsFailed(
              paymentDetails.userId,
              orderData.orderId,
              "Payment modal dismissed by user"
            );
            onError({ error: "Payment cancelled" }, orderData.orderId);
          },
        },
        prefill: {
          name: paymentDetails.email?.split("@")[0] || "",
          email: paymentDetails.email || "",
          contact: paymentDetails.phone || "",
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const razorpay = new (window as any).Razorpay(options);

      // Handle payment failures
      razorpay.on("payment.failed", async (response: any) => {
        console.error("❌ Payment failed:", response.error);
        await this.markTransactionAsFailed(
          paymentDetails.userId,
          orderData.orderId,
          response.error?.description || "Payment failed"
        );
        onError(response.error, orderData.orderId);
      });

      razorpay.open();
    } catch (error: any) {
      console.error("❌ Process payment error:", error);
      onError(error);
    }
  }

  /**
   * Mark transaction as failed
   */
  static async markTransactionAsFailed(
    userId: string,
    orderId: string,
    failureReason: string
  ) {
    try {
      const response = await fetch("/api/payment/mark-failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          orderId,
          failureReason,
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (error: any) {
      console.error("❌ Mark failed error:", error);
      return false;
    }
  }

  /**
   * ✅ NEW: Get user's purchased videos
   */
  static async getUserPurchasedVideos(userId: string): Promise<string[]> {
    try {
      const response = await fetch(`/api/user/purchased-videos?userId=${userId}`);
      const data = await response.json();
      return data.purchasedVideos || [];
    } catch (error) {
      console.error("❌ Get purchased videos error:", error);
      return [];
    }
  }

  /**
   * ✅ NEW: Check if user has access to video
   */
  static async hasVideoAccess(
    userId: string,
    masterclassId: string,
    videoId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/user/video-access?userId=${userId}&masterclassId=${masterclassId}&videoId=${videoId}`
      );
      const data = await response.json();
      return data.hasAccess === true;
    } catch (error) {
      console.error("❌ Check video access error:", error);
      return false;
    }
  }

  /**
   * ✅ NEW: Get transaction history
   */
  static async getTransactionHistory(userId: string) {
    try {
      const response = await fetch(`/api/user/transactions?userId=${userId}`);
      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error("❌ Get transaction history error:", error);
      return [];
    }
  }
}