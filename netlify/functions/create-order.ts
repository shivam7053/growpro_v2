// netlify/functions/create-order.ts
import { Handler } from "@netlify/functions";
import Razorpay from "razorpay";
import { addTransactionRecord } from "../../src/utils/userUtils";
import { adminDb } from "../../src/lib/firebaseAdmin"; // ✅ Use Admin SDK

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: "Method Not Allowed" }),
    };
  }

  const body = JSON.parse(event.body || "{}");

  try {
    const {
      amount,
      currency = "INR",
      masterclassId,
      userId,
      type = "purchase",
    } = body;

    console.log("🔵 Creating Razorpay order (Netlify Function):", {
      amount,
      currency,
      masterclassId,
      userId,
      type,
    });

    // VALIDATION
    if (!masterclassId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Missing required fields: masterclassId, userId" }),
      };
    }

    if (amount <= 0) { // Simplified validation
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Amount must be greater than 0" }),
      };
    }

    // FETCH MASTERCLASS
    let masterclassData: any = null;
    let masterclassTitle = "Unknown Masterclass";

    try {
      const classRef = adminDb.doc(`MasterClasses/${masterclassId}`); // ✅ Use Admin SDK syntax
      const snap = await classRef.get();

      if (snap.exists) {
        masterclassData = snap.data()!;
        masterclassTitle = masterclassData.title || masterclassId;

        const isAlreadyEnrolled = (masterclassData.purchased_by_users || []).includes(userId);
        if (isAlreadyEnrolled) {
          console.warn(`🚨 User ${userId} attempted to re-purchase masterclass ${masterclassId}`);
          return {
            statusCode: 400,
            body: JSON.stringify({ success: false, error: "You are already enrolled in this masterclass" }),
          };
        }
      } else {
        // --- ✅ NEW: Hard failure if masterclass doesn't exist ---
        console.error(`❌ Attempted to create order for non-existent masterclass: ${masterclassId}`);
        throw new Error(`Masterclass with ID ${masterclassId} not found.`);
      }
    } catch (err) {
      console.warn("⚠ Could not fetch masterclass data", err);
    }

    // CREATE RAZORPAY ORDER
    const receipt = `${type}_${userId}_${Date.now()}`
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 40);

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes: {
        masterclassId,
        userId,
        type,
      },
    };

    console.log("🔵 Calling Razorpay API...");
    const order = await razorpay.orders.create(options);

    console.log("✅ Razorpay Order ID:", order.id);

    // Save pending transaction
    await addTransactionRecord(userId, {
      orderId: order.id,
      masterclassId,
      masterclassTitle: masterclassTitle,
      amount,
      status: "pending",
      method: "razorpay",
      type,
      timestamp: new Date().toISOString(),
    });

    console.log("✅ Pending transaction saved");

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        masterclassTitle: masterclassTitle,
        type,
      }),
    };

  } catch (error: any) {
    console.error(`❌ Order creation failed for user ${body?.userId} on masterclass ${body?.masterclassId}:`, error);

    try {
      if (body?.userId) {
        await addTransactionRecord(body.userId, {
          orderId: `failed_${Date.now()}`,
          masterclassId: body.masterclassId ?? "unknown",
          masterclassTitle: "Order Creation Failed",
          amount: body.amount ?? 0,
          status: "failed",
          method: "razorpay",
          type: body.type ?? "purchase",
          failureReason: error.error?.description || error.message || "Order creation failed",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (logErr) {
      console.error("⚠ Could not log failed order:", logErr);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.error?.description || error.message || "Unable to create Razorpay order",
      }),
    };
  }
};