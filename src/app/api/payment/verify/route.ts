import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { doc, updateDoc, arrayUnion, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  addPurchasedClass,
  addPurchasedVideo,
  addTransactionRecord,
} from "@/utils/userUtils";

/* ---------------------------------------------------------
   Helper: Convert undefined → null before storing in Firestore
   (keeps Firestore safe; storage expects nulls for missing)
--------------------------------------------------------- */
function sanitizeTx(tx: any) {
  const out: any = {};
  for (const key of Object.keys(tx || {})) {
    const val = tx[key];
    out[key] = val === undefined ? null : val;
  }
  return out;
}

/* ---------------------------------------------------------
   Send Registration Email (For upcoming masterclass)
--------------------------------------------------------- */
async function sendRegistrationEmail(email: string, masterclass: any) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-registration-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        masterclassId: masterclass.id,
        masterclassTitle: masterclass.title,
        speakerName: masterclass.speaker_name,
        scheduledDate: masterclass.scheduled_date,
      }),
    });
    console.log("📧 Registration email sent");
  } catch (err) {
    console.error("⚠️ Failed to send registration email:", err);
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
      amount,
      method = "razorpay",
      type = "purchase",
    } = body;

    /* ---------------------------------------------------------
       🧩 1. Dummy Payment Handling
    --------------------------------------------------------- */
    if (razorpay_order_id?.startsWith("dummy_")) {
      console.log("🧩 Dummy payment detected");

      const userRef = doc(db, "user_profiles", userId);
      const snap = await getDoc(userRef);
      const existing = snap.exists() ? snap.data().transactions || [] : [];

      const alreadyExists = existing.some(
        (t: any) => t.orderId === razorpay_order_id
      );

      if (!alreadyExists) {
        // Use undefined for optional fields — userUtils will convert for storage.
        await addTransactionRecord(userId, {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id ?? `dummy_${Date.now()}`,
          masterclassId: masterclassId ?? undefined,
          videoId: videoId ?? undefined,
          masterclassTitle: masterclassTitle ?? "Dummy Masterclass",
          videoTitle: undefined,
          amount: amount ?? 0,
          status: "success",
          type,
          method,
          timestamp: new Date().toISOString(),
        });
        console.log("✅ Dummy transaction recorded");
      } else {
        console.log("ℹ️ Dummy transaction already exists — skipping creation");
      }

      /* Enroll user or give access */
      if (videoId) {
        await addPurchasedVideo(userId, videoId);
        console.log("✅ User granted video access (dummy)");
      } else if (masterclassTitle || masterclassId) {
        // prefer masterclassTitle if provided, else fallback handled inside util
        await addPurchasedClass(userId, masterclassTitle ?? null);
        console.log("✅ User enrolled in masterclass (dummy)");
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

      const userRef = doc(db, "user_profiles", userId);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const txs = snap.data().transactions || [];
        const updated = txs.map((t: any) =>
          t.orderId === razorpay_order_id
            ? sanitizeTx({
                ...t,
                status: "failed",
                failureReason: "Invalid payment signature",
                updatedAt: new Date().toISOString(),
              })
            : sanitizeTx(t)
        );

        await updateDoc(userRef, { transactions: updated });
      }

      return NextResponse.json(
        { success: false, error: "Invalid Razorpay signature" },
        { status: 400 }
      );
    }

    console.log("✅ Signature OK");

    /* ---------------------------------------------------------
       4. Fetch masterclass data
    --------------------------------------------------------- */
    const mcRef = doc(db, "MasterClasses", masterclassId);
    const mcSnap = await getDoc(mcRef);

    if (!mcSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Masterclass not found" },
        { status: 404 }
      );
    }

    const mc = mcSnap.data();
    let selectedVideoTitle: string | undefined = undefined;

    /* ---------------------------------------------------------
       5. Video purchase OR Full class enrollment
    --------------------------------------------------------- */
    if (videoId) {
      const video = mc.videos?.find((v: any) => v.id === videoId);
      if (video) selectedVideoTitle = video.title;

      await addPurchasedVideo(userId, videoId);
      console.log("🎬 Video added to user access");
    } else {
      const already = (mc.joined_users || []).includes(userId);
      if (!already) {
        await updateDoc(mcRef, { joined_users: arrayUnion(userId) });
        console.log("✅ User added to masterclass joined_users");
      } else {
        console.log("ℹ️ User already in joined_users");
      }

      await addPurchasedClass(userId, mc.title ?? null);
      console.log("🎓 Full masterclass access added");
    }

    /* ---------------------------------------------------------
       6. Update transaction → success
    --------------------------------------------------------- */
    const userRef = doc(db, "user_profiles", userId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const txs = snap.data().transactions || [];
      const updated = txs.map((t: any) =>
        t.orderId === razorpay_order_id
          ? sanitizeTx({
              ...t,
              paymentId: razorpay_payment_id ?? undefined,
              status: "success",
              type: type ?? undefined,
              videoTitle: selectedVideoTitle ?? undefined,
              updatedAt: new Date().toISOString(),
            })
          : sanitizeTx(t)
      );

      await updateDoc(userRef, { transactions: updated });
      console.log("✅ Transaction updated to success");
    } else {
      // If user doc missing (unlikely), create a safe transaction record
      await addTransactionRecord(userId, {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id ?? undefined,
        masterclassId,
        videoId: videoId ?? undefined,
        masterclassTitle: masterclassTitle ?? mc.title ?? "Unknown",
        videoTitle: selectedVideoTitle ?? undefined,
        amount: amount ?? 0,
        status: "success",
        type,
        method,
        timestamp: new Date().toISOString(),
      });
      console.log("✅ User doc missing — created transaction record");
    }

    /* ---------------------------------------------------------
       7. Email for upcoming masterclass
    --------------------------------------------------------- */
    if (type === "upcoming_registration" && mc.type === "upcoming") {
      const email = snap.data()?.email;
      if (email) await sendRegistrationEmail(email, { ...mc, id: masterclassId });
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
      { success: false, error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
