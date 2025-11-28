


// components/PaymentModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { PaymentService } from "@/services/paymentService";
import {
  Masterclass,
  MasterclassContent,
  TransactionType,
  PaymentDetails,
} from "@/types/masterclass";
import toast from "react-hot-toast";
import { loadRazorpay } from "@/utils/loadRazorpay";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterclass: Masterclass;
  user: any;
  onPurchaseSuccess?: () => void;
  // The type of purchase is now more explicit
  purchaseType: "purchase";
  amount?: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  masterclass,
  user,
  onPurchaseSuccess,
  purchaseType: propPurchaseType,
  amount: propAmount,
}: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"dummy" | "razorpay" | null>(null);
  const [error, setError] = useState("");

  // Determine the amount based on the prop or the content item's price.
  // Fallback to 0 if no amount is provided.
  const purchaseAmount =
    propAmount !== undefined ? propAmount : masterclass.price || 0;

  // The transaction type is now directly derived from the `purchaseType` prop.
  const transactionType: TransactionType = 'purchase';

  const purchaseTitle = masterclass.title;

  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  useEffect(() => {
    if (isOpen && purchaseAmount > 0) {
      loadRazorpay().then((loaded) => setRazorpayLoaded(!!loaded));
    }
  }, [isOpen, purchaseAmount]);

  useEffect(() => {
    if (isOpen) {
      setProcessing(false);
      setError("");
      setPaymentMethod(purchaseAmount === 0 ? "dummy" : null);
    }
  }, [isOpen, purchaseAmount]);

  if (!isOpen) return null;

  const safeExtractError = (data: any) => {
    if (!data) return "Unexpected error occurred";

    if (typeof data === "string") return data;

    return (
      data.error ||
      data.message ||
      data.details ||
      data.reason ||
      "Something went wrong"
    );
  };

  const handleSuccessCallback = () => onPurchaseSuccess?.();

  const handlePayment = async () => {
    if (!user?.uid) {
      toast.error("Please login to continue");
      return;
    }

    if (purchaseAmount > 0 && !paymentMethod) {
      setError("Please select a payment method");
      toast.error("Please select a payment method");
      return;
    }

    setProcessing(true);
    setError("");

    // --- ✅ NEW: Initial toast to indicate payment process has started ---
    const initialToastId = toast.loading("Initiating payment process...");

    const paymentDetails: PaymentDetails = {
      amount: purchaseAmount,
      currency: "INR",
      masterclassId: masterclass.id,
      userId: user.uid,
      email: user.email || undefined,
      phone: user.phone || undefined,
      type: transactionType,
      masterclassTitle: masterclass.title,
    };

    /* DUMMY PAYMENT */
    if (paymentMethod === "dummy") {
      const dummyOrderId = `dummy_${Date.now()}`;
      const dummyPaymentId = `dummy_pay_${Date.now()}`;

      toast.dismiss(initialToastId); // Dismiss initial loading toast

      // ✅ CORRECTED: Show a more accurate toast message based on the purchase amount.
      const toastMessage = purchaseAmount === 0 ? "Processing free registration..." : "Processing dummy payment...";
      toast.loading(toastMessage, { id: "dummyProcessing" });

      try {
        const verifyResponse = await fetch(
          "/.netlify/functions/payment-verify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: dummyOrderId,
              razorpay_payment_id: dummyPaymentId,
              razorpay_signature: "dummy_signature",
              masterclassId: masterclass.id,
              userId: user.uid,
              masterclassTitle: masterclass.title,
              amount: purchaseAmount,
              method: "dummy",
              type: transactionType,
            }),
          }
        );

        const verifyData = await verifyResponse.json();

        toast.dismiss("dummyProcessing"); // Dismiss dummy processing toast

        if (!verifyData?.success) {
          const msg = safeExtractError(verifyData);
          throw new Error(msg);
        }

        // --- ✅ NEW: On-screen notification that email sending has started ---
        toast.success("Purchase successful! Sending confirmation email...");

        handleSuccessCallback();

        setTimeout(onClose, 3000); // ✅ Increased duration for toast visibility
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setProcessing(false);
      }

      return;
    }

    /* RAZORPAY PAYMENT */
    if (paymentMethod === "razorpay") {
      if (!razorpayLoaded) {
        setError("Failed to load Razorpay. Please refresh.");
        toast.dismiss(initialToastId); // Dismiss initial loading toast
        setProcessing(false);
        return;
      }

      try {
        await PaymentService.processRazorpayPayment(
          paymentDetails,
          purchaseTitle,

          // SUCCESS
          async (response) => {
            try {
              // --- ✅ NEW: On-screen notification for verification step ---
              toast.loading("Verifying payment, please wait...");

              const verifyRes = await fetch(
                "/.netlify/functions/payment-verify",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    masterclassId: masterclass.id,
                    userId: user.uid,
                    masterclassTitle: masterclass.title,
                    amount: purchaseAmount,
                    method: "razorpay",
                    type: transactionType,
                  }),
                }
              );

              const verifyData = await verifyRes.json();

              toast.dismiss(); // Remove the "Verifying..." toast

              if (!verifyData?.success) {
                throw new Error(safeExtractError(verifyData));
              }

              toast.success("Payment successful! Sending confirmation email...");

              handleSuccessCallback();

              setTimeout(onClose, 3000); // ✅ Increased duration for toast visibility
            } catch (err: any) {
              const msg = safeExtractError(err);
              toast.dismiss();
              setError(msg);
              toast.error(msg);
            } finally {
              setProcessing(false);
            }
          },

          // FAILURE
          (error) => {
            const msg =
              (toast.dismiss(initialToastId), error?.error?.description) || // Dismiss initial loading toast on failure
              safeExtractError(error) ||
              "Payment cancelled";
            setError(msg);
            toast.error(msg);
            setProcessing(false);
          }
        );
      } catch (err: any) {
        setError(err.message || "Payment failed");
        toast.error(err.message || "Payment failed");
        setProcessing(false);
      }
    }
  };

  const handleClose = () => {
    if (processing) {
      toast.error("Payment is still processing, please wait");
      return;
    }
    onClose();
  };

  const getHeaderText = () => "Complete Purchase";

  const getPurchaseTypeLabel = () => {
    return "Masterclass Purchase";
  };

  const getButtonText = () => {
    if (processing) return "Processing...";
    return purchaseAmount === 0 ? "Register Now" : `Pay ₹${purchaseAmount}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white relative">
          <button
            onClick={handleClose}
            disabled={processing}
            className="absolute top-3 right-3 hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-lg font-bold mb-1">Complete Purchase</h2>
          <p className="text-blue-100 text-xs">
            {purchaseAmount === 0
              ? "Complete your free registration"
              : "Secure payment powered by Razorpay"}
          </p>
        </div>

        <div className="p-4 space-y-4">

          {/* Purchase Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[10px] font-semibold px-2 py-0.5 rounded mb-1">
              {getPurchaseTypeLabel()}
            </span>

            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 text-sm">
              {purchaseTitle}
            </h3>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Total Amount</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {purchaseAmount === 0 ? "FREE" : `₹${purchaseAmount}`}
              </span>
            </div>
          </div>

          {/* Info Box */}
          {purchaseAmount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2 rounded-md">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-blue-800 dark:text-blue-200">You'll receive a confirmation email with access details.</p>
              </div>
            </div>
          )}

          {/* ERROR BLOCK */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 p-3 rounded-md">
              <div className="flex gap-2">
                <AlertCircle className="text-red-600 dark:text-red-400 w-4 h-4" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 dark:text-red-300 text-xs">
                    Payment Error
                  </p>
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-600 dark:text-red-400 hover:text-red-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {purchaseAmount > 0 && (
            <div>
              <label className="text-xs font-medium mb-2 block text-gray-700 dark:text-gray-300">
                Select Payment Method *
              </label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("dummy")}
                  disabled={processing}
                  className={`w-full p-3 rounded-md border flex items-center gap-2 text-sm ${
                    paymentMethod === "dummy"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs">Dummy Payment</span>
                  {paymentMethod === "dummy" && (
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("razorpay")}
                  disabled={processing || !razorpayLoaded}
                  className={`w-full p-3 rounded-md border flex items-center gap-2 text-sm ${
                    paymentMethod === "razorpay"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Razorpay</span>
                  {paymentMethod === "razorpay" && (
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              className="flex-1 py-2 border rounded-md text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePayment}
              disabled={processing || (purchaseAmount > 0 && !paymentMethod)}
              className="flex-1 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1"
            >
              {processing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-b-2 border-white rounded-full"></div>
                  Processing...
                </>
              ) : (
                getButtonText()
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
