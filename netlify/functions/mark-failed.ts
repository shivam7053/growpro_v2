// netlify/functions/mark-failed.ts

import { Handler } from "@netlify/functions";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../src/lib/firebase"; // Client-side Firebase for Firestore operations
import { adminAuth } from "../../src/lib/firebaseAdmin"; // Admin SDK for auth verification
import { Transaction } from "../../src/types/masterclass"; // Import Transaction type

export const handler: Handler = async (event, context) => {
  try {
    console.log("🔵 Marking transaction as failed (Netlify Function)...");

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, error: "Method Not Allowed" }),
      };
    }

    // ===================================
    // 🔐 AUTHENTICATION
    // ===================================
    const authHeader = event.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Unauthorized - No token provided" }),
      };
    }

    const token = authHeader.split("Bearer ")[1];
    let authenticatedUserId: string;

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      authenticatedUserId = decodedToken.uid;
    } catch (authError) {
      console.error("❌ Authentication token verification failed:", authError);
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Invalid authentication token" }),
      };
    }

    // ===================================
    // 📥 PARSE & VALIDATE REQUEST
    // ===================================
    const body = JSON.parse(event.body || "{}");

    const {
      userId,
      orderId,
      failureReason,
      errorCode,
      errorDescription,
      masterclassId,
      masterclassTitle,
      amount,
      type,
    } = body;

    // Validate required fields
    if (!userId || !orderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Missing userId or orderId" }),
      };
    }

    // Ensure user can only modify their own transactions
    if (userId !== authenticatedUserId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: "Forbidden - Cannot modify other users' transactions" }),
      };
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
      const transactions: Transaction[] = userData?.transactions || [];

      // Check if transaction exists
      const existingIndex = transactions.findIndex(
        (txn: Transaction) => txn.orderId === orderId
      );

      const detailedReason =
        failureReason || errorDescription || "Payment cancelled or failed";

      // ===================================
      // 🚨 CASE 1: Transaction doesn't exist → Create failure record
      // ===================================
      if (existingIndex === -1) {
        console.warn("⚠️ Transaction not found → creating failure record");

        const failureTransaction: Transaction = {
          orderId,
          paymentId: undefined,
          masterclassId: masterclassId || "unknown",
          masterclassTitle: masterclassTitle || "Unknown Masterclass",
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
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          alreadyFailed: true,
          message: "Transaction was already marked as failed",
        }),
      };
    }

    if (result.created) {
      console.log(`✅ Failure transaction created for order ${orderId}`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          created: true,
          message: "Failure transaction created",
        }),
      };
    }

    if (result.updated) {
      console.log(`✅ Transaction ${orderId} marked as failed`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          updated: true,
          message: "Transaction marked as failed",
        }),
      };
    }

    // Shouldn't reach here
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Unexpected state",
      }),
    };

  } catch (error: any) {
    console.error("❌ mark-failed Netlify function error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || "Failed to mark transaction as failed",
      }),
    };
  }
};