// app/api/payment/mark-failed/route.ts

import { NextRequest, NextResponse } from "next/server";
import { updateTransactionStatus } from "@/utils/userUtils";

export async function POST(req: NextRequest) {
  try {
    console.log("🔵 Marking transaction as failed...");
    const body = await req.json();
    const { userId, orderId, failureReason } = body;

    // ✅ Validate required fields
    if (!userId || !orderId) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing userId or orderId" },
        { status: 400 }
      );
    }

    // ✅ Update transaction status to failed
    await updateTransactionStatus(userId, orderId, {
      status: "failed",
      failureReason: failureReason || "Payment cancelled or failed",
    });

    console.log(`✅ Transaction ${orderId} marked as failed`);

    return NextResponse.json({
      success: true,
      message: "Transaction marked as failed",
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