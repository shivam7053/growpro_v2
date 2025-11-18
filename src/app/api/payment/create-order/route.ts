// //create-order/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import Razorpay from "razorpay";
// import { addTransactionRecord } from "@/utils/userUtils";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// // Initialize Razorpay instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });

// export async function POST(req: NextRequest) {
//   try {
//     console.log("🔵 Creating Razorpay order...");
//     const body = await req.json();
//     const { amount, currency = "INR", masterclassId, userId } = body;

//     console.log("🔵 Incoming order request:", { amount, currency, masterclassId, userId });

//     // ✅ Validate required fields
//     if (!amount || !masterclassId || !userId) {
//       console.error("❌ Missing required fields");
//       return NextResponse.json(
//         { success: false, error: "Missing required fields: amount, masterclassId, or userId" },
//         { status: 400 }
//       );
//     }

//     // ✅ Validate amount
//     if (amount <= 0) {
//       console.error("❌ Invalid amount");
//       return NextResponse.json(
//         { success: false, error: "Amount must be greater than 0" },
//         { status: 400 }
//       );
//     }

//     // ✅ Fetch masterclass title (for transaction record)
//     let masterclassTitle = "Unknown Masterclass";
//     try {
//       const masterclassRef = doc(db, "MasterClasses", masterclassId);
//       const snap = await getDoc(masterclassRef);
//       if (snap.exists()) {
//         masterclassTitle = snap.data().title || masterclassId;
//       }
//     } catch (err) {
//       console.warn("⚠️ Could not fetch masterclass title:", err);
//     }

//     // ✅ Short receipt (Razorpay max 40 chars)
//     const shortReceipt = `rcpt_${userId.slice(0, 6)}_${Date.now()}`.slice(0, 40);

//     // ✅ Razorpay order options
//     const options = {
//       amount: Math.round(amount * 100), // Convert to paise
//       currency,
//       receipt: shortReceipt,
//       notes: {
//         masterclassId,
//         userId,
//         createdAt: new Date().toISOString(),
//       },
//     };

//     console.log("🔵 Creating order with Razorpay API...");
//     const order = await razorpay.orders.create(options);
//     console.log("✅ Razorpay order created:", order.id);

//     // ✅ Record pending transaction (only once per order)
//     await addTransactionRecord(userId, {
//       orderId: order.id,
//       masterclassId,
//       masterclassTitle,
//       amount,
//       status: "pending",
//       method: "razorpay",
//       timestamp: new Date().toISOString(),
//     });

//     console.log("✅ Pending transaction recorded successfully");

//     // ✅ Return order to frontend
//     return NextResponse.json({
//       success: true,
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
//     });
//   } catch (error: any) {
//     console.error("❌ Error creating Razorpay order:", error);

//     // 🧩 Log failed creation attempt (optional safety)
//     try {
//       const body = await req.json().catch(() => ({}));
//       if (body.userId) {
//         await addTransactionRecord(body.userId, {
//           orderId: `failed_order_${Date.now()}`,
//           masterclassId: body.masterclassId || "unknown",
//           masterclassTitle: "Order Creation Failed",
//           amount: body.amount || 0,
//           status: "failed",
//           method: "razorpay",
//           failureReason:
//             error.error?.description || error.message || "Order creation failed",
//           timestamp: new Date().toISOString(),
//         });
//       }
//     } catch (logErr) {
//       console.error("⚠️ Could not log failed order:", logErr);
//     }

//     // ✅ Return user-friendly error
//     return NextResponse.json(
//       {
//         success: false,
//         error:
//           error.error?.description ||
//           error.message ||
//           "Failed to create Razorpay order",
//         code: error.error?.code || "UNKNOWN_ERROR",
//       },
//       { status: 500 }
//     );
//   }
// }


// app/api/payment/create-order/route.ts

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { addTransactionRecord } from "@/utils/userUtils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    console.log("🔵 Creating Razorpay order...");
    const body = await req.json();
    const { 
      amount, 
      currency = "INR", 
      masterclassId, 
      videoId, // ✅ NEW: For individual video purchases
      userId,
      type = "purchase" // ✅ NEW: "purchase" | "upcoming_registration" | "video_purchase"
    } = body;

    console.log("🔵 Incoming order request:", { 
      amount, 
      currency, 
      masterclassId, 
      videoId,
      userId, 
      type 
    });

    // ✅ Validate required fields
    if (!amount || !masterclassId || !userId) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields: amount, masterclassId, or userId" },
        { status: 400 }
      );
    }

    // ✅ Validate amount
    if (amount <= 0) {
      console.error("❌ Invalid amount");
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // ✅ Fetch masterclass details
    let masterclassTitle = "Unknown Masterclass";
    let videoTitle = "";
    let masterclassData: any = null;

    try {
      const masterclassRef = doc(db, "MasterClasses", masterclassId);
      const snap = await getDoc(masterclassRef);
      
      if (snap.exists()) {
        masterclassData = snap.data();
        masterclassTitle = masterclassData.title || masterclassId;

        // ✅ If video purchase, get video title
        if (videoId && masterclassData.videos) {
          const video = masterclassData.videos.find((v: any) => v.id === videoId);
          if (video) {
            videoTitle = video.title;
            console.log("✅ Video found:", videoTitle);
          }
        }

        // ✅ Validate upcoming masterclass type
        if (type === "upcoming_registration" && masterclassData.type !== "upcoming") {
          console.error("❌ Not an upcoming masterclass");
          return NextResponse.json(
            { success: false, error: "This masterclass is not an upcoming event" },
            { status: 400 }
          );
        }

        // ✅ Check if user already registered (for upcoming)
        if (type === "upcoming_registration") {
          const joinedUsers = masterclassData.joined_users || [];
          if (joinedUsers.includes(userId)) {
            console.log("⚠️ User already registered");
            return NextResponse.json(
              { success: false, error: "You are already registered for this masterclass" },
              { status: 400 }
            );
          }
        }

        // ✅ Validate amount matches expected price
        if (type === "upcoming_registration") {
          if (masterclassData.starting_price !== amount) {
            console.warn("⚠️ Amount mismatch:", { 
              expected: masterclassData.starting_price, 
              received: amount 
            });
          }
        }

        if (type === "video_purchase" && videoId) {
          const video = masterclassData.videos?.find((v: any) => v.id === videoId);
          if (video && video.price !== amount) {
            console.warn("⚠️ Video price mismatch:", { 
              expected: video.price, 
              received: amount 
            });
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch masterclass details:", err);
    }

    // ✅ Create descriptive title for transaction
    const transactionTitle = videoId && videoTitle
      ? `${masterclassTitle} - ${videoTitle}`
      : masterclassTitle;

    // ✅ Short receipt (Razorpay max 40 chars)
    const shortReceipt = `${type.slice(0, 8)}_${userId.slice(0, 6)}_${Date.now()}`.slice(0, 40);

    // ✅ Razorpay order options
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: shortReceipt,
      notes: {
        masterclassId,
        videoId: videoId || "",
        userId,
        type,
        createdAt: new Date().toISOString(),
      },
    };

    console.log("🔵 Creating order with Razorpay API...");
    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", order.id);

    // ✅ Record pending transaction
    await addTransactionRecord(userId, {
      orderId: order.id,
      masterclassId,
      videoId: videoId || undefined,
      masterclassTitle: transactionTitle,
      videoTitle: videoTitle || undefined,
      amount,
      status: "pending",
      method: "razorpay",
      type, // ✅ NEW: Store transaction type
      timestamp: new Date().toISOString(),
    });

    console.log("✅ Pending transaction recorded successfully");

    // ✅ Return order to frontend
    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      masterclassTitle: transactionTitle,
      type,
    });
  } catch (error: any) {
    console.error("❌ Error creating Razorpay order:", error);

    // 🧩 Log failed creation attempt
    try {
      const body = await req.json().catch(() => ({}));
      if (body.userId) {
        await addTransactionRecord(body.userId, {
          orderId: `failed_order_${Date.now()}`,
          masterclassId: body.masterclassId || "unknown",
          videoId: body.videoId || undefined,
          masterclassTitle: "Order Creation Failed",
          amount: body.amount || 0,
          status: "failed",
          method: "razorpay",
          type: body.type || "purchase",
          failureReason:
            error.error?.description || error.message || "Order creation failed",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (logErr) {
      console.error("⚠️ Could not log failed order:", logErr);
    }

    // ✅ Return user-friendly error
    return NextResponse.json(
      {
        success: false,
        error:
          error.error?.description ||
          error.message ||
          "Failed to create Razorpay order",
        code: error.error?.code || "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}