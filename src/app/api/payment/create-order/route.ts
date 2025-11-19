import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { addTransactionRecord } from "@/utils/userUtils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      amount,
      currency = "INR",
      masterclassId,
      videoId,
      userId,
      type = "purchase", // purchase | upcoming_registration | video_purchase
    } = body;

    console.log("🔵 Creating Razorpay order:", {
      amount,
      currency,
      masterclassId,
      videoId,
      userId,
      type,
    });

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------
    if (!masterclassId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: masterclassId, userId",
        },
        { status: 400 }
      );
    }

    if (type !== "upcoming_registration" && (!amount || amount <= 0)) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // FETCH MASTERCLASS
    // -----------------------------------------
    let masterclassData: any = null;
    let masterclassTitle = "Unknown Masterclass";
    let videoTitle: string | undefined = undefined;

    try {
      const classRef = doc(db, "MasterClasses", masterclassId);
      const snap = await getDoc(classRef);

      if (snap.exists()) {
        masterclassData = snap.data();
        masterclassTitle = masterclassData.title || masterclassId;

        if (videoId && masterclassData.videos) {
          const video = masterclassData.videos.find((v: any) => v.id === videoId);
          if (video) videoTitle = video.title;
        }

        // UPCOMING VALIDATION (ONLY VALIDATION, NO AUTO-REGISTRATION)
        if (type === "upcoming_registration") {
          if (masterclassData.type !== "upcoming") {
            return NextResponse.json(
              { success: false, error: "This is not an upcoming masterclass" },
              { status: 400 }
            );
          }

          const joined = masterclassData.joined_users || [];
          if (joined.includes(userId)) {
            return NextResponse.json(
              { success: false, error: "You are already registered" },
              { status: 400 }
            );
          }

          console.log("🟢 Upcoming registration validated → Payment flow will continue.");
        }
      }
    } catch (err) {
      console.warn("⚠ Could not fetch masterclass data", err);
    }

    const combinedTitle = videoTitle
      ? `${masterclassTitle} - ${videoTitle}`
      : masterclassTitle;

    // -----------------------------------------
    // UPCOMING REGISTRATION → NOW DOES NOT AUTO-REGISTER
    // -----------------------------------------
    // ❌ Removed old behavior:
    //      - No free registration here
    //      - Payment flow continues normally
    // ✔ Frontend decides free OR paid

    // -----------------------------------------
    // NORMAL PAYMENT FLOW
    // -----------------------------------------
    const receipt = `${type}_${userId}_${Date.now()}`
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 40);

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes: {
        masterclassId,
        videoId: videoId ?? "",
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
      videoId: videoId ?? undefined,
      masterclassTitle: combinedTitle,
      videoTitle: videoTitle ?? undefined,
      amount,
      status: "pending",
      method: "razorpay",
      type,
      timestamp: new Date().toISOString(),
    });

    console.log("✅ Pending transaction saved");

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      masterclassTitle: combinedTitle,
      type,
    });
  } catch (error: any) {
    console.error("❌ Order creation failed:", error);

    try {
      const body = await req.json().catch(() => ({}));

      if (body?.userId) {
        await addTransactionRecord(body.userId, {
          orderId: `failed_${Date.now()}`,
          masterclassId: body.masterclassId ?? "unknown",
          videoId: body.videoId ?? undefined,
          masterclassTitle: "Order Creation Failed",
          amount: body.amount ?? 0,
          status: "failed",
          method: "razorpay",
          type: body.type ?? "purchase",
          failureReason:
            error.error?.description || error.message || "Order creation failed",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (logErr) {
      console.error("⚠ Could not log failed order:", logErr);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error.error?.description ||
          error.message ||
          "Unable to create Razorpay order",
      },
      { status: 500 }
    );
  }
}
