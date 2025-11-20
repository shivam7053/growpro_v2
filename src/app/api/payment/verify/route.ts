// app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  addPurchasedClass,
  addPurchasedVideo,
  addTransactionRecord,
  updateTransactionStatus,
} from "@/utils/userUtils";

// 🔥 Base URL Fix
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3000";

console.log("BASE_URL:", BASE_URL);


/* ---------------------------------------------------------
   Helper: Send Registration Email
--------------------------------------------------------- */
async function sendRegistrationEmail(
  email: string,
  userName: string,
  masterclass: any,
  masterclassId: string
) {
  try {
    await fetch(`${BASE_URL}/api/send-registration-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        userName,
        masterclassTitle: masterclass.title,
        speakerName: masterclass.speaker_name,
        scheduledDate: masterclass.scheduled_date,
        masterclassId,
      }),
    });
    console.log("✅ Registration email sent");
  } catch (err) {
    console.error("❌ Registration email error:", err);
  }
}

/* ---------------------------------------------------------
   Helper: Send Purchase Confirmation Email
--------------------------------------------------------- */
async function sendPurchaseConfirmationEmail(
  email: string,
  userName: string,
  orderId: string,
  paymentId: string,
  masterclassId: string,
  masterclassTitle: string,
  videoId: string | null,
  videoTitle: string | null,
  amount: number,
  purchaseType: "video" | "upcoming_registration" | "masterclass"
) {
  try {
    await fetch(`${BASE_URL}/api/send-purchase-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        userName,
        masterclassTitle,
        videoTitle,
        amount,
        orderId,
        paymentId,
        masterclassId,
        videoId,
        purchaseType,
      }),
    });
    console.log("✅ Purchase confirmation email sent");
  } catch (err) {
    console.error("❌ Purchase confirmation email error:", err);
  }
}

/* ---------------------------------------------------------
   MAIN VERIFY HANDLER
--------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    console.log("🔵 Payment verification started...");
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      masterclassId,
      videoId,
      userId,
      masterclassTitle,
      videoTitle,
      amount,
      method = "razorpay",
      type = "purchase",
    } = body;

    /* ---------------------------------------------------------
       🧩 1. Dummy Payment Handling
    --------------------------------------------------------- */
    if (razorpay_order_id?.startsWith("dummy_")) {
      console.log("🧩 Dummy payment detected");

      // Get user data
      const userRef = doc(db, "user_profiles", userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;
      const userEmail = userData?.email;
      const userName = userData?.name || userData?.displayName || "";

      const existing = userSnap.exists() ? userData?.transactions || [] : [];

      const alreadyExists = existing.some(
        (t: any) => t.orderId === razorpay_order_id
      );

      if (!alreadyExists) {
        await addTransactionRecord(userId, {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id ?? `dummy_${Date.now()}`,
          masterclassId: masterclassId ?? undefined,
          videoId: videoId ?? undefined,
          masterclassTitle: masterclassTitle ?? "Dummy Masterclass",
          videoTitle: videoTitle ?? undefined,
          amount: amount ?? 0,
          status: "success",
          type,
          method,
          timestamp: new Date().toISOString(),
        });
        console.log("✅ Dummy transaction recorded");
      } else {
        console.log("ℹ️ Dummy transaction already exists");
      }

      // Grant access
      if (videoId) {
        await addPurchasedVideo(userId, videoId);
        console.log("✅ User granted video access (dummy)");
      } else if (masterclassId) {
        const mcRef = doc(db, "MasterClasses", masterclassId);
        const mcSnap = await getDoc(mcRef);
        
        if (mcSnap.exists()) {
          const mcData = mcSnap.data();
          const already = (mcData.joined_users || []).includes(userId);
          
          if (!already) {
            await updateDoc(mcRef, { joined_users: arrayUnion(userId) });
            console.log("✅ User added to masterclass (dummy)");
          }
          
          await addPurchasedClass(userId, mcData.title ?? null);
        }
      }

      // Send emails (only for paid purchases)
      if (amount > 0 && userEmail) {
        const mcRef = doc(db, "MasterClasses", masterclassId);
        const mcSnap = await getDoc(mcRef);
        const mcData = mcSnap.exists() ? mcSnap.data() : null;

        // Determine purchase type
        const isUpcoming = mcData?.type === "upcoming";
        const purchaseType = videoId 
          ? "video" 
          : isUpcoming 
            ? "upcoming_registration" 
            : "masterclass";

        // Send purchase confirmation
        await sendPurchaseConfirmationEmail(
          userEmail,
          userName,
          razorpay_order_id,
          razorpay_payment_id,
          masterclassId,
          masterclassTitle || mcData?.title || "Unknown",
          videoId,
          videoTitle ?? null,
          amount,
          purchaseType
        );

        // Send registration email for upcoming events
        if (isUpcoming && !videoId) {
          await sendRegistrationEmail(
            userEmail,
            userName,
            mcData,
            masterclassId
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: "Dummy payment completed",
        type,
      });
    }

    /* ---------------------------------------------------------
       2. Validate real Razorpay parameters
    --------------------------------------------------------- */
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment details" },
        { status: 400 }
      );
    }

    if (!masterclassId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing masterclassId or userId" },
        { status: 400 }
      );
    }

    /* ---------------------------------------------------------
       3. Verify Razorpay signature
    --------------------------------------------------------- */
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Invalid Razorpay signature");

      await updateTransactionStatus(userId, razorpay_order_id, {
        status: "failed",
        failureReason: "Invalid payment signature",
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json(
        { success: false, error: "Invalid Razorpay signature" },
        { status: 400 }
      );
    }

    console.log("✅ Signature verified");

    /* ---------------------------------------------------------
       4. Get user and masterclass data
    --------------------------------------------------------- */
    const userRef = doc(db, "user_profiles", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : null;
    const userEmail = userData?.email;
    const userName = userData?.name || userData?.displayName || "";

    const mcRef = doc(db, "MasterClasses", masterclassId);
    const mcSnap = await getDoc(mcRef);

    if (!mcSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Masterclass not found" },
        { status: 404 }
      );
    }

    const mcData = mcSnap.data();
    let selectedVideoTitle: string | undefined = videoTitle;

    /* ---------------------------------------------------------
       5. Video purchase OR Full class enrollment
    --------------------------------------------------------- */
    if (videoId) {
      // Video purchase
      const video = mcData.videos?.find((v: any) => v.id === videoId);
      if (video && !selectedVideoTitle) {
        selectedVideoTitle = video.title;
      }

      await addPurchasedVideo(userId, videoId);
      console.log("🎬 Video access granted");
    } else {
      // Full masterclass purchase
      const already = (mcData.joined_users || []).includes(userId);
      
      if (!already) {
        await updateDoc(mcRef, { joined_users: arrayUnion(userId) });
        console.log("✅ User added to masterclass");
      }

      await addPurchasedClass(userId, mcData.title ?? null);
      console.log("🎓 Full masterclass access granted");
    }

    /* ---------------------------------------------------------
       6. Update transaction to success
    --------------------------------------------------------- */
    await updateTransactionStatus(userId, razorpay_order_id, {
      paymentId: razorpay_payment_id,
      status: "success",
      type: type ?? undefined,
      videoTitle: selectedVideoTitle ?? undefined,
      updatedAt: new Date().toISOString(),
    });
    console.log("✅ Transaction updated to success");

    /* ---------------------------------------------------------
       7. Send emails
    --------------------------------------------------------- */
    if (userEmail) {
      const isUpcoming = mcData.type === "upcoming";
      const purchaseType = videoId 
        ? "video" 
        : isUpcoming 
          ? "upcoming_registration" 
          : "masterclass";

      // Always send purchase confirmation for paid purchases
      if (amount > 0) {
        await sendPurchaseConfirmationEmail(
          userEmail,
          userName,
          razorpay_order_id,
          razorpay_payment_id,
          masterclassId,
          masterclassTitle || mcData.title,
          videoId,
          selectedVideoTitle ?? null, 
          amount,
          purchaseType
        );
      }

      // Send registration email for upcoming events (full purchase only)
      if (isUpcoming && !videoId) {
        await sendRegistrationEmail(
          userEmail,
          userName,
          mcData,
          masterclassId
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      type,
      videoId: videoId ?? null,
    });
  } catch (err: any) {
    console.error("❌ Payment verify error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}