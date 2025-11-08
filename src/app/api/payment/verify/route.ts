import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { doc, updateDoc, arrayUnion, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addPurchasedClass, addTransactionRecord } from "@/utils/userUtils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      masterclassId,
      userId,
      amount,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // ✅ Verify Razorpay signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // ✅ Firestore References
    const masterclassRef = doc(db, "MasterClasses", masterclassId);
    const userRef = doc(db, "user_profiles", userId);

    // 1️⃣ Add user to masterclass participants
    const masterclassSnap = await getDoc(masterclassRef);
    if (masterclassSnap.exists()) {
      await updateDoc(masterclassRef, {
        joined_users: arrayUnion(userId),
      });
    } else {
      await setDoc(masterclassRef, { joined_users: [userId] }, { merge: true });
    }

    // 2️⃣ Add purchased masterclass to user profile
    await addPurchasedClass(userId, masterclassId);

    // 3️⃣ Add transaction record (no title)
    await addTransactionRecord(userId, {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      masterclassId,
      amount: amount || 0,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "✅ Payment verified and enrollment completed",
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
