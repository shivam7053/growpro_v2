// // app/api/payment/mark-failed/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { updateTransactionStatus } from "@/utils/userUtils";

// export async function POST(req: NextRequest) {
//   try {
//     console.log("🔵 Marking transaction as failed...");
//     const body = await req.json();
//     const { userId, orderId, failureReason } = body;

//     // ✅ Validate required fields
//     if (!userId || !orderId) {
//       console.error("❌ Missing required fields");
//       return NextResponse.json(
//         { success: false, error: "Missing userId or orderId" },
//         { status: 400 }
//       );
//     }

//     // ✅ Update transaction status to failed
//     await updateTransactionStatus(userId, orderId, {
//       status: "failed",
//       failureReason: failureReason || "Payment cancelled or failed",
//     });

//     console.log(`✅ Transaction ${orderId} marked as failed`);

//     return NextResponse.json({
//       success: true,
//       message: "Transaction marked as failed",
//     });
//   } catch (error: any) {
//     console.error("❌ Error marking transaction as failed:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message || "Failed to mark transaction as failed",
//       },
//       { status: 500 }
//     );
//   }
// }

// app/api/payment/mark-failed/route.ts

import { NextRequest, NextResponse } from "next/server";
import { updateTransactionStatus } from "@/utils/userUtils";
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
      errorCode, // ✅ NEW: Razorpay error code
      errorDescription, // ✅ NEW: Detailed error
    } = body;

    // ✅ Validate required fields
    if (!userId || !orderId) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing userId or orderId" },
        { status: 400 }
      );
    }

    // ✅ Get detailed failure reason
    const detailedReason = failureReason || 
      errorDescription || 
      "Payment cancelled or failed";

    // ✅ Check if transaction exists first
    const userRef = doc(db, "user_profiles", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error("❌ User not found");
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const transactions = userData.transactions || [];
    const existingTransaction = transactions.find((txn: any) => txn.orderId === orderId);

    if (!existingTransaction) {
      console.warn("⚠️ Transaction not found, creating failure record");
      
      // Create a failure transaction record
      const failureTransaction = {
        orderId,
        status: "failed",
        failureReason: detailedReason,
        errorCode: errorCode || "PAYMENT_FAILED",
        timestamp: new Date().toISOString(),
        masterclassId: body.masterclassId || "unknown",
        masterclassTitle: body.masterclassTitle || "Unknown Masterclass",
        amount: body.amount || 0,
        method: "razorpay",
      };

      await updateDoc(userRef, {
        transactions: [...transactions, failureTransaction],
      });

      console.log(`✅ Failure transaction created for order ${orderId}`);
      
      return NextResponse.json({
        success: true,
        message: "Failure transaction created",
        created: true,
      });
    }

    // ✅ Update existing transaction to failed
    const updatedTransactions = transactions.map((txn: any) =>
      txn.orderId === orderId
        ? {
            ...txn,
            status: "failed",
            failureReason: detailedReason,
            errorCode: errorCode || txn.errorCode,
            failedAt: new Date().toISOString(),
          }
        : txn
    );

    await updateDoc(userRef, { transactions: updatedTransactions });

    console.log(`✅ Transaction ${orderId} marked as failed with reason: ${detailedReason}`);

    // ✅ Log failure analytics (optional)
    console.log("📊 Payment failure analytics:", {
      userId,
      orderId,
      errorCode,
      failureReason: detailedReason,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Transaction marked as failed",
      updated: true,
    });
  } catch (error: any) {
    console.error("❌ Error marking transaction as failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to mark transaction as failed",
      },
      { status: 500 }
    );
  }
}