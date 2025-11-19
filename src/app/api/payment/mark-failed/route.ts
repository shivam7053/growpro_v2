// app/api/payment/mark-failed/route.ts

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    console.log("🔵 Marking transaction as failed...");
    const body = await req.json();

    const {
      userId,
      orderId,
      failureReason,
      errorCode,
      errorDescription,
      masterclassId,
      masterclassTitle,
      videoId,
      videoTitle,
      amount,
      type
    } = body;

    // ------------------------------
    // ✅ Validate required fields
    // ------------------------------
    if (!userId || !orderId) {
      return NextResponse.json(
        { success: false, error: "Missing userId or orderId" },
        { status: 400 }
      );
    }

    // ------------------------------
    // ✅ Build failure reason string
    // ------------------------------
    const detailedReason =
      failureReason || errorDescription || "Payment cancelled or failed";

    const userRef = doc(db, "user_profiles", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const transactions = userData.transactions || [];

    // ------------------------------
    // ❗ Check if transaction already exists
    // ------------------------------
    const existingTransaction = transactions.find(
      (txn: any) => txn.orderId === orderId
    );

    // ------------------------------
    // 🚨 CASE 1: Transaction does NOT exist → Create failure record
    // ------------------------------
    if (!existingTransaction) {
      console.warn("⚠️ Transaction not found → creating failure record");

      const failureTransaction = {
        orderId,
        paymentId: undefined,
        masterclassId: masterclassId || "unknown",
        videoId: videoId || undefined,
        masterclassTitle: masterclassTitle || "Unknown Masterclass",
        videoTitle: videoTitle || undefined,
        amount: amount ?? 0,
        status: "failed",
        method: "razorpay",
        type: type || "purchase",
        failureReason: detailedReason,
        errorCode: errorCode || "PAYMENT_FAILED",
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await updateDoc(userRef, {
        transactions: [...transactions, failureTransaction]
      });

      return NextResponse.json({
        success: true,
        created: true,
        message: "Failure transaction created"
      });
    }

    // ------------------------------
    // 🚨 CASE 2: Transaction exists → update status to failed
    // ------------------------------
    const updatedTransactions = transactions.map((txn: any) =>
      txn.orderId === orderId
        ? {
            ...txn,
            status: "failed",
            failureReason: detailedReason,
            errorCode: errorCode || txn.errorCode,
            updatedAt: new Date().toISOString()
          }
        : txn
    );

    await updateDoc(userRef, { transactions: updatedTransactions });

    console.log(
      `✅ Transaction ${orderId} successfully marked as FAILED. Reason: ${detailedReason}`
    );

    return NextResponse.json({
      success: true,
      updated: true,
      message: "Transaction marked as failed"
    });
  } catch (error: any) {
    console.error("❌ mark-failed API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to mark transaction as failed"
      },
      { status: 500 }
    );
  }
}
