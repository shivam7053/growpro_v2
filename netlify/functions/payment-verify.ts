// netlify/functions/payment-verify.ts
import { Handler } from "@netlify/functions";
import crypto from "crypto";
import { adminDb } from "../../src/lib/firebaseAdmin";
import admin from "firebase-admin";
import { sendEmail } from "../../src/utils/gmailHelper";
import { Masterclass, MasterclassContent } from "../../src/types/masterclass";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Helper: ensure required envs exist
function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

/**
 * Generates a PDF receipt and returns it as a base64 encoded string.
 */
async function generatePdfReceiptBase64(
  orderId: string,
  paymentId: string,
  userName: string,
  userEmail: string,
  masterclassTitle: string,
  amount: number,
  timestamp: string
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 12;
  const brandColor = rgb(79 / 255, 70 / 255, 229 / 255); // #4f46e5

  page.drawText("Payment Receipt", {
    x: 50,
    y: height - 50,
    font: boldFont,
    size: 24,
    color: brandColor,
  });

  const details = [
    { label: "Order ID:", value: orderId },
    { label: "Payment ID:", value: paymentId },
    { label: "Date:", value: new Date(timestamp).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) },
    { label: "Billed to:", value: `${userName} (${userEmail})` },
    { label: "Item:", value: masterclassTitle },
    { label: "Amount Paid:", value: `INR ${amount.toFixed(2)}` },
  ];

  let yPosition = height - 100;
  for (const detail of details) {
    page.drawText(detail.label, { x: 50, y: yPosition, font: boldFont, size: fontSize });
    page.drawText(detail.value, { x: 150, y: yPosition, font, size: fontSize });
    yPosition -= 20;
  }

  page.drawText("Thank you for your purchase!", {
    x: 50,
    y: yPosition - 30,
    font,
    size: fontSize,
    color: brandColor,
  });

  return await pdfDoc.saveAsBase64();
}

/**
 * Emails the generated PDF receipt as an attachment.
 */
async function emailPdfReceipt(
  email: string,
  userName: string,
  orderId: string,
  paymentId: string,
  masterclassTitle: string,
  amount: number,
  pdfBase64: string
) {
  try {
    console.log(`[EMAIL-PDF] Sending receipt for order ${orderId} to ${email}`);
    const subject = `Your Receipt for ${masterclassTitle}`;
    const html = `
      <p>Hi ${userName},</p>
      <p>Thank you for your purchase! Your payment receipt is attached to this email.</p>
      <p><b>Order ID:</b> ${orderId}<br/>
      <b>Amount Paid:</b> INR ${amount.toFixed(2)}</p>
      <p>You can also access your masterclass content at any time by logging into your account.</p>
    `;
    const attachments = [{
      filename: `receipt-${orderId}.pdf`,
      content: pdfBase64,
      encoding: 'base64',
      contentType: 'application/pdf',
    }];
    await sendEmail(email, subject, html, attachments);
    console.log(`[EMAIL-PDF] ✅ Receipt sent successfully.`);
  } catch (err) {
    console.error(`[EMAIL-PDF] ❌ Failed to email receipt for order ${orderId}:`, err);
  }
}

/**
 * Triggers purchase confirmation email (fire-and-forget)
 */
async function triggerPurchaseConfirmationEmail(
  email: string, 
  userName: string, 
  masterclass: any, 
  userId: string
) {
  const baseUrl = process.env.URL || process.env.DEPLOY_URL || "https://your-site.netlify.app";
  const functionUrl = `${baseUrl}/.netlify/functions/send-purchase-confirmation`;
  
  try {
    console.log(`[EMAIL] Triggering purchase confirmation for ${email}`);
    
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, userName, masterclass, userId }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      console.error(`[EMAIL] ❌ HTTP ${response.status}: ${responseBody}`);
    } else {
      console.log("[EMAIL] ✅ Confirmation email triggered");
    }
  } catch (err) {
    console.error("[EMAIL] ❌ Failed to trigger confirmation email:", err);
  }
}

/**
 * Sends immediate reminder for sessions starting within 12 hours
 */
async function sendImmediateReminder(
  email: string, 
  userName: string, 
  masterclass: Masterclass, 
  contentItem: MasterclassContent
) {
  try {
    console.log(`[REMINDER] Sending immediate reminder for "${contentItem.title}"`);
    const scheduledDate = new Date(contentItem.scheduled_date!);
    const siteUrl = process.env.SITE_URL || process.env.URL || "https://your-site.netlify.app";
    
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
          <a href="${siteUrl}/masterclasses/${masterclass.id}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 5px;">
            Go to Masterclass
          </a>
          <p style="margin-top: 20px; font-size: 0.9em; color: #777;">We're excited to see you there!</p>
        </div>
      </body>
      </html>
    `;

    await sendEmail(email, `🚨 Reminder: "${contentItem.title}" starts soon!`, html);
    console.log("[REMINDER] ✅ Immediate reminder sent");
  } catch (err) {
    console.error(`[REMINDER] ❌ Failed to send reminder:`, err);
  }
}

/**
 * Main serverless handler
 */
export const handler: Handler = async (event, context) => {
  console.log("🔵 Payment verification function invoked");
  
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    let body: any;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (parseError) {
      console.error("[400] Invalid JSON:", event.body);
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Invalid JSON" }) };
    }

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
    } = body;

    if (!userId) {
      console.error("[400] Missing userId");
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing userId" }) };
    }

    const userRef = adminDb.doc(`user_profiles/${userId}`);
    const masterRef = masterclassId ? adminDb.doc(`MasterClasses/${masterclassId}`) : null;

    // ✅ FIX: Declare twelveHoursFromNow variable
    const now = new Date();
    const twelveHoursFromNow = now.getTime() + (12 * 60 * 60 * 1000);

    /* -------------------------
       DUMMY PAYMENT HANDLING
       ------------------------- */
    if (typeof razorpay_order_id === "string" && razorpay_order_id.startsWith("dummy_")) {
      console.log("[DUMMY] Processing dummy payment");

      const userSnap = await userRef.get();
      const userData = userSnap.exists ? userSnap.data() : null;
      const userEmail = userData?.email;
      const userName = userData?.name || userData?.displayName || "";

      // Record transaction
      await adminDb.runTransaction(async (tx) => {
        const docSnap = await tx.get(userRef);
        const timestamp = new Date().toISOString();

        let resolvedTitle = masterclassTitle ?? "Dummy Masterclass";
        if (!masterclassTitle && masterRef) {
          const mcSnap = await masterRef.get();
          if (mcSnap.exists) {
            resolvedTitle = mcSnap.data()?.title ?? resolvedTitle;
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
          timestamp,
          updatedAt: timestamp,
        };

        if (docSnap.exists) {
          const data = docSnap.data() || {};
          const existing = Array.isArray(data.transactions) ? data.transactions : [];
          const already = existing.some((t: any) => t.orderId === razorpay_order_id);
          
          if (!already) {
            tx.update(userRef, {
              transactions: admin.firestore.FieldValue.arrayUnion(txObj),
            });
          }
        } else {
          tx.set(userRef, {
            id: userId,
            transactions: [txObj],
            created_at: timestamp,
          });
        }
      });

      // Grant access
      if (masterclassId && masterRef) {
        const mcSnap = await masterRef.get();
        if (mcSnap.exists) {
          await masterRef.update({
            purchased_by_users: admin.firestore.FieldValue.arrayUnion(userId),
          });
        }
      }

      // ✅ Generate PDF as base64
      let pdfBase64: string | null = null;
      if (userEmail) {
        console.log("[PDF] Generating receipt for dummy payment...");
        try {
          pdfBase64 = await generatePdfReceiptBase64(
            razorpay_order_id,
            razorpay_payment_id ?? `dummy_${Date.now()}`,
            userName || userEmail,
            userEmail,
            masterclassTitle ?? "Dummy Masterclass",
            amount,
            new Date().toISOString()
          );
          
          if (pdfBase64) {
            console.log("[PDF] ✅ PDF generated successfully");
            
            // ✅ Email the PDF as attachment
            await emailPdfReceipt(
              userEmail,
              userName || userEmail,
              razorpay_order_id,
              razorpay_payment_id ?? `dummy_${Date.now()}`,
              masterclassTitle ?? "Dummy Masterclass",
              amount,
              pdfBase64
            );
          }
        } catch (pdfError) {
          console.error("[PDF] ❌ PDF generation failed:", pdfError);
        }
      }

      // Send emails
      if (userEmail) {
        let mcData = null;
        if (masterclassId && masterRef) {
          const doc = await masterRef.get();
          if (doc.exists) mcData = { id: doc.id, ...doc.data() };
        }

        await triggerPurchaseConfirmationEmail(userEmail, userName, mcData, userId);

        // Send immediate reminders
        const typedMcData = mcData as Masterclass;
        if (typedMcData?.content) {
          for (const contentItem of typedMcData.content) {
            if (contentItem.source === 'zoom' && contentItem.scheduled_date) {
              const scheduledTime = new Date(contentItem.scheduled_date).getTime();
              if (scheduledTime > now.getTime() && scheduledTime < twelveHoursFromNow) {
                await sendImmediateReminder(userEmail, userName, typedMcData, contentItem);
              }
            }
          }
        }
      }

      console.log("[DUMMY] ✅ Payment completed");
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: "Dummy payment completed",
          // ✅ Return PDF as base64 - client can download it
          receiptPdf: pdfBase64,
          receiptFilename: `receipt-${razorpay_order_id}.pdf`
        }),
      };
    }

    /* -------------------------
       RAZORPAY PAYMENT HANDLING
       ------------------------- */
    console.log("[RAZORPAY] Processing real payment");

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing payment details" }) };
    }
    if (!masterclassId) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing masterclassId" }) };
    }

    // Verify signature
    const secret = requireEnv("RAZORPAY_KEY_SECRET");
    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(signaturePayload)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("[AUTH] ❌ Invalid signature");

      // Record failed transaction
      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const timestamp = new Date().toISOString();
        
        const failObj = {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          masterclassId,
          amount: amount ?? 0,
          status: "failed",
          method,
          type,
          failureReason: "Invalid payment signature",
          timestamp,
          updatedAt: timestamp,
        };

        if (snap.exists) {
          tx.update(userRef, {
            transactions: admin.firestore.FieldValue.arrayUnion(failObj),
          });
        } else {
          tx.set(userRef, {
            id: userId,
            transactions: [failObj],
            created_at: timestamp,
          });
        }
      });

      return { 
        statusCode: 400, 
        body: JSON.stringify({ success: false, error: "Invalid Razorpay signature" }) 
      };
    }

    console.log("[AUTH] ✅ Signature verified");

    // Fetch user and masterclass
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

    // Grant access & record transaction
    await adminDb.runTransaction(async (tx) => {
      const timestamp = new Date().toISOString();
      
      const successObj = {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        masterclassId,
        masterclassTitle: masterclassTitle ?? mcData?.title ?? null,
        amount: amount ?? 0,
        status: "success",
        method,
        type,
        timestamp,
        updatedAt: timestamp,
      };

      const uSnap = await tx.get(userRef);
      if (uSnap.exists) {
        tx.update(userRef, {
          transactions: admin.firestore.FieldValue.arrayUnion(successObj),
        });
      } else {
        tx.set(userRef, {
          id: userId,
          transactions: [successObj],
          created_at: timestamp,
        });
      }

      // Grant access
      tx.update(masterRef, {
        purchased_by_users: admin.firestore.FieldValue.arrayUnion(userId),
      });
    });

    // ✅ Generate PDF as base64
    let pdfBase64: string | null = null;
    if (userEmail) {
      console.log("[PDF] Generating receipt for Razorpay payment...");
      try {
        pdfBase64 = await generatePdfReceiptBase64(
          razorpay_order_id,
          razorpay_payment_id,
          userName || userEmail,
          userEmail,
          masterclassTitle ?? mcData?.title ?? "Masterclass Purchase",
          amount,
          new Date().toISOString()
        );
        
        if (pdfBase64) {
          console.log("[PDF] ✅ PDF generated successfully");
          
          // ✅ Email the PDF as attachment
          await emailPdfReceipt(
            userEmail,
            userName || userEmail,
            razorpay_order_id,
            razorpay_payment_id,
            masterclassTitle ?? mcData?.title ?? "Masterclass Purchase",
            amount,
            pdfBase64
          );
        }
      } catch (pdfError) {
        console.error("[PDF] ❌ PDF generation failed:", pdfError);
      }
    }

    // Send emails
    if (userEmail) {
      const doc = await masterRef.get();
      const mcDataWithId = doc.exists ? { id: doc.id, ...doc.data() } : mcData;

      await triggerPurchaseConfirmationEmail(userEmail, userName, mcDataWithId, userId);

      // Send immediate reminders
      const typedMcDataWithId = mcDataWithId as Masterclass;
      if (typedMcDataWithId?.content) {
        for (const contentItem of typedMcDataWithId.content) {
          if (contentItem.source === 'zoom' && contentItem.scheduled_date) {
            const scheduledTime = new Date(contentItem.scheduled_date).getTime();
            if (scheduledTime > now.getTime() && scheduledTime < twelveHoursFromNow) {
              await sendImmediateReminder(userEmail, userName, typedMcDataWithId, contentItem);
            }
          }
        }
      }
    }

    console.log("[RAZORPAY] ✅ Payment completed");
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: "Payment verified successfully",
        // ✅ Return PDF as base64 - client can download it
        receiptPdf: pdfBase64,
        receiptFilename: `receipt-${razorpay_order_id}.pdf`
      }),
    };
    
  } catch (err: any) {
    console.error("❌ FATAL Error:", err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ success: false, error: err?.message || String(err) }) 
    };
  }
};