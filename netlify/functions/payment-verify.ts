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
      } else if (masterclassId && masterRef) {
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
        if (amount > 0 && userData?.email) {
          const mcData = masterclassId && masterRef ? (await masterRef.get()).data() : null;
          // ✅ CORRECTED: Determine if it's an upcoming (Zoom) session based on the 'type' passed from the frontend.

          await sendPurchaseConfirmationEmail(
            userData.email,
            userName,
            razorpay_order_id,
            razorpay_payment_id,
            masterclassId ?? "",
            masterclassTitle || mcData?.title || "Unknown",
            amount ?? 0,
            "masterclass"
          );
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
        if (!mcData) {
  throw new Error("Masterclass data not found.");
        }

        if (amount > 0) {
          await sendPurchaseConfirmationEmail(
            userEmail,
            userName,
            razorpay_order_id,
            razorpay_payment_id,
            masterclassId,
            masterclassTitle || mcData.title,
            amount ?? 0,
            "masterclass"
          );
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
