import React, { useState } from "react";
import { X, CreditCard, Shield, CheckCircle } from "lucide-react";
import { PaymentService } from "@/services/paymentService";
import { Masterclass } from "@/types/masterclass";
import toast from "react-hot-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterclass: Masterclass;
  user: any;
  onPaymentSuccess: (paymentData?: any) => void; // ✅ Updated type
}

export default function PaymentModal({
  isOpen,
  onClose,
  masterclass,
  user,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"dummy" | "razorpay">("dummy");

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!user?.uid) {
      toast.error("Please login to continue");
      return;
    }

    setProcessing(true);

    try {
      const paymentDetails = {
        amount: masterclass.price,
        currency: "INR",
        masterclassId: masterclass.id,
        userId: user.uid,
        email: user.email,
        phone: user.phone,
      };

      if (paymentMethod === "dummy") {
        // ✅ Dummy payment for testing
        const response = await PaymentService.processDummyPayment(paymentDetails);

        if (response.success) {
          const paymentData = {
            orderId: "dummy_order_" + Date.now(),
            paymentId: "dummy_payment_" + Date.now(),
            masterclassId: masterclass.id,
            amount: masterclass.price,
            method: "dummy",
            timestamp: new Date().toISOString(),
          };

          toast.success("Payment successful!");
          onPaymentSuccess(paymentData); // ✅ pass data to parent
          onClose();
        } else {
          toast.error("Payment failed");
        }

        setProcessing(false);
      } else {
        // ✅ Razorpay payment - handle asynchronously
        PaymentService.processRazorpayPayment(
          paymentDetails,
          async (response) => {
            try {
              // Verify payment on backend
              const verified = await PaymentService.verifyPayment({
                ...response,
                masterclassId: masterclass.id,
                userId: user.uid,
                masterclassTitle: masterclass.title,
                amount: masterclass.price,
              });

              if (verified) {
                const paymentData = {
                  orderId: response.orderId,
                  paymentId: response.paymentId,
                  masterclassId: masterclass.id,
                  amount: masterclass.price,
                  method: "razorpay",
                  timestamp: new Date().toISOString(),
                };

                toast.success("Payment successful!");
                onPaymentSuccess(paymentData); // ✅ pass data to parent
                onClose();
              } else {
                toast.error("Payment verification failed");
              }
            } catch (error) {
              console.error("Verification error:", error);
              toast.error("Payment verification failed");
            } finally {
              setProcessing(false);
            }
          },
          (error) => {
            console.error("Payment error:", error);
            toast.error(error.error || "Payment failed");
            setProcessing(false);
          }
        ).catch((error) => {
          console.error("Razorpay initialization error:", error);
          toast.error("Failed to initialize payment");
          setProcessing(false);
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold mb-2">Complete Your Purchase</h2>
          <p className="text-blue-100 text-sm">Secure payment powered by Razorpay</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Masterclass Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {masterclass.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              By {masterclass.speaker_name}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Total Amount</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{masterclass.price}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Payment Method
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod("dummy")}
                className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                  paymentMethod === "dummy"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Dummy Payment (Test Mode)
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    For testing purposes only
                  </div>
                </div>
                {paymentMethod === "dummy" && (
                  <CheckCircle className="w-5 h-5 ml-auto text-blue-600" />
                )}
              </button>

              <button
                onClick={() => setPaymentMethod("razorpay")}
                className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                  paymentMethod === "razorpay"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                }`}
              >
                <Shield className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Razorpay (Live Mode)
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    UPI, Cards, Netbanking & more
                  </div>
                </div>
                {paymentMethod === "razorpay" && (
                  <CheckCircle className="w-5 h-5 ml-auto text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 p-4 rounded-lg">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800 dark:text-green-300">
              <p className="font-semibold mb-1">Secure Payment</p>
              <p className="text-xs">Your payment information is encrypted and secure.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay ₹{masterclass.price}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
