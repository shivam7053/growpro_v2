// netlify/functions/payment-verify.ts
import { Handler } from "@netlify/functions";
import crypto from "crypto";
// Use admin initializer which should export adminDb (admin.firestore.Firestore)
import { adminDb } from "../../src/lib/firebaseAdmin"; // export { adminDb } from firebaseAdmin
import admin from "firebase-admin"; // for FieldValue and Masterclass types
import { sendEmail } from "../../src/utils/gmailHelper";
import { Masterclass, MasterclassContent } from "../../src/types/masterclass";
// Helper: ensure required envs exist (only called when needed)
function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

/**
 * Calls the 'send-purchase-confirmation' Netlify function.
 * This is a "fire-and-forget" operation.
 */
async function triggerPurchaseConfirmationEmail(email: string, userName: string, masterclass: any, userId: string) {
  // Use the public API endpoint defined in netlify.toml. This is more robust.
  const functionUrl = `${process.env.URL}/api/send-purchase-confirmation`;
  
  try {
    console.log(`🚀 Triggering purchase confirmation email for ${email} by calling ${functionUrl}`);
    
    // ✅ CORRECTED: Await the fetch call to ensure it completes before the function exits.
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userName, masterclass, userId }), // ✅ Pass the correct userId
    });

    const responseBody = await response.text();
    if (!response.ok) {
      console.error(`❌ triggerPurchaseConfirmationEmail: HTTP error! status: ${response.status}. Body: ${responseBody}`);
    } else {
      console.log('✅ triggerPurchaseConfirmationEmail: Function invoked successfully. Response:', responseBody);
    }
  } catch (err) {
    // Log the error but don't fail the main transaction. This will catch network errors.
    console.error("❌ FATAL: Failed to trigger purchase confirmation email function:", err);
  }
}

/**
 * Sends an immediate reminder if a session is starting within 12 hours.
 * This is a "fire-and-forget" operation.
 */
async function sendImmediateReminder(email: string, userName: string, masterclass: Masterclass, contentItem: MasterclassContent) {
  try {
    console.log(`🚀 Triggering IMMEDIATE reminder for "${contentItem.title}" for user ${email}`);
    const scheduledDate = new Date(contentItem.scheduled_date!);
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333;">🚨 Reminder: Your Live Session is Starting Soon!</h2>
          <p>Hi ${userName},</p>
          <p>Thank you for your purchase! This is an immediate reminder that your live session, "<b>${contentItem.title}</b>", is scheduled to begin soon.</p>
          <p><b>Scheduled Time:</b> ${scheduledDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
          <p>You can access the session details and join link directly from the masterclass page:</p>
          <a href="${process.env.SITE_URL}/masterclasses/${masterclass.id}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 5px;">
            Go to Masterclass
          </a>
          <p style="margin-top: 20px; font-size: 0.9em; color: #777;">We're excited to see you there!</p>
        </div>
      </body>
      </html>
    `;

    await sendEmail(email, `🚨 Reminder: "${contentItem.title}" starts soon!`, html);
  } catch (err) {
    console.error(`❌ Failed to send immediate reminder for ${contentItem.title}:`, err);
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
      userId,
      masterclassTitle,
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
          masterclassTitle: resolvedTitle,
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
            created_at: new Date().toISOString(),
          });
          console.log("✅ User profile created with dummy transaction");
        }
      });

      // Grant access (outside transaction) — idempotent updates using FieldValue.arrayUnion
      // ✅ CORRECTED: Use 'else if' to make the logic mutually exclusive.
      if (masterclassId && masterRef) {
        // This block now only runs if it's a full masterclass purchase.
        const mcSnap = await masterRef.get();
        if (mcSnap.exists) {
          await masterRef.update({
            purchased_by_users: admin.firestore.FieldValue.arrayUnion(userId),
          });
          console.log("✅ User added to masterclass purchasers (dummy)");
        } else {
          console.warn("⚠️ Masterclass doc not found for dummy grant");
        }
      }

      // Send emails if needed (best-effort)
      try {
        if (userData?.email) {
          let mcData = null;
          if (masterclassId && masterRef) {
            const doc = await masterRef.get();
            if (doc.exists) mcData = { id: doc.id, ...doc.data() };
          }
          // Fire-and-forget call to our Netlify function
          await triggerPurchaseConfirmationEmail(userData.email, userName, mcData, userId);

          // --- ✅ NEW: IMMEDIATE REMINDER LOGIC ---
          const typedMcData = mcData as Masterclass;
          if (typedMcData && typedMcData.content) {
            const now = new Date();
            const twelveHoursFromNow = now.getTime() + 12 * 60 * 60 * 1000;
            for (const contentItem of typedMcData.content) {
              if (contentItem.source === 'zoom' && contentItem.scheduled_date) {
                const scheduledTime = new Date(contentItem.scheduled_date).getTime();
                // If the session is in the future AND within the next 12 hours
                if (scheduledTime > now.getTime() && scheduledTime < twelveHoursFromNow) {
                  sendImmediateReminder(userData.email, userName, typedMcData, contentItem);
                }
              }
            }
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
        masterclassTitle: masterclassTitle ?? mcData?.title ?? null,
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
          created_at: new Date().toISOString(),
        });
      }

      // Grant access
      // ✅ CORRECTED: Use 'else if' to ensure only one access type is granted.
      if (masterclassId) {
        // Grant access to the entire masterclass.
        tx.update(masterRef, {
          // ✅ CORRECTED: Use the new 'purchased_by_users' field.
          purchased_by_users: admin.firestore.FieldValue.arrayUnion(userId),
        });
      }
    });

    console.log("✅ Access granted and transaction recorded");

    // Send emails (best-effort)
    try {
      if (userEmail) {
        // Re-fetch mcData with ID to pass to email function
        const doc = await masterRef.get();
        const mcDataWithId = doc.exists ? { id: doc.id, ...doc.data() } : mcData;
        // Fire-and-forget call to our Netlify function
        await triggerPurchaseConfirmationEmail(userEmail, userName, mcDataWithId, userId);

        // --- ✅ NEW: IMMEDIATE REMINDER LOGIC ---
        const typedMcDataWithId = mcDataWithId as Masterclass;
        if (typedMcDataWithId && typedMcDataWithId.content) {
          const now = new Date();
          const twelveHoursFromNow = now.getTime() + 12 * 60 * 60 * 1000;
          for (const contentItem of typedMcDataWithId.content) {
            if (contentItem.source === 'zoom' && contentItem.scheduled_date) {
              const scheduledTime = new Date(contentItem.scheduled_date).getTime();
              // If the session is in the future AND within the next 12 hours
              if (scheduledTime > now.getTime() && scheduledTime < twelveHoursFromNow) {
                sendImmediateReminder(userEmail, userName, typedMcDataWithId, contentItem);
              }
            }
          }
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
    const orderId = JSON.parse(event.body || "{}")?.razorpay_order_id;
    console.error(`❌ FATAL Payment Verify Error for order [${orderId || 'unknown'}]:`, err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err?.message || String(err) }) };
  }
};
