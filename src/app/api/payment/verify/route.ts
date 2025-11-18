// // app/api/payment/verify/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import crypto from "crypto";
// import { doc, updateDoc, arrayUnion, setDoc, getDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { addPurchasedClass, addTransactionRecord } from "@/utils/userUtils";

// export async function POST(req: NextRequest) {
//   try {
//     console.log("🔵 Payment verification started...");
//     const body = await req.json();
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       masterclassId,
//       userId,
//       masterclassTitle,
//       amount,
//       method, // ✅ Accept method from frontend
//     } = body;

//     // 🧩 ✅ DUMMY PAYMENT DETECTION
//     if (razorpay_order_id?.startsWith("dummy_")) {
//       console.log("🧩 Dummy payment detected — processing test transaction.");

//       // ✅ Check if transaction already exists
//       const userRef = doc(db, "user_profiles", userId);
//       const userSnap = await getDoc(userRef);
      
//       let transactionExists = false;
//       if (userSnap.exists()) {
//         const data = userSnap.data();
//         const transactions = data.transactions || [];
//         transactionExists = transactions.some((txn: any) => txn.orderId === razorpay_order_id);
//       }

//       // ✅ Only create if it doesn't exist
//       if (!transactionExists) {
//         await addTransactionRecord(userId, {
//           orderId: razorpay_order_id,
//           paymentId: razorpay_payment_id,
//           masterclassId,
//           masterclassTitle: masterclassTitle || "Dummy Masterclass",
//           amount: amount || 0,
//           status: "success",
//           method: method || "dummy", // ✅ Use passed method or default to "dummy"
//           timestamp: new Date().toISOString(),
//         });
//         console.log("✅ Dummy transaction record created with method:", method || "dummy");
//       } else {
//         console.log("ℹ️ Dummy transaction already exists, skipping creation");
//       }

//       // ✅ Enroll user in masterclass
//       if (masterclassId && userId) {
//         const classRef = doc(db, "MasterClasses", masterclassId);
//         const masterclassSnap = await getDoc(classRef);
        
//         if (masterclassSnap.exists()) {
//           const currentJoinedUsers = masterclassSnap.data().joined_users || [];
//           if (!currentJoinedUsers.includes(userId)) {
//             await updateDoc(classRef, { joined_users: arrayUnion(userId) });
//             console.log("✅ User enrolled in masterclass");
//           }
//         } else {
//           await setDoc(
//             classRef,
//             { joined_users: [userId], title: masterclassTitle || "Unknown" },
//             { merge: true }
//           );
//           console.log("✅ Masterclass created with user enrolled");
//         }
        
//         await addPurchasedClass(userId, masterclassTitle || "Dummy Masterclass");
//         console.log("✅ Added to user's purchased classes");
//       }

//       return NextResponse.json({
//         success: true,
//         message: "Dummy payment processed successfully",
//       });
//     }

//     // ✅ RAZORPAY PAYMENT VALIDATION
//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       console.error("❌ Missing payment details");
//       return NextResponse.json(
//         { success: false, error: "Missing payment details" },
//         { status: 400 }
//       );
//     }

//     if (!masterclassId || !userId) {
//       console.error("❌ Missing masterclass or user ID");
//       return NextResponse.json(
//         { success: false, error: "Missing masterclass or user ID" },
//         { status: 400 }
//       );
//     }

//     // ✅ Verify Razorpay signature
//     console.log("🔵 Verifying Razorpay payment signature...");
//     const text = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const generated_signature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
//       .update(text)
//       .digest("hex");

//     if (generated_signature !== razorpay_signature) {
//       console.error("❌ Invalid Razorpay signature");

//       // Update existing transaction to failed
//       const userRef = doc(db, "user_profiles", userId);
//       const userSnap = await getDoc(userRef);
      
//       if (userSnap.exists()) {
//         const data = userSnap.data();
//         const transactions = data.transactions || [];
//         const updatedTransactions = transactions.map((txn: any) =>
//           txn.orderId === razorpay_order_id
//             ? { 
//                 ...txn, 
//                 status: "failed", 
//                 failureReason: "Invalid payment signature",
//                 timestamp: new Date().toISOString() 
//               }
//             : txn
//         );
//         await updateDoc(userRef, { transactions: updatedTransactions });
//       }

//       return NextResponse.json(
//         { success: false, error: "Invalid payment signature. Verification failed." },
//         { status: 400 }
//       );
//     }

//     console.log("✅ Payment signature verified successfully");

//     // ✅ Fetch masterclass title if not provided
//     let classTitle = masterclassTitle;
//     if (!classTitle) {
//       console.log("🔵 Fetching masterclass title from Firestore...");
//       const masterclassRef = doc(db, "MasterClasses", masterclassId);
//       const snap = await getDoc(masterclassRef);

//       if (snap.exists()) {
//         classTitle = snap.data().title || masterclassId;
//         console.log("✅ Masterclass title found:", classTitle);
//       } else {
//         console.warn("⚠️ Masterclass not found; using ID as title");
//         classTitle = masterclassId;
//       }
//     }

//     // ✅ Enroll user in masterclass
//     const masterclassRef = doc(db, "MasterClasses", masterclassId);
//     console.log("🔵 Adding user to masterclass participants...");
//     const masterclassSnap = await getDoc(masterclassRef);

//     if (masterclassSnap.exists()) {
//       const currentJoinedUsers = masterclassSnap.data().joined_users || [];
//       if (!currentJoinedUsers.includes(userId)) {
//         await updateDoc(masterclassRef, {
//           joined_users: arrayUnion(userId),
//         });
//         console.log("✅ User added to masterclass participants");
//       } else {
//         console.log("ℹ️ User already enrolled in masterclass");
//       }
//     } else {
//       console.warn("⚠️ Masterclass not found, creating document with user...");
//       await setDoc(
//         masterclassRef,
//         { joined_users: [userId], title: classTitle },
//         { merge: true }
//       );
//     }

//     // ✅ Add to user's purchased classes
//     console.log("🔵 Adding masterclass to user's purchased list...");
//     await addPurchasedClass(userId, classTitle);
//     console.log("✅ Added to user's purchased classes");

//     // ✅ Update transaction to success
//     console.log("🔵 Updating transaction record to success...");
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);

//     if (userSnap.exists()) {
//       const data = userSnap.data();
//       const transactions = data.transactions || [];
      
//       const updatedTransactions = transactions.map((txn: any) =>
//         txn.orderId === razorpay_order_id
//           ? { 
//               ...txn, 
//               paymentId: razorpay_payment_id,
//               status: "success",
//               timestamp: new Date().toISOString() 
//             }
//           : txn
//       );
      
//       await updateDoc(userRef, { transactions: updatedTransactions });
//       console.log("✅ Transaction updated successfully");
//     }

//     console.log("🎉 Payment verified and saved successfully!");

//     return NextResponse.json({
//       success: true,
//       message: "Payment verified successfully and enrollment completed",
//     });
//   } catch (error: any) {
//     console.error("❌ Payment verification error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message || "Payment verification failed",
//         details: error.stack || error.toString(),
//       },
//       { status: 500 }
//     );
//   }
// }

// app/api/payment/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { doc, updateDoc, arrayUnion, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addPurchasedClass, addTransactionRecord } from "@/utils/userUtils";

// ✅ NEW: Helper function to send registration email
async function sendRegistrationEmail(email: string, masterclass: any) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-registration-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        masterclassTitle: masterclass.title,
        speakerName: masterclass.speaker_name,
        scheduledDate: masterclass.scheduled_date,
        masterclassId: masterclass.id,
      }),
    });
    console.log("✅ Registration email sent");
  } catch (err) {
    console.error("⚠️ Failed to send registration email:", err);
    // Don't fail the payment if email fails
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔵 Payment verification started...");
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      masterclassId,
      videoId, // ✅ NEW: For video purchases
      userId,
      masterclassTitle,
      amount,
      method,
      type = "purchase", // ✅ NEW: Transaction type
    } = body;

    // 🧩 ✅ DUMMY PAYMENT DETECTION
    if (razorpay_order_id?.startsWith("dummy_")) {
      console.log("🧩 Dummy payment detected — processing test transaction.");

      // ✅ Check if transaction already exists
      const userRef = doc(db, "user_profiles", userId);
      const userSnap = await getDoc(userRef);
      
      let transactionExists = false;
      if (userSnap.exists()) {
        const data = userSnap.data();
        const transactions = data.transactions || [];
        transactionExists = transactions.some((txn: any) => txn.orderId === razorpay_order_id);
      }

      // ✅ Only create if it doesn't exist
      if (!transactionExists) {
        await addTransactionRecord(userId, {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id || `dummy_pay_${Date.now()}`,
          masterclassId,
          videoId: videoId || undefined,
          masterclassTitle: masterclassTitle || "Dummy Masterclass",
          amount: amount || 0,
          status: "success",
          method: method || "dummy",
          type,
          timestamp: new Date().toISOString(),
        });
        console.log("✅ Dummy transaction record created with method:", method || "dummy");
      } else {
        console.log("ℹ️ Dummy transaction already exists, skipping creation");
      }

      // ✅ Enroll user in masterclass or video
      if (masterclassId && userId) {
        const classRef = doc(db, "MasterClasses", masterclassId);
        const masterclassSnap = await getDoc(classRef);
        
        if (masterclassSnap.exists()) {
          const currentJoinedUsers = masterclassSnap.data().joined_users || [];
          if (!currentJoinedUsers.includes(userId)) {
            await updateDoc(classRef, { joined_users: arrayUnion(userId) });
            console.log("✅ User enrolled in masterclass");
          }
        } else {
          await setDoc(
            classRef,
            { joined_users: [userId], title: masterclassTitle || "Unknown" },
            { merge: true }
          );
          console.log("✅ Masterclass created with user enrolled");
        }
        
        await addPurchasedClass(userId, masterclassTitle || "Dummy Masterclass");
        console.log("✅ Added to user's purchased classes");
      }

      return NextResponse.json({
        success: true,
        message: "Dummy payment processed successfully",
        type,
      });
    }

    // ✅ RAZORPAY PAYMENT VALIDATION
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("❌ Missing payment details");
      return NextResponse.json(
        { success: false, error: "Missing payment details" },
        { status: 400 }
      );
    }

    if (!masterclassId || !userId) {
      console.error("❌ Missing masterclass or user ID");
      return NextResponse.json(
        { success: false, error: "Missing masterclass or user ID" },
        { status: 400 }
      );
    }

    // ✅ Verify Razorpay signature
    console.log("🔵 Verifying Razorpay payment signature...");
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("❌ Invalid Razorpay signature");

      // Update existing transaction to failed
      const userRef = doc(db, "user_profiles", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        const transactions = data.transactions || [];
        const updatedTransactions = transactions.map((txn: any) =>
          txn.orderId === razorpay_order_id
            ? { 
                ...txn, 
                status: "failed", 
                failureReason: "Invalid payment signature",
                timestamp: new Date().toISOString() 
              }
            : txn
        );
        await updateDoc(userRef, { transactions: updatedTransactions });
      }

      return NextResponse.json(
        { success: false, error: "Invalid payment signature. Verification failed." },
        { status: 400 }
      );
    }

    console.log("✅ Payment signature verified successfully");

    // ✅ Fetch masterclass details
    const masterclassRef = doc(db, "MasterClasses", masterclassId);
    const masterclassSnap = await getDoc(masterclassRef);

    if (!masterclassSnap.exists()) {
      console.error("❌ Masterclass not found");
      return NextResponse.json(
        { success: false, error: "Masterclass not found" },
        { status: 404 }
      );
    }

    const masterclassData = masterclassSnap.data();
    let classTitle = masterclassData.title || masterclassId;
    let videoTitle = "";

    // ✅ Handle video purchase
    if (videoId && masterclassData.videos) {
      const video = masterclassData.videos.find((v: any) => v.id === videoId);
      if (video) {
        videoTitle = video.title;
        classTitle = `${classTitle} - ${videoTitle}`;
        
        // ✅ Add video to user's purchased videos
        const userRef = doc(db, "user_profiles", userId);
        await updateDoc(userRef, {
          purchasedVideos: arrayUnion(videoId),
        });
        console.log("✅ Video added to user's purchased videos");
      }
    } else {
      // ✅ Full masterclass access - enroll user
      const currentJoinedUsers = masterclassData.joined_users || [];
      if (!currentJoinedUsers.includes(userId)) {
        await updateDoc(masterclassRef, {
          joined_users: arrayUnion(userId),
        });
        console.log("✅ User added to masterclass participants");
      } else {
        console.log("ℹ️ User already enrolled in masterclass");
      }

      // ✅ Add to user's purchased classes
      await addPurchasedClass(userId, masterclassData.title);
      console.log("✅ Added to user's purchased classes");
    }

    // ✅ Update transaction to success
    console.log("🔵 Updating transaction record to success...");
    const userRef = doc(db, "user_profiles", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const transactions = data.transactions || [];
      
      const updatedTransactions = transactions.map((txn: any) =>
        txn.orderId === razorpay_order_id
          ? { 
              ...txn, 
              paymentId: razorpay_payment_id,
              status: "success",
              type,
              timestamp: new Date().toISOString() 
            }
          : txn
      );
      
      await updateDoc(userRef, { transactions: updatedTransactions });
      console.log("✅ Transaction updated successfully");
    }

    // ✅ NEW: Send registration email for upcoming masterclasses
    if (type === "upcoming_registration" && masterclassData.type === "upcoming") {
      const userData = userSnap.data();
      if (userData?.email) {
        await sendRegistrationEmail(userData.email, {
          ...masterclassData,
          id: masterclassId,
        });
      }
    }

    console.log("🎉 Payment verified and saved successfully!");

    return NextResponse.json({
      success: true,
      message: type === "upcoming_registration" 
        ? "Registration successful! Check your email for confirmation."
        : "Payment verified successfully and enrollment completed",
      type,
      videoId: videoId || null,
    });
  } catch (error: any) {
    console.error("❌ Payment verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Payment verification failed",
        details: error.stack || error.toString(),
      },
      { status: 500 }
    );
  }
}