// // netlify/functions/payment-verify.ts
// import { Handler } from "@netlify/functions";
// import crypto from "crypto";
// import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
// import { adminDb as db } from "../../src/lib/firebaseAdmin";
// import {
//   addPurchasedClass,
//   addPurchasedVideo,
//   addTransactionRecord,
//   updateTransactionStatus,
// } from "../../src/utils/userUtils";
// import { sendEmail } from "../../src/utils/gmailHelper";

// const SITE_URL = process.env.SITE_URL || process.env.URL;

// async function sendRegistrationEmail(
//   email: string,
//   userName: string,
//   masterclass: any,
//   masterclassId: string
// ) {
//   try {
//     const scheduledDateTime = masterclass.scheduled_date ? new Date(masterclass.scheduled_date) : null;
//     const formattedDate = scheduledDateTime 
//       ? scheduledDateTime.toLocaleString("en-US", {
//           weekday: "long",
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//           timeZoneName: "short",
//         })
//       : "TBA";

//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body {
//             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//             line-height: 1.6;
//             color: #333;
//             max-width: 600px;
//             margin: 0 auto;
//             background-color: #f5f5f5;
//           }
//           .container {
//             background: white;
//             margin: 20px;
//             border-radius: 12px;
//             overflow: hidden;
//             box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//           }
//           .header {
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             color: white;
//             padding: 40px 30px;
//             text-align: center;
//           }
//           .content {
//             padding: 30px;
//           }
//           .info-box {
//             background: #f9fafb;
//             padding: 20px;
//             border-radius: 8px;
//             margin: 20px 0;
//             border-left: 4px solid #4f46e5;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>🎉 Registration Confirmed!</h1>
//           </div>
//           <div class="content">
//             <h2>Hello ${userName || "there"}!</h2>
//             <p>Great news! You're all set for the upcoming masterclass.</p>
            
//             <div class="info-box">
//               <h3>📚 ${masterclass.title}</h3>
//               <p><strong>Speaker:</strong> ${masterclass.speaker_name}</p>
//               <p><strong>📅 Scheduled:</strong> ${formattedDate}</p>
//             </div>

//             <p>You'll receive reminder emails 24 hours and 2 hours before the event starts.</p>
            
//             <p>Best regards,<br><strong>The Masterclass Team</strong></p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     await sendEmail(
//       email,
//       `✅ Registration Confirmed: ${masterclass.title}`,
//       htmlContent
//     );
//     console.log("✅ Registration email sent via Gmail");
//   } catch (err) {
//     console.error("❌ Registration email error:", err);
//   }
// }

// async function sendPurchaseConfirmationEmail(
//   email: string,
//   userName: string,
//   orderId: string,
//   paymentId: string,
//   masterclassId: string,
//   masterclassTitle: string,
//   videoId: string | null,
//   videoTitle: string | null,
//   amount: number,
//   purchaseType: "video" | "upcoming_registration" | "masterclass"
// ) {
//   try {
//     const isPaid = amount > 0;
//     const isVideo = purchaseType === "video";
//     const isUpcoming = purchaseType === "upcoming_registration";

//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body {
//             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//             line-height: 1.6;
//             color: #333;
//             max-width: 600px;
//             margin: 0 auto;
//             background-color: #f5f5f5;
//           }
//           .container {
//             background: white;
//             margin: 20px;
//             border-radius: 12px;
//             overflow: hidden;
//             box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//           }
//           .header {
//             background: linear-gradient(135deg, #10b981 0%, #059669 100%);
//             color: white;
//             padding: 40px 30px;
//             text-align: center;
//           }
//           .content {
//             padding: 30px;
//           }
//           .purchase-details {
//             background: #f9fafb;
//             padding: 20px;
//             border-radius: 8px;
//             margin: 20px 0;
//             border-left: 4px solid #10b981;
//           }
//           .amount {
//             font-size: 32px;
//             font-weight: bold;
//             color: #10b981;
//             text-align: center;
//             margin: 20px 0;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>✅ ${isPaid ? 'Purchase Successful!' : 'Enrollment Confirmed!'}</h1>
//           </div>
//           <div class="content">
//             <h2>Hi ${userName || "there"}!</h2>
//             <p>${isPaid ? 'Your payment has been processed successfully.' : 'Great news! Your enrollment is complete.'}</p>
            
//             <div class="purchase-details">
//               <h3>${isVideo ? '🎥' : '📚'} ${isVideo ? videoTitle : masterclassTitle}</h3>
//               ${isPaid ? `<div class="amount">₹${amount}</div>` : '<p style="text-align: center; font-size: 18px; color: #10b981; font-weight: bold;">FREE</p>'}
//             </div>

//             ${isPaid ? `
//               <p><strong>📄 Payment Details:</strong><br>
//               Order ID: ${orderId}<br>
//               ${paymentId ? `Payment ID: ${paymentId}<br>` : ''}
//               Amount: ₹${amount}</p>
//             ` : ''}

//             <p>Thank you for being part of our learning community!</p>
//             <p>Best regards,<br><strong>The Masterclass Team</strong></p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     await sendEmail(
//       email,
//       `${isPaid ? '💳' : '✅'} ${isVideo ? 'Video' : 'Masterclass'} ${isPaid ? 'Purchase' : 'Enrollment'} Confirmed`,
//       htmlContent
//     );
//     console.log("✅ Purchase confirmation email sent via Gmail");
//   } catch (err) {
//     console.error("❌ Purchase confirmation email error:", err);
//   }
// }

// export const handler: Handler = async (event, context) => {
//   if (event.httpMethod !== "POST") {
//     return {
//       statusCode: 405,
//       body: JSON.stringify({ error: "Method not allowed" }),
//     };
//   }

//   try {
//     console.log("🔵 Payment verification started...");
//     const body = JSON.parse(event.body || "{}");

//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       masterclassId,
//       videoId,
//       userId,
//       masterclassTitle,
//       videoTitle,
//       amount,
//       method = "razorpay",
//       type = "purchase",
//     } = body;

//     /* DUMMY PAYMENT HANDLING */
//     if (razorpay_order_id?.startsWith("dummy_")) {
//       console.log("🧩 Dummy payment detected");

//       const userRef = doc(db, "user_profiles", userId);
//       const userSnap = await getDoc(userRef);
//       const userData = userSnap.exists() ? userSnap.data() : null;
//       const userEmail = userData?.email;
//       const userName = userData?.name || userData?.displayName || "";

//       const existing = userSnap.exists() ? userData?.transactions || [] : [];

//       const alreadyExists = existing.some(
//         (t: any) => t.orderId === razorpay_order_id
//       );

//       if (!alreadyExists) {
//         await addTransactionRecord(userId, {
//           orderId: razorpay_order_id,
//           paymentId: razorpay_payment_id ?? `dummy_${Date.now()}`,
//           masterclassId: masterclassId ?? undefined,
//           videoId: videoId ?? undefined,
//           masterclassTitle: masterclassTitle ?? "Dummy Masterclass",
//           videoTitle: videoTitle ?? undefined,
//           amount: amount ?? 0,
//           status: "success",
//           type,
//           method,
//           timestamp: new Date().toISOString(),
//         });
//         console.log("✅ Dummy transaction recorded");
//       }

//       // Grant access
//       if (videoId) {
//         await addPurchasedVideo(userId, videoId);
//         console.log("✅ User granted video access (dummy)");
//       } else if (masterclassId) {
//         const mcRef = doc(db, "MasterClasses", masterclassId);
//         const mcSnap = await getDoc(mcRef);
        
//         if (mcSnap.exists()) {
//           const mcData = mcSnap.data();
//           const already = (mcData.joined_users || []).includes(userId);
          
//           if (!already) {
//             await updateDoc(mcRef, { joined_users: arrayUnion(userId) });
//             console.log("✅ User added to masterclass (dummy)");
//           }
          
//           await addPurchasedClass(userId, mcData.title ?? null);
//         }
//       }

//       // Send emails via Gmail
//       if (amount > 0 && userEmail) {
//         const mcRef = doc(db, "MasterClasses", masterclassId);
//         const mcSnap = await getDoc(mcRef);
//         const mcData = mcSnap.exists() ? mcSnap.data() : null;

//         const isUpcoming = mcData?.type === "upcoming";
//         const purchaseType = videoId 
//           ? "video" 
//           : isUpcoming 
//             ? "upcoming_registration" 
//             : "masterclass";

//         await sendPurchaseConfirmationEmail(
//           userEmail,
//           userName,
//           razorpay_order_id,
//           razorpay_payment_id,
//           masterclassId,
//           masterclassTitle || mcData?.title || "Unknown",
//           videoId,
//           videoTitle ?? null,
//           amount,
//           purchaseType
//         );

//         if (isUpcoming && !videoId) {
//           await sendRegistrationEmail(
//             userEmail,
//             userName,
//             mcData,
//             masterclassId
//           );
//         }
//       }

//       return {
//         statusCode: 200,
//         body: JSON.stringify({
//           success: true,
//           message: "Dummy payment completed",
//           type,
//         }),
//       };
//     }

//     /* VALIDATE RAZORPAY PARAMETERS */
//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({ success: false, error: "Missing payment details" }),
//       };
//     }

//     if (!masterclassId || !userId) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({ success: false, error: "Missing masterclassId or userId" }),
//       };
//     }

//     /* VERIFY RAZORPAY SIGNATURE */
//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       console.error("❌ Invalid Razorpay signature");

//       await updateTransactionStatus(userId, razorpay_order_id, {
//         status: "failed",
//         failureReason: "Invalid payment signature",
//         updatedAt: new Date().toISOString(),
//       });

//       return {
//         statusCode: 400,
//         body: JSON.stringify({ success: false, error: "Invalid Razorpay signature" }),
//       };
//     }

//     console.log("✅ Signature verified");

//     /* GET USER AND MASTERCLASS DATA */
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);
//     const userData = userSnap.exists() ? userSnap.data() : null;
//     const userEmail = userData?.email;
//     const userName = userData?.name || userData?.displayName || "";

//     const mcRef = doc(db, "MasterClasses", masterclassId);
//     const mcSnap = await getDoc(mcRef);

//     if (!mcSnap.exists()) {
//       return {
//         statusCode: 404,
//         body: JSON.stringify({ success: false, error: "Masterclass not found" }),
//       };
//     }

//     const mcData = mcSnap.data();
//     let selectedVideoTitle: string | undefined = videoTitle;

//     /* GRANT ACCESS */
//     if (videoId) {
//       const video = mcData.videos?.find((v: any) => v.id === videoId);
//       if (video && !selectedVideoTitle) {
//         selectedVideoTitle = video.title;
//       }

//       await addPurchasedVideo(userId, videoId);
//       console.log("🎬 Video access granted");
//     } else {
//       const already = (mcData.joined_users || []).includes(userId);
      
//       if (!already) {
//         await updateDoc(mcRef, { joined_users: arrayUnion(userId) });
//         console.log("✅ User added to masterclass");
//       }

//       await addPurchasedClass(userId, mcData.title ?? null);
//       console.log("🎓 Full masterclass access granted");
//     }

//     /* UPDATE TRANSACTION */
//     await updateTransactionStatus(userId, razorpay_order_id, {
//       paymentId: razorpay_payment_id,
//       status: "success",
//       type: type ?? undefined,
//       videoTitle: selectedVideoTitle ?? undefined,
//       updatedAt: new Date().toISOString(),
//     });
//     console.log("✅ Transaction updated to success");

//     /* SEND EMAILS VIA GMAIL */
//     if (userEmail) {
//       const isUpcoming = mcData.type === "upcoming";
//       const purchaseType = videoId 
//         ? "video" 
//         : isUpcoming 
//           ? "upcoming_registration" 
//           : "masterclass";

//       if (amount > 0) {
//         await sendPurchaseConfirmationEmail(
//           userEmail,
//           userName,
//           razorpay_order_id,
//           razorpay_payment_id,
//           masterclassId,
//           masterclassTitle || mcData.title,
//           videoId,
//           selectedVideoTitle ?? null, 
//           amount,
//           purchaseType
//         );
//       }

//       if (isUpcoming && !videoId) {
//         await sendRegistrationEmail(
//           userEmail,
//           userName,
//           mcData,
//           masterclassId
//         );
//       }
//     }

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         success: true,
//         message: "Payment verified successfully",
//         type,
//         videoId: videoId ?? null,
//       }),
//     };
//   } catch (err: any) {
//     console.error("❌ Payment verify error:", err);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ success: false, error: err.message }),
//     };
//   }
// };

// netlify/functions/payment-verify.ts
import { Handler } from "@netlify/functions";
import crypto from "crypto";
// Use admin initializer which should export adminDb (admin.firestore.Firestore)
import { adminDb } from "../../src/lib/firebaseAdmin"; // export { adminDb } from firebaseAdmin
import admin from "firebase-admin"; // for FieldValue
import { sendEmail } from "../../src/utils/gmailHelper";

// Helper: ensure required envs exist (only called when needed)
function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

const SITE_URL = process.env.SITE_URL || process.env.URL || "";

async function sendRegistrationEmail(
  email: string,
  userName: string,
  masterclass: any,
  masterclassId: string
) {
  try {
    const scheduledDateTime = masterclass?.scheduled_date
      ? new Date(masterclass.scheduled_date)
      : null;
    const formattedDate = scheduledDateTime
      ? scheduledDateTime.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })
      : "TBA";

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
      <h1>Registration Confirmed</h1>
      <p>Hi ${userName || "there"},</p>
      <p>You have been registered for <strong>${masterclass?.title || "the masterclass"}</strong> on ${formattedDate}.</p>
      <p><a href="${SITE_URL}/masterclasses/${masterclassId}">View details</a></p>
      </body></html>`;

    await sendEmail(email, `✅ Registration Confirmed: ${masterclass?.title || ""}`, htmlContent);
    console.log("✅ Registration email sent via Gmail");
  } catch (err) {
    console.error("❌ Registration email error:", err);
  }
}

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
    const isPaid = amount > 0;
    const subject = `${isPaid ? "💳 Purchase" : "✅ Enrollment"} Confirmed`;
    const html = `<html><body>
      <h1>${subject}</h1>
      <p>Hi ${userName || "there"},</p>
      <p>${isPaid ? "Your payment succeeded." : "Your enrollment is confirmed."}</p>
      <p>Order: ${orderId} ${paymentId ? `| Payment: ${paymentId}` : ""}</p>
      <p>Item: ${videoId ? videoTitle : masterclassTitle} ${isPaid ? `| Amount: ₹${amount}` : ""}</p>
      <p><a href="${SITE_URL}/masterclasses/${masterclassId}">Open masterclass</a></p>
    </body></html>`;
    await sendEmail(email, subject, html);
    console.log("✅ Purchase confirmation email sent via Gmail");
  } catch (err) {
    console.error("❌ Purchase confirmation email error:", err);
  }
}

/**
 * Serverless handler — uses adminDb (Firestore Admin) only.
 * NOTE: ensure `adminDb` is the Admin Firestore instance exported by your firebaseAdmin file.
 */
export const handler: Handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    console.log("🔵 Payment verification started...");
    const body = JSON.parse(event.body || "{}");

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      masterclassId,
      videoId,
      userId,
      masterclassTitle,
      videoTitle,
      amount = 0,
      method = "razorpay",
      type = "purchase",
    } = body as any;

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing userId" }) };
    }

    // Helper references (admin DB paths)
    const userRef = adminDb.doc(`user_profiles/${userId}`);
    const masterRef = masterclassId ? adminDb.doc(`MasterClasses/${masterclassId}`) : null;

    /* -------------------------
       DUMMY PAYMENT HANDLING
       ------------------------- */
    if (typeof razorpay_order_id === "string" && razorpay_order_id.startsWith("dummy_")) {
      console.log("🧩 Dummy payment detected");

      // Read user doc (best-effort)
      const userSnap = await userRef.get();
      const userData = userSnap.exists ? userSnap.data() : null;
      const userEmail = userData?.email;
      const userName = userData?.name || userData?.displayName || "";

      // Transactionally add dummy transaction (idempotent)
      await adminDb.runTransaction(async (tx) => {
        const docSnap = await tx.get(userRef);
        const now = new Date().toISOString();

        // resolve masterclass title if needed
        let resolvedTitle = masterclassTitle ?? "Dummy Masterclass";
        if (!masterclassTitle && masterRef) {
          try {
            const mcSnap = await masterRef.get();
            if (mcSnap.exists) {
              resolvedTitle = mcSnap.data()?.title ?? resolvedTitle;
            }
          } catch (e) {
            // ignore - keep fallback title
          }
        }

        const txObj = {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id ?? `dummy_${Date.now()}`,
          masterclassId: masterclassId ?? null,
          videoId: videoId ?? null,
          masterclassTitle: resolvedTitle,
          videoTitle: videoTitle ?? null,
          amount: amount ?? 0,
          status: "success",
          type,
          method,
          timestamp: now,
          updatedAt: now,
        };

        if (docSnap.exists) {
          const data = docSnap.data() || {};
          const existing = Array.isArray(data.transactions) ? data.transactions : [];
          const already = existing.some((t: any) => t.orderId === razorpay_order_id);
          if (!already) {
            await tx.update(userRef, {
              transactions: admin.firestore.FieldValue.arrayUnion(txObj),
            });
            console.log("✅ Dummy transaction recorded (added to existing profile)");
          } else {
            console.log("ℹ️ Dummy transaction already exists");
          }
        } else {
          await tx.set(userRef, {
            id: userId,
            transactions: [txObj],
            purchasedClasses: [],
            purchasedVideos: [],
            created_at: new Date().toISOString(),
          });
          console.log("✅ User profile created with dummy transaction");
        }
      });

      // Grant access (outside transaction) — idempotent updates using FieldValue.arrayUnion
      if (videoId) {
        await userRef.update({
          purchasedVideos: admin.firestore.FieldValue.arrayUnion(videoId),
        });
        console.log("✅ User granted video access (dummy)");
      } else if (masterclassId && masterRef) {
        const mcSnap = await masterRef.get();
        if (mcSnap.exists) {
          const mcData = mcSnap.data();
          // add user to masterclass joined users
          await masterRef.update({
            joined_users: admin.firestore.FieldValue.arrayUnion(userId),
          });
          console.log("✅ User added to masterclass (dummy)");

          // add to user's purchasedClasses
          await userRef.update({
            purchasedClasses: admin.firestore.FieldValue.arrayUnion(mcData?.title ?? masterclassTitle ?? "Unknown"),
          });
          console.log("✅ User purchased class recorded (dummy)");
        } else {
          console.warn("⚠️ Masterclass doc not found for dummy grant");
        }
      }

      // Send emails if needed (best-effort)
      try {
        if (amount > 0 && userData?.email) {
          const mcData = masterclassId && masterRef ? (await masterRef.get()).data() : null;
          const isUpcoming = mcData?.type === "upcoming";
          const purchaseType = videoId ? "video" : isUpcoming ? "upcoming_registration" : "masterclass";

          await sendPurchaseConfirmationEmail(
            userData.email,
            userName,
            razorpay_order_id,
            razorpay_payment_id,
            masterclassId ?? "",
            masterclassTitle || mcData?.title || "Unknown",
            videoId ?? null,
            videoTitle ?? null,
            amount ?? 0,
            purchaseType as any
          );

          if (isUpcoming && !videoId) {
            await sendRegistrationEmail(userData.email, userName, mcData, masterclassId!);
          }
        }
      } catch (emailErr) {
        console.error("❌ Error while sending confirmation emails (dummy):", emailErr);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: "Dummy payment completed" }),
      };
    } // end dummy

    /* -------------------------
       VALIDATE RAZORPAY PAYLOAD
       ------------------------- */
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing payment details" }) };
    }
    if (!masterclassId) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing masterclassId" }) };
    }

    // Ensure secret is present for real payment verification
    const secret = requireEnv("RAZORPAY_KEY_SECRET");

    // verify signature
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Invalid Razorpay signature");

      // mark transaction failed (create or update) inside a transaction
      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const now = new Date().toISOString();
        const failObj = {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          masterclassId: masterclassId,
          videoId: videoId ?? null,
          masterclassTitle: masterclassTitle ?? null,
          videoTitle: videoTitle ?? null,
          amount: amount ?? 0,
          status: "failed",
          method,
          type,
          failureReason: "Invalid payment signature",
          timestamp: now,
          updatedAt: now,
        };
        if (snap.exists) {
          await tx.update(userRef, {
            transactions: admin.firestore.FieldValue.arrayUnion(failObj),
          });
        } else {
          await tx.set(userRef, {
            id: userId,
            transactions: [failObj],
            purchasedClasses: [],
            purchasedVideos: [],
            created_at: now,
          });
        }
      });

      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Invalid Razorpay signature" }) };
    }

    console.log("✅ Signature verified");

    // fetch user and masterclass
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: "User not found" }) };
    }
    const userData = userSnap.data();
    const userEmail = userData?.email;
    const userName = userData?.name || userData?.displayName || "";

    if (!masterRef) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing masterclassRef" }) };
    }

    const mcSnap = await masterRef.get();
    if (!mcSnap.exists) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: "Masterclass not found" }) };
    }
    const mcData = mcSnap.data();

    // Grant access & record success transaction atomically
    await adminDb.runTransaction(async (tx) => {
      const uSnap = await tx.get(userRef);
      const mSnap = await tx.get(masterRef);

      const successObj = {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        masterclassId: masterclassId,
        videoId: videoId ?? null,
        masterclassTitle: masterclassTitle ?? mcData?.title ?? null,
        videoTitle: videoTitle ?? null,
        amount: amount ?? 0,
        status: "success",
        method,
        type,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (uSnap.exists) {
        tx.update(userRef, {
          transactions: admin.firestore.FieldValue.arrayUnion(successObj),
        });
      } else {
        tx.set(userRef, {
          id: userId,
          transactions: [successObj],
          purchasedClasses: [],
          purchasedVideos: [],
          created_at: new Date().toISOString(),
        });
      }

      // Grant access
      if (videoId) {
        tx.update(userRef, {
          purchasedVideos: admin.firestore.FieldValue.arrayUnion(videoId),
        });
      } else {
        tx.update(masterRef, {
          joined_users: admin.firestore.FieldValue.arrayUnion(userId),
        });
        const titleToAdd = mcData?.title ?? masterclassTitle ?? "Unknown";
        tx.update(userRef, {
          purchasedClasses: admin.firestore.FieldValue.arrayUnion(titleToAdd),
        });
      }
    });

    console.log("✅ Access granted and transaction recorded");

    // Send emails (best-effort)
    try {
      if (userEmail) {
        if (!mcData) {
  throw new Error("Masterclass data not found.");
}

const isUpcoming = mcData.type === "upcoming";

const purchaseType = videoId
  ? "video"
  : isUpcoming
  ? "upcoming_registration"
  : "masterclass";


        if (amount > 0) {
          await sendPurchaseConfirmationEmail(
            userEmail,
            userName,
            razorpay_order_id,
            razorpay_payment_id,
            masterclassId,
            masterclassTitle || mcData.title,
            videoId ?? null,
            videoTitle ?? null,
            amount ?? 0,
            purchaseType as any
          );
        }

        if (isUpcoming && !videoId) {
          await sendRegistrationEmail(userEmail, userName, mcData, masterclassId);
        }
      }
    } catch (emailErr) {
      console.error("❌ Error sending emails after successful payment:", emailErr);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Payment verified successfully" }),
    };
  } catch (err: any) {
    console.error("❌ Payment verify error:", err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err?.message || String(err) }) };
  }
};
