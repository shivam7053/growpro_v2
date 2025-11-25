// app/api/payment/mark-failed/route.ts

import { NextRequest, NextResponse } from "next/server";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebaseAdmin";


export async function POST(req: NextRequest) {
  try {
    console.log("🔵 Marking transaction as failed...");

    // ===================================
    // 🔐 AUTHENTICATION
    // ===================================
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let authenticatedUserId: string;

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      authenticatedUserId = decodedToken.uid;
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // ===================================
    // 📥 PARSE & VALIDATE REQUEST
    // ===================================
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
      type,
    } = body;

    // Validate required fields
    if (!userId || !orderId) {
      return NextResponse.json(
        { success: false, error: "Missing userId or orderId" },
        { status: 400 }
      );
    }

    // Ensure user can only modify their own transactions
    if (userId !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Cannot modify other users' transactions" },
        { status: 403 }
      );
    }

    // ===================================
    // 🔄 ATOMIC TRANSACTION UPDATE
    // ===================================
    const userRef = doc(db, "user_profiles", userId);

    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      const userData = userSnap.data();
      const transactions = userData.transactions || [];

      // Check if transaction exists
      const existingIndex = transactions.findIndex(
        (txn: any) => txn.orderId === orderId
      );

      const detailedReason =
        failureReason || errorDescription || "Payment cancelled or failed";

      // ===================================
      // 🚨 CASE 1: Transaction doesn't exist → Create failure record
      // ===================================
      if (existingIndex === -1) {
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
          updatedAt: new Date().toISOString(),
        };

        transaction.update(userRef, {
          transactions: [...transactions, failureTransaction],
        });

        return { created: true, updated: false };
      }

      // ===================================
      // 🚨 CASE 2: Transaction exists
      // ===================================
      const existingTxn = transactions[existingIndex];

      // Idempotency check - already failed
      if (existingTxn.status === "failed") {
        console.log("ℹ️ Transaction already marked as failed - idempotent response");
        return { created: false, updated: false, alreadyFailed: true };
      }

      // Prevent overwriting successful payments
      if (existingTxn.status === "success") {
        console.warn("⚠️ Attempted to mark successful payment as failed!");
        throw new Error("Cannot mark successful payment as failed");
      }

      // Update to failed
      const updatedTransactions = [...transactions];
      updatedTransactions[existingIndex] = {
        ...existingTxn,
        status: "failed",
        failureReason: detailedReason,
        errorCode: errorCode || existingTxn.errorCode,
        updatedAt: new Date().toISOString(),
      };

      transaction.update(userRef, {
        transactions: updatedTransactions,
      });

      return { created: false, updated: true };
    });

    // ===================================
    // ✅ RETURN APPROPRIATE RESPONSE
    // ===================================
    if (result.alreadyFailed) {
      return NextResponse.json({
        success: true,
        alreadyFailed: true,
        message: "Transaction was already marked as failed",
      });
    }

    if (result.created) {
      console.log(`✅ Failure transaction created for order ${orderId}`);
      return NextResponse.json({
        success: true,
        created: true,
        message: "Failure transaction created",
      });
    }

    if (result.updated) {
      console.log(`✅ Transaction ${orderId} marked as failed`);
      return NextResponse.json({
        success: true,
        updated: true,
        message: "Transaction marked as failed",
      });
    }

    // Shouldn't reach here
    return NextResponse.json({
      success: false,
      error: "Unexpected state",
    }, { status: 500 });

  } catch (error: any) {
    console.error("❌ mark-failed API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to mark transaction as failed",
      },
      { status: 500 }
    );
  }
}