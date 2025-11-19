"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { PaymentService } from "@/services/paymentService";
import {
  Masterclass,
  MasterclassVideo,
  TransactionType,
  PaymentDetails,
} from "@/types/masterclass";
import toast from "react-hot-toast";
import { loadRazorpay } from "@/utils/loadRazorpay";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterclass: Masterclass;
  video?: MasterclassVideo;
  user: any;
  /** Make optional */
  onPaymentSuccess?: (paymentData?: any) => void;
  videoId?: string | null;
}

export default function PaymentModal({
  isOpen,
  onClose,
  masterclass,
  video,
  user,
  onPaymentSuccess,
  videoId: propVideoId,
}: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"dummy" | "razorpay" | null>(null);
  const [error, setError] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const videoIdToUse = video?.id || propVideoId || null;

  const isVideoPurchase = !!videoIdToUse;
  const isUpcoming = masterclass.type === "upcoming";

  const purchaseTitle = isVideoPurchase
    ? `${masterclass.title} - ${video?.title || "Video"}`
    : masterclass.title;

  const purchaseAmount = isVideoPurchase
    ? video?.price || 0
    : masterclass.starting_price || 0;

  const getTransactionType = (): TransactionType => {
    if (isUpcoming && !isVideoPurchase && purchaseAmount === 0) return "free_registration";
    if (isUpcoming && !isVideoPurchase && purchaseAmount > 0) return "upcoming_registration";
    if (isVideoPurchase) return "video_purchase";
    return "purchase";
  };

  const transactionType = getTransactionType();

  /** Load Razorpay script */
  useEffect(() => {
    if (isOpen && purchaseAmount > 0) {
      loadRazorpay().then((loaded) => setRazorpayLoaded(!!loaded));
    }
  }, [isOpen, purchaseAmount]);

  /** Reset on open */
  useEffect(() => {
    if (isOpen) {
      setProcessing(false);
      setError("");
      setPaymentMethod(purchaseAmount === 0 ? "dummy" : null);
    }
  }, [isOpen, purchaseAmount]);

  if (!isOpen) return null;

  /** MAIN PAYMENT HANDLER */
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

    const paymentDetails: PaymentDetails = {
      amount: purchaseAmount,
      currency: "INR",
      masterclassId: masterclass.id,
      videoId: videoIdToUse || null,
      userId: user.uid,
      email: user.email || null,
      phone: user.phone || null,
      type: transactionType,
    };

    /** -------------------------
     *    DUMMY PAYMENT
     * ------------------------- */
    if (paymentMethod === "dummy") {
      const dummyOrderId = `dummy_${Date.now()}`;
      const dummyPaymentId = `dummy_pay_${Date.now()}`;

      try {
        const verified = await PaymentService.verifyPayment({
          razorpay_order_id: dummyOrderId,
          razorpay_payment_id: dummyPaymentId,
          razorpay_signature: "dummy_signature",
          masterclassId: masterclass.id,
          videoId: videoIdToUse,
          userId: user.uid,
          masterclassTitle: masterclass.title,
          videoTitle: video?.title || null,
          amount: purchaseAmount,
          method: "dummy",
          type: transactionType,
        });

        if (!verified) throw new Error("Payment verification failed");

        toast.success(
          transactionType === "free_registration"
            ? "Registered successfully!"
            : transactionType === "upcoming_registration"
            ? "Registration completed!"
            : transactionType === "video_purchase"
            ? "Video unlocked!"
            : "Payment successful!"
        );

        /** SAFE CALLBACK */
        if (typeof onPaymentSuccess === "function") {
          onPaymentSuccess({
            orderId: dummyOrderId,
            paymentId: dummyPaymentId,
            masterclassId: masterclass.id,
            videoId: videoIdToUse,
            amount: purchaseAmount,
            method: "dummy",
            type: transactionType,
            timestamp: new Date().toISOString(),
          });
        }

        setTimeout(onClose, 500);
      } catch (err: any) {
        setError(err.message || "Dummy payment failed");
        toast.error(err.message || "Payment failed");
      }

      setProcessing(false);
      return;
    }

    /** -------------------------
     *     RAZORPAY PAYMENT
     * ------------------------- */
    if (paymentMethod === "razorpay") {
      if (!razorpayLoaded) {
        setError("Failed to load Razorpay. Please refresh.");
        return;
      }

      await PaymentService.processRazorpayPayment(
        paymentDetails,
        purchaseTitle,

        /** SUCCESS CALLBACK */
        async (response) => {
          try {
            const verified = await PaymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              masterclassId: masterclass.id,
              videoId: videoIdToUse,
              userId: user.uid,
              masterclassTitle: masterclass.title,
              videoTitle: video?.title || null,
              amount: purchaseAmount,
              method: "razorpay",
              type: transactionType,
            });

            if (!verified) throw new Error("Payment verification failed");

            toast.success(
              transactionType === "video_purchase"
                ? "Video unlocked!"
                : "Payment successful!"
            );

            /** SAFE CALLBACK */
            if (typeof onPaymentSuccess === "function") {
              onPaymentSuccess({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                masterclassId: masterclass.id,
                videoId: videoIdToUse,
                amount: purchaseAmount,
                method: "razorpay",
                type: transactionType,
                timestamp: new Date().toISOString(),
              });
            }

            setTimeout(onClose, 600);
          } catch (verifyErr: any) {
            setError(verifyErr.message || "Verification failed");
            toast.error("Payment verification failed");
          } finally {
            setProcessing(false);
          }
        },

        /** ERROR CALLBACK */
        async (error) => {
          const msg = error?.error?.description || "Payment cancelled";
          setError(msg);
          toast.error(msg);
          setProcessing(false);
        }
      );
    }
  };

  const handleClose = () => {
    if (processing) {
      toast.error("Please wait…");
      return;
    }
    onClose();
  };

  const getHeaderText = () => {
    switch (transactionType) {
      case "free_registration":
        return "Free Registration";
      case "upcoming_registration":
        return "Register Now";
      case "video_purchase":
        return "Purchase Video";
      default:
        return "Complete Purchase";
    }
  };

  const getPurchaseTypeLabel = () => {
    switch (transactionType) {
      case "free_registration":
        return "Free Registration";
      case "upcoming_registration":
        return "Paid Registration";
      case "video_purchase":
        return "Individual Video";
      default:
        return "Full Masterclass";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={handleClose}
            disabled={processing}
            className="absolute top-4 right-4 hover:bg-white hover:bg-opacity-20 rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold mb-2">{getHeaderText()}</h2>
          <p className="text-blue-100 text-sm">
            {purchaseAmount === 0
              ? "This is a free registration"
              : "Secure payment powered by Razorpay"}
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* PURCHASE INFO */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-semibold px-2 py-1 rounded mb-2">
              {getPurchaseTypeLabel()}
            </span>

            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
              {isVideoPurchase ? video?.title : masterclass.title}
            </h3>

            {video && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Part of: {masterclass.title}
              </p>
            )}

            {isUpcoming && masterclass.scheduled_date && (
              <p className="text-xs mt-2 text-blue-600 dark:text-blue-400 font-medium">
                📅 Scheduled:{" "}
                {new Date(masterclass.scheduled_date).toLocaleString()}
              </p>
            )}

            <div className="mt-4 pt-4 border-t flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total Amount</span>
              <span className="text-2xl font-bold">
                {purchaseAmount === 0 ? "FREE" : `₹${purchaseAmount}`}
              </span>
            </div>
          </div>

          {/* ERROR BOX */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-800 p-4 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="flex-1">
                <p className="font-semibold text-red-700 dark:text-red-300">Payment Error</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
              <button onClick={() => setError("")}>
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}

          {/* PAYMENT METHODS */}
          {purchaseAmount > 0 && (
            <div>
              <label className="text-sm font-medium mb-3 block">Payment Method *</label>

              <div className="space-y-2">
                {/* Dummy */}
                <button
                  onClick={() => setPaymentMethod("dummy")}
                  disabled={processing}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 ${
                    paymentMethod === "dummy"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold">Dummy Payment</p>
                    <p className="text-xs text-gray-500">For testing only</p>
                  </div>
                  {paymentMethod === "dummy" && <CheckCircle className="text-blue-600" />}
                </button>

                {/* Razorpay */}
                <button
                  onClick={() => setPaymentMethod("razorpay")}
                  disabled={processing || !razorpayLoaded}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 ${
                    paymentMethod === "razorpay"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold">Razorpay</p>
                    <p className="text-xs text-gray-500">
                      {razorpayLoaded ? "Pay via UPI / Cards" : "Loading..."}
                    </p>
                  </div>
                  {paymentMethod === "razorpay" && (
                    <CheckCircle className="text-blue-600" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={processing}
              className="flex-1 px-6 py-3 border rounded-lg font-semibold"
            >
              Cancel
            </button>

            <button
              onClick={handlePayment}
              disabled={processing || (purchaseAmount > 0 && !paymentMethod)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin w-5 h-5 border-b-2 border-white rounded-full"></div>
                  Processing...
                </>
              ) : purchaseAmount === 0 ? (
                "Register"
              ) : (
                `Pay ₹${purchaseAmount}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
