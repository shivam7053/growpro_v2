// // netlify/functions/payment-verify.ts
// import { Handler } from "@netlify/functions";
// import crypto from "crypto";
// import { adminDb } from "../../src/lib/firebaseAdmin";
// import admin from "firebase-admin";
// import { sendEmail } from "../../src/utils/gmailHelper";
// import { Masterclass, MasterclassContent } from "../../src/types/masterclass";
// import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

// // Helper: ensure required envs exist
// function requireEnv(name: string) {
//   const v = process.env[name];
//   if (!v) {
//     throw new Error(`Missing environment variable: ${name}`);
//   }
//   return v;
// }

// /**
//  * Generates a PDF receipt and returns it as a base64 encoded string.
//  */
// async function generatePdfReceiptBase64(
//   orderId: string,
//   paymentId: string,
//   userName: string,
//   userEmail: string,
//   masterclassTitle: string,
//   amount: number,
//   timestamp: string
// ): Promise<string> {
//   const pdfDoc = await PDFDocument.create();
//   const page = pdfDoc.addPage();
//   const { width, height } = page.getSize();
//   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//   const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//   const black = rgb(0, 0, 0);
//   const gray = rgb(0.3, 0.3, 0.3);
//   const lightGray = rgb(0.8, 0.8, 0.8);

//   // --- 1. Add Watermarks ---
//   const watermarkText = "GrowPro";
//   const watermarkOptions = {
//     font: boldFont,
//     size: 80,
//     color: black,
//     opacity: 0.08,
//     rotate: degrees(45),
//   };

//   // Tile the watermark across the page
//   for (let y = -height / 2; y < height * 1.5; y += 150) {
//     for (let x = -width / 2; x < width * 1.5; x += 300) {
//       page.drawText(watermarkText, { ...watermarkOptions, x, y });
//     }
//   }

//   // --- 2. Header ---
//   const margin = 50;
//   let yPosition = height - margin;

//   page.drawText("GrowPro", {
//     x: margin,
//     y: yPosition,
//     font: boldFont,
//     size: 28,
//     color: black,
//   });

//   page.drawText("Payment Receipt", {
//     x: width - margin - 150,
//     y: yPosition,
//     font: boldFont,
//     size: 24,
//     color: gray,
//   });

//   yPosition -= 40;
//   page.drawLine({
//     start: { x: margin, y: yPosition },
//     end: { x: width - margin, y: yPosition },
//     thickness: 1,
//     color: lightGray,
//   });
//   yPosition -= 30;

//   // --- 3. Billing Info ---
//   page.drawText("BILLED TO", {
//     x: margin,
//     y: yPosition,
//     font: boldFont,
//     size: 10,
//     color: gray,
//   });
//   yPosition -= 18;
//   page.drawText(userName, {
//     x: margin,
//     y: yPosition,
//     font,
//     size: 12,
//     color: black,
//   });
//   yPosition -= 18;
//   page.drawText(userEmail, {
//     x: margin,
//     y: yPosition,
//     font,
//     size: 12,
//     color: black,
//   });

//   const rightAlignX = width - margin;
//   let yPositionRight = height - margin - 70;

//   const receiptDetails = [
//     { label: "Order ID", value: orderId },
//     { label: "Payment ID", value: paymentId },
//     { label: "Receipt Date", value: new Date(timestamp).toLocaleDateString('en-IN') },
//   ];

//   for (const detail of receiptDetails) {
//     const labelWidth = boldFont.widthOfTextAtSize(detail.label, 10);
//     const valueWidth = font.widthOfTextAtSize(detail.value, 12);
//     page.drawText(detail.label, {
//       x: rightAlignX - labelWidth - valueWidth - 10,
//       y: yPositionRight,
//       font: boldFont,
//       size: 10,
//       color: gray,
//     });
//     page.drawText(detail.value, {
//       x: rightAlignX - valueWidth,
//       y: yPositionRight - 1, // slight adjustment for alignment
//       font,
//       size: 12,
//       color: black,
//     });
//     yPositionRight -= 22;
//   }

//   yPosition -= 50;

//   // --- 4. Items Table ---
//   page.drawLine({
//     start: { x: margin, y: yPosition },
//     end: { x: width - margin, y: yPosition },
//     thickness: 1,
//     color: black,
//   });
//   yPosition -= 20;

//   // Table Headers
//   page.drawText("DESCRIPTION", { x: margin, y: yPosition, font: boldFont, size: 10, color: gray });
//   page.drawText("AMOUNT", { x: rightAlignX - font.widthOfTextAtSize("AMOUNT", 10), y: yPosition, font: boldFont, size: 10, color: gray });
//   yPosition -= 15;
//   page.drawLine({ start: { x: margin, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 0.5, color: lightGray });
//   yPosition -= 25;

//   // Table Row
//   page.drawText(masterclassTitle, { x: margin, y: yPosition, font, size: 12, color: black });
//   const amountString = `INR ${amount.toFixed(2)}`;
//   page.drawText(amountString, { x: rightAlignX - font.widthOfTextAtSize(amountString, 12), y: yPosition, font, size: 12, color: black });
//   yPosition -= 30;

//   // --- 5. Total ---
//   page.drawLine({ start: { x: width / 2, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 0.5, color: lightGray });
//   yPosition -= 25;

//   const totalLabel = "Total Paid";
//   const totalValue = `INR ${amount.toFixed(2)}`;
//   page.drawText(totalLabel, { x: rightAlignX - font.widthOfTextAtSize(totalValue, 14) - boldFont.widthOfTextAtSize(totalLabel, 14) - 20, y: yPosition, font: boldFont, size: 14, color: black });
//   page.drawText(totalValue, { x: rightAlignX - font.widthOfTextAtSize(totalValue, 14), y: yPosition, font: boldFont, size: 14, color: black });
//   yPosition -= 50;

//   // --- 6. Footer ---
//   page.drawText("Thank you for your purchase!", { x: margin, y: yPosition, font: boldFont, size: 14, color: black });
//   yPosition -= 20;
//   page.drawText("If you have any questions, please contact support at india.growpro@gmail.com.", { x: margin, y: yPosition, font, size: 10, color: gray });

//   return await pdfDoc.saveAsBase64();
// }

// /**
//  * Triggers purchase confirmation email (fire-and-forget)
//  */
// async function triggerPurchaseConfirmationEmail(
//   email: string, 
//   userName: string, 
//   masterclass: any, 
//   userId: string,
//   pdfBase64: string | null
// ) {
//   const baseUrl = process.env.URL || process.env.DEPLOY_URL || "https://your-site.netlify.app";
//   const functionUrl = `${baseUrl}/.netlify/functions/send-purchase-confirmation`;
  
//   try {
//     console.log(`[EMAIL] Triggering purchase confirmation for ${email} (with${pdfBase64 ? '' : 'out'} PDF)`);
    
//     const response = await fetch(functionUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, userName, masterclass, userId, pdfBase64 }),
//     });

//     if (!response.ok) {
//       const responseBody = await response.text();
//       console.error(`[EMAIL] ❌ HTTP ${response.status}: ${responseBody}`);
//     } else {
//       console.log("[EMAIL] ✅ Confirmation email triggered");
//     }
//   } catch (err) {
//     console.error("[EMAIL] ❌ Failed to trigger confirmation email:", err);
//   }
// }

// /**
//  * Sends immediate reminder for sessions starting within 12 hours
//  */
// async function sendImmediateReminder(
//   email: string, 
//   userName: string, 
//   masterclass: Masterclass, 
//   contentItem: MasterclassContent
// ) {
//   try {
//     console.log(`[REMINDER] Sending immediate reminder for "${contentItem.title}"`);
//     const scheduledDate = new Date(contentItem.scheduled_date!);
//     const siteUrl = process.env.SITE_URL || process.env.URL || "https://your-site.netlify.app";
    
//     const html = `
//       <!DOCTYPE html>
//       <html>
//       <body>
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
//           <h2 style="color: #333;">🚨 Reminder: Your Live Session is Starting Soon!</h2>
//           <p>Hi ${userName},</p>
//           <p>Thank you for your purchase! This is an immediate reminder that your live session, "<b>${contentItem.title}</b>", is scheduled to begin soon.</p>
//           <p><b>Scheduled Time:</b> ${scheduledDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
//           <p>You can access the session details and join link directly from the masterclass page:</p>
//           <a href="${siteUrl}/masterclasses/${masterclass.id}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 5px;">
//             Go to Masterclass
//           </a>
//           <p style="margin-top: 20px; font-size: 0.9em; color: #777;">We're excited to see you there!</p>
//         </div>
//       </body>
//       </html>
//     `;

//     await sendEmail(email, `🚨 Reminder: "${contentItem.title}" starts soon!`, html);
//     console.log("[REMINDER] ✅ Immediate reminder sent");
//   } catch (err) {
//     console.error(`[REMINDER] ❌ Failed to send reminder:`, err);
//   }
// }

// /**
//  * Main serverless handler
//  */
// export const handler: Handler = async (event, context) => {
//   console.log("🔵 Payment verification function invoked");
  
//   try {
//     if (event.httpMethod !== "POST") {
//       console.warn(`[405] Method Not Allowed: ${event.httpMethod}`);
//       return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
//     }

//     let body: any;
//     try {
//       body = JSON.parse(event.body || "{}");
//       console.log("[INFO] Parsed request body:", JSON.stringify(body, null, 2));
//     } catch (parseError) {
//       console.error("[400] Invalid JSON:", event.body);
//       return { statusCode: 400, body: JSON.stringify({ success: false, error: "Invalid JSON" }) };
//     }

//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       masterclassId,
//       userId,
//       masterclassTitle,
//       amount = 0,
//       method = "razorpay",
//       type = "purchase",
//     } = body;

//     console.log(`[INFO] Processing payment for User: ${userId}, Masterclass: ${masterclassId}, Order: ${razorpay_order_id}`);

//     if (!userId) {
//       console.error("[400] Missing userId in payload");
//       return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing userId" }) };
//     }

//     const userRef = adminDb.doc(`user_profiles/${userId}`);
//     const masterRef = masterclassId ? adminDb.doc(`MasterClasses/${masterclassId}`) : null;

//     // ✅ FIX: Declare twelveHoursFromNow variable
//     const now = new Date();
//     const twelveHoursFromNow = now.getTime() + (12 * 60 * 60 * 1000);

//     /* -------------------------
//        DUMMY PAYMENT HANDLING
//        ------------------------- */
//     if (typeof razorpay_order_id === "string" && razorpay_order_id.startsWith("dummy_")) {
//       console.log(`[DUMMY] Processing dummy payment for order ${razorpay_order_id}`);

//       const userSnap = await userRef.get();
//       const userData = userSnap.exists ? userSnap.data() : null;
//       if (!userSnap.exists) {
//         console.warn(`[DUMMY] User profile ${userId} not found for dummy payment.`);
//       }
//       const userEmail = userData?.email;
//       const userName = userData?.name || userData?.displayName || "";
//       console.log(`[DUMMY] User details: Email=${userEmail}, Name=${userName}`);

//       // Record transaction
//       console.log(`[DUMMY] Recording transaction for order ${razorpay_order_id}`);
//       await adminDb.runTransaction(async (tx) => {
//         const docSnap = await tx.get(userRef);
//         const timestamp = new Date().toISOString();

//         let resolvedTitle = masterclassTitle ?? "Dummy Masterclass";
//         if (!masterclassTitle && masterRef) {
//           const mcSnap = await masterRef.get();
//           if (mcSnap.exists) {
//             resolvedTitle = mcSnap.data()?.title ?? resolvedTitle;
//           }
//         }

//         const txObj = {
//           orderId: razorpay_order_id,
//           paymentId: razorpay_payment_id ?? `dummy_${Date.now()}`,
//           masterclassId: masterclassId ?? null,
//           masterclassTitle: resolvedTitle,
//           amount: amount ?? 0,
//           status: "success",
//           type,
//           method,
//           timestamp,
//           updatedAt: timestamp,
//         };

//         if (docSnap.exists) {
//           const data = docSnap.data() || {};
//           const existing = Array.isArray(data.transactions) ? data.transactions : [];
//           const already = existing.some((t: any) => t.orderId === razorpay_order_id);
          
//           if (!already) {
//             tx.update(userRef, {
//               transactions: admin.firestore.FieldValue.arrayUnion(txObj),
//             });
//           }
//         } else {
//           tx.set(userRef, {
//             id: userId,
//             transactions: [txObj],
//             created_at: timestamp,
//           });
//         }
//       });
//       console.log(`[DUMMY] ✅ Transaction recorded.`);

//       // Grant access
//       if (masterclassId && masterRef) {
//         console.log(`[DUMMY] Granting access for user ${userId} to masterclass ${masterclassId}`);
//         const mcSnap = await masterRef.get();
//         if (mcSnap.exists) {
//           await masterRef.update({
//             purchased_by_users: admin.firestore.FieldValue.arrayUnion(userId),
//           });
//           console.log(`[DUMMY] ✅ Access granted.`);
//         } else {
//           console.warn(`[DUMMY] Masterclass ${masterclassId} not found. Cannot grant access.`);
//         }
//       }

//       // ✅ Generate PDF as base64
//       let pdfBase64: string | null = null;
//       if (userEmail) {
//         console.log("[PDF] Generating receipt for dummy payment...");
//         try {
//           pdfBase64 = await generatePdfReceiptBase64(
//             razorpay_order_id,
//             razorpay_payment_id ?? `dummy_${Date.now()}`,
//             userName || userEmail,
//             userEmail,
//             masterclassTitle ?? "Dummy Masterclass",
//             amount,
//             new Date().toISOString()
//           );
          
//           if (pdfBase64) {
//             console.log("[PDF] ✅ PDF generated successfully");
//           }
//         } catch (pdfError) {
//           console.error("[PDF] ❌ PDF generation failed:", pdfError);
//         }
//       } else {
//         console.log("[PDF] Skipping PDF receipt generation: no user email found.");
//       }

//       // Send emails
//       if (userEmail) {
//         console.log(`[EMAIL] Preparing to send emails for dummy payment to ${userEmail}`);
//         let mcData = null;
//         if (masterclassId && masterRef) {
//           const doc = await masterRef.get();
//           if (doc.exists) mcData = { id: doc.id, ...doc.data() };
//         }

//         await triggerPurchaseConfirmationEmail(userEmail, userName, mcData, userId, pdfBase64);

//         // Send immediate reminders
//         const typedMcData = mcData as Masterclass;
//         if (typedMcData?.content) {
//           console.log(`[REMINDER] Checking for immediate reminders for masterclass "${typedMcData.title}"`);
//           for (const contentItem of typedMcData.content) {
//             if (contentItem.source === 'zoom' && contentItem.scheduled_date) {
//               const scheduledTime = new Date(contentItem.scheduled_date).getTime();
//               if (scheduledTime > now.getTime() && scheduledTime < twelveHoursFromNow) {
//                 console.log(`[REMINDER] Found session "${contentItem.title}" starting soon.`);
//                 await sendImmediateReminder(userEmail, userName, typedMcData, contentItem);
//               }
//             }
//           }
//         } else {
//           console.log(`[REMINDER] No content found for masterclass, skipping reminder check.`);
//         }
//       } else {
//         console.log("[EMAIL] Skipping email notifications: no user email found.");
//       }

//       console.log(`[DUMMY] ✅ Dummy payment for order ${razorpay_order_id} completed successfully.`);
//       return {
//         statusCode: 200,
//         body: JSON.stringify({ 
//           success: true, 
//           message: "Dummy payment completed",
//           // ✅ Return PDF as base64 - client can download it
//           receiptPdf: pdfBase64,
//           receiptFilename: `receipt-${razorpay_order_id}.pdf`
//         }),
//       };
//     }

//     /* -------------------------
//        RAZORPAY PAYMENT HANDLING
//        ------------------------- */
//     console.log(`[RAZORPAY] Processing real payment for order ${razorpay_order_id}`);

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       console.error("[400] Missing Razorpay payment details in payload.");
//       return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing payment details" }) };
//     }
//     if (!masterclassId) {
//       console.error("[400] Missing masterclassId in payload for Razorpay payment.");
//       return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing masterclassId" }) };
//     }

//     // Verify signature
//     console.log(`[AUTH] Verifying signature for order ${razorpay_order_id}`);
//     const secret = requireEnv("RAZORPAY_KEY_SECRET");
//     const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const generatedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(signaturePayload)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       console.error(`[AUTH] ❌ Invalid signature for order ${razorpay_order_id}. Generated: ${generatedSignature}, Received: ${razorpay_signature}`);

//       // Record failed transaction
//       console.log(`[DB] Recording failed transaction for order ${razorpay_order_id}`);
//       await adminDb.runTransaction(async (tx) => {
//         const snap = await tx.get(userRef);
//         const timestamp = new Date().toISOString();
        
//         const failObj = {
//           orderId: razorpay_order_id,
//           paymentId: razorpay_payment_id,
//           masterclassId,
//           amount: amount ?? 0,
//           status: "failed",
//           method,
//           type,
//           failureReason: "Invalid payment signature",
//           timestamp,
//           updatedAt: timestamp,
//         };

//         if (snap.exists) {
//           tx.update(userRef, {
//             transactions: admin.firestore.FieldValue.arrayUnion(failObj),
//           });
//         } else {
//           tx.set(userRef, {
//             id: userId,
//             transactions: [failObj],
//             created_at: timestamp,
//           });
//         }
//       });
//       console.log(`[DB] ✅ Failed transaction recorded.`);

//       return { 
//         statusCode: 400, 
//         body: JSON.stringify({ success: false, error: "Invalid Razorpay signature" }) 
//       };
//     }

//     console.log(`[AUTH] ✅ Signature verified for order ${razorpay_order_id}`);

//     // Fetch user and masterclass
//     console.log(`[DB] Fetching user ${userId} and masterclass ${masterclassId}`);
//     const userSnap = await userRef.get();
//     if (!userSnap.exists) {
//       console.error(`[404] User ${userId} not found.`);
//       return { statusCode: 404, body: JSON.stringify({ success: false, error: "User not found" }) };
//     }

//     const userData = userSnap.data();
//     const userEmail = userData?.email;
//     const userName = userData?.name || userData?.displayName || "";
//     console.log(`[DB] Found user: Email=${userEmail}, Name=${userName}`);

//     if (!masterRef) {
//       // This should be caught earlier, but for safety
//       console.error(`[500] Internal error: masterRef is null for masterclassId ${masterclassId}`);
//       return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing masterclassRef" }) };
//     }

//     const mcSnap = await masterRef.get();
//     if (!mcSnap.exists) {
//       console.error(`[404] Masterclass ${masterclassId} not found.`);
//       return { statusCode: 404, body: JSON.stringify({ success: false, error: "Masterclass not found" }) };
//     }

//     const mcData = mcSnap.data();
//     console.log(`[DB] Found masterclass: "${mcData?.title}"`);

//     // Grant access & record transaction
//     console.log(`[DB] Starting transaction to grant access and record payment for order ${razorpay_order_id}`);
//     await adminDb.runTransaction(async (tx) => {
//       const timestamp = new Date().toISOString();
      
//       const successObj = {
//         orderId: razorpay_order_id,
//         paymentId: razorpay_payment_id,
//         masterclassId,
//         masterclassTitle: masterclassTitle ?? mcData?.title ?? null,
//         amount: amount ?? 0,
//         status: "success",
//         method,
//         type,
//         timestamp,
//         updatedAt: timestamp,
//       };

//       const uSnap = await tx.get(userRef);
//       if (uSnap.exists) {
//         tx.update(userRef, {
//           transactions: admin.firestore.FieldValue.arrayUnion(successObj),
//         });
//       } else {
//         tx.set(userRef, {
//           id: userId,
//           transactions: [successObj],
//           created_at: timestamp,
//         });
//       }

//       // Grant access
//       tx.update(masterRef, {
//         purchased_by_users: admin.firestore.FieldValue.arrayUnion(userId),
//       });
//     });
//     console.log(`[DB] ✅ Transaction completed successfully.`);

//     // ✅ Generate PDF as base64
//     let pdfBase64: string | null = null;
//     if (userEmail) {
//       console.log(`[PDF] Generating receipt for Razorpay payment ${razorpay_payment_id}...`);
//       try {
//         pdfBase64 = await generatePdfReceiptBase64(
//           razorpay_order_id,
//           razorpay_payment_id,
//           userName || userEmail,
//           userEmail,
//           masterclassTitle ?? mcData?.title ?? "Masterclass Purchase",
//           amount,
//           new Date().toISOString()
//         );
        
//         if (pdfBase64) {
//           console.log("[PDF] ✅ PDF generated successfully");
//         }
//       } catch (pdfError) {
//         console.error("[PDF] ❌ PDF generation failed:", pdfError);
//       }
//     } else {
//       console.log("[PDF] Skipping PDF receipt generation: no user email found.");
//     }

//     // Send emails
//     if (userEmail) {
//       console.log(`[EMAIL] Preparing to send emails for order ${razorpay_order_id} to ${userEmail}`);
//       const doc = await masterRef.get();
//       const mcDataWithId = doc.exists ? { id: doc.id, ...doc.data() } : mcData;

//       await triggerPurchaseConfirmationEmail(userEmail, userName, mcDataWithId, userId, pdfBase64);

//       // Send immediate reminders
//       const typedMcDataWithId = mcDataWithId as Masterclass;
//       if (typedMcDataWithId?.content) {
//         console.log(`[REMINDER] Checking for immediate reminders for masterclass "${typedMcDataWithId.title}"`);
//         for (const contentItem of typedMcDataWithId.content) {
//           if (contentItem.source === 'zoom' && contentItem.scheduled_date) {
//             const scheduledTime = new Date(contentItem.scheduled_date).getTime();
//             if (scheduledTime > now.getTime() && scheduledTime < twelveHoursFromNow) {
//               console.log(`[REMINDER] Found session "${contentItem.title}" starting soon.`);
//               await sendImmediateReminder(userEmail, userName, typedMcDataWithId, contentItem);
//             }
//           }
//         }
//       } else {
//         console.log(`[REMINDER] No content found for masterclass, skipping reminder check.`);
//       }
//     } else {
//       console.log("[EMAIL] Skipping email notifications: no user email found.");
//     }

//     console.log(`[RAZORPAY] ✅ Payment for order ${razorpay_order_id} completed successfully.`);
//     return {
//       statusCode: 200,
//       body: JSON.stringify({ 
//         success: true, 
//         message: "Payment verified successfully",
//         // ✅ Return PDF as base64 - client can download it
//         receiptPdf: pdfBase64,
//         receiptFilename: `receipt-${razorpay_order_id}.pdf`
//       }),
//     };
    
//   } catch (err: any) {
//     console.error("❌ FATAL Error in payment-verify handler:", err);
//     return { 
//       statusCode: 500, 
//       body: JSON.stringify({ success: false, error: err?.message || String(err) }) 
//     };
//   }
// };

// netlify/functions/payment-verify.ts
import { Handler } from "@netlify/functions";
import crypto from "crypto";
import { adminDb } from "../../src/lib/firebaseAdmin";
import admin from "firebase-admin";
import { sendEmail } from "../../src/utils/gmailHelper";
import { Masterclass, MasterclassContent, YoutubeContent, ZoomContent, TestContent } from "../../src/types/masterclass";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

// Type guard functions
const isYoutubeContent = (content: MasterclassContent): content is YoutubeContent => {
  return content.source === 'youtube';
};

const isZoomContent = (content: MasterclassContent): content is ZoomContent => {
  return content.source === 'zoom';
};

const isTestContent = (content: MasterclassContent): content is TestContent => {
  return content.source === 'test';
};

// Helper to check if content has scheduled_date
const hasScheduledDate = (content: MasterclassContent): content is YoutubeContent | ZoomContent => {
  return isYoutubeContent(content) || isZoomContent(content);
};

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
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const gray = rgb(0.3, 0.3, 0.3);
  const lightGray = rgb(0.8, 0.8, 0.8);

  // --- 1. Add Watermarks ---
  const watermarkText = "GrowPro";
  const watermarkOptions = {
    font: boldFont,
    size: 80,
    color: black,
    opacity: 0.08,
    rotate: degrees(45),
  };

  // Tile the watermark across the page
  for (let y = -height / 2; y < height * 1.5; y += 150) {
    for (let x = -width / 2; x < width * 1.5; x += 300) {
      page.drawText(watermarkText, { ...watermarkOptions, x, y });
    }
  }

  // --- 2. Header ---
  const margin = 50;
  let yPosition = height - margin;

  page.drawText("GrowPro", {
    x: margin,
    y: yPosition,
    font: boldFont,
    size: 28,
    color: black,
  });

  page.drawText("Payment Receipt", {
    x: width - margin - 150,
    y: yPosition,
    font: boldFont,
    size: 24,
    color: gray,
  });

  yPosition -= 40;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: lightGray,
  });
  yPosition -= 30;

  // --- 3. Billing Info ---
  page.drawText("BILLED TO", {
    x: margin,
    y: yPosition,
    font: boldFont,
    size: 10,
    color: gray,
  });
  yPosition -= 18;
  page.drawText(userName, {
    x: margin,
    y: yPosition,
    font,
    size: 12,
    color: black,
  });
  yPosition -= 18;
  page.drawText(userEmail, {
    x: margin,
    y: yPosition,
    font,
    size: 12,
    color: black,
  });

  const rightAlignX = width - margin;
  let yPositionRight = height - margin - 70;

  const receiptDetails = [
    { label: "Order ID", value: orderId },
    { label: "Payment ID", value: paymentId },
    { label: "Receipt Date", value: new Date(timestamp).toLocaleDateString('en-IN') },
  ];

  for (const detail of receiptDetails) {
    const labelWidth = boldFont.widthOfTextAtSize(detail.label, 10);
    const valueWidth = font.widthOfTextAtSize(detail.value, 12);
    page.drawText(detail.label, {
      x: rightAlignX - labelWidth - valueWidth - 10,
      y: yPositionRight,
      font: boldFont,
      size: 10,
      color: gray,
    });
    page.drawText(detail.value, {
      x: rightAlignX - valueWidth,
      y: yPositionRight - 1, // slight adjustment for alignment
      font,
      size: 12,
      color: black,
    });
    yPositionRight -= 22;
  }

  yPosition -= 50;

  // --- 4. Items Table ---
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: black,
  });
  yPosition -= 20;

  // Table Headers
  page.drawText("DESCRIPTION", { x: margin, y: yPosition, font: boldFont, size: 10, color: gray });
  page.drawText("AMOUNT", { x: rightAlignX - font.widthOfTextAtSize("AMOUNT", 10), y: yPosition, font: boldFont, size: 10, color: gray });
  yPosition -= 15;
  page.drawLine({ start: { x: margin, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 0.5, color: lightGray });
  yPosition -= 25;

  // Table Row
  page.drawText(masterclassTitle, { x: margin, y: yPosition, font, size: 12, color: black });
  const amountString = `INR ${amount.toFixed(2)}`;
  page.drawText(amountString, { x: rightAlignX - font.widthOfTextAtSize(amountString, 12), y: yPosition, font, size: 12, color: black });
  yPosition -= 30;

  // --- 5. Total ---
  page.drawLine({ start: { x: width / 2, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 0.5, color: lightGray });
  yPosition -= 25;

  const totalLabel = "Total Paid";
  const totalValue = `INR ${amount.toFixed(2)}`;
  page.drawText(totalLabel, { x: rightAlignX - font.widthOfTextAtSize(totalValue, 14) - boldFont.widthOfTextAtSize(totalLabel, 14) - 20, y: yPosition, font: boldFont, size: 14, color: black });
  page.drawText(totalValue, { x: rightAlignX - font.widthOfTextAtSize(totalValue, 14), y: yPosition, font: boldFont, size: 14, color: black });
  yPosition -= 50;

  // --- 6. Footer ---
  page.drawText("Thank you for your purchase!", { x: margin, y: yPosition, font: boldFont, size: 14, color: black });
  yPosition -= 20;
  page.drawText("If you have any questions, please contact support at india.growpro@gmail.com.", { x: margin, y: yPosition, font, size: 10, color: gray });

  return await pdfDoc.saveAsBase64();
}

/**
 * Triggers purchase confirmation email (fire-and-forget)
 */
async function triggerPurchaseConfirmationEmail(
  email: string, 
  userName: string, 
  masterclass: any, 
  userId: string,
  pdfBase64: string | null
) {
  const baseUrl = process.env.URL || process.env.DEPLOY_URL || "https://your-site.netlify.app";
  const functionUrl = `${baseUrl}/.netlify/functions/send-purchase-confirmation`;
  
  try {
    console.log(`[EMAIL] Triggering purchase confirmation for ${email} (with${pdfBase64 ? '' : 'out'} PDF)`);
    
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, userName, masterclass, userId, pdfBase64 }),
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
 * ✅ FIXED: Now uses type guard to check if content has scheduled_date
 */
async function sendImmediateReminder(
  email: string, 
  userName: string, 
  masterclass: Masterclass, 
  contentItem: ZoomContent // ✅ Changed to ZoomContent since we only call this for Zoom sessions
) {
  try {
    console.log(`[REMINDER] Sending immediate reminder for "${contentItem.title}"`);
    
    // ✅ Now TypeScript knows scheduled_date exists because contentItem is ZoomContent
    if (!contentItem.scheduled_date) {
      console.warn(`[REMINDER] No scheduled_date found for "${contentItem.title}"`);
      return;
    }
    
    const scheduledDate = new Date(contentItem.scheduled_date);
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
      console.warn(`[405] Method Not Allowed: ${event.httpMethod}`);
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    let body: any;
    try {
      body = JSON.parse(event.body || "{}");
      console.log("[INFO] Parsed request body:", JSON.stringify(body, null, 2));
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

    console.log(`[INFO] Processing payment for User: ${userId}, Masterclass: ${masterclassId}, Order: ${razorpay_order_id}`);

    if (!userId) {
      console.error("[400] Missing userId in payload");
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
      console.log(`[DUMMY] Processing dummy payment for order ${razorpay_order_id}`);

      const userSnap = await userRef.get();
      const userData = userSnap.exists ? userSnap.data() : null;
      if (!userSnap.exists) {
        console.warn(`[DUMMY] User profile ${userId} not found for dummy payment.`);
      }
      const userEmail = userData?.email;
      const userName = userData?.name || userData?.displayName || "";
      console.log(`[DUMMY] User details: Email=${userEmail}, Name=${userName}`);

      // Record transaction
      console.log(`[DUMMY] Recording transaction for order ${razorpay_order_id}`);
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
      console.log(`[DUMMY] ✅ Transaction recorded.`);

      // Grant access
      if (masterclassId && masterRef) {
        console.log(`[DUMMY] Granting access for user ${userId} to masterclass ${masterclassId}`);
        const mcSnap = await masterRef.get();
        if (mcSnap.exists) {
          await masterRef.update({
            purchased_by_users: admin.firestore.FieldValue.arrayUnion(userId),
          });
          console.log(`[DUMMY] ✅ Access granted.`);
        } else {
          console.warn(`[DUMMY] Masterclass ${masterclassId} not found. Cannot grant access.`);
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
          }
        } catch (pdfError) {
          console.error("[PDF] ❌ PDF generation failed:", pdfError);
        }
      } else {
        console.log("[PDF] Skipping PDF receipt generation: no user email found.");
      }

      // Send emails
      if (userEmail) {
        console.log(`[EMAIL] Preparing to send emails for dummy payment to ${userEmail}`);
        let mcData = null;
        if (masterclassId && masterRef) {
          const doc = await masterRef.get();
          if (doc.exists) mcData = { id: doc.id, ...doc.data() };
        }

        await triggerPurchaseConfirmationEmail(userEmail, userName, mcData, userId, pdfBase64);

        // ✅ FIXED: Send immediate reminders with proper type checking
        const typedMcData = mcData as Masterclass;
        if (typedMcData?.content) {
          console.log(`[REMINDER] Checking for immediate reminders for masterclass "${typedMcData.title}"`);
          for (const contentItem of typedMcData.content) {
            // ✅ Only check Zoom content with type guard
            if (isZoomContent(contentItem) && contentItem.scheduled_date) {
              const scheduledTime = new Date(contentItem.scheduled_date).getTime();
              if (scheduledTime > now.getTime() && scheduledTime < twelveHoursFromNow) {
                console.log(`[REMINDER] Found session "${contentItem.title}" starting soon.`);
                // ✅ Now contentItem is typed as ZoomContent
                await sendImmediateReminder(userEmail, userName, typedMcData, contentItem);
              }
            }
          }
        } else {
          console.log(`[REMINDER] No content found for masterclass, skipping reminder check.`);
        }
      } else {
        console.log("[EMAIL] Skipping email notifications: no user email found.");
      }

      console.log(`[DUMMY] ✅ Dummy payment for order ${razorpay_order_id} completed successfully.`);
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
    console.log(`[RAZORPAY] Processing real payment for order ${razorpay_order_id}`);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("[400] Missing Razorpay payment details in payload.");
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing payment details" }) };
    }
    if (!masterclassId) {
      console.error("[400] Missing masterclassId in payload for Razorpay payment.");
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing masterclassId" }) };
    }

    // Verify signature
    console.log(`[AUTH] Verifying signature for order ${razorpay_order_id}`);
    const secret = requireEnv("RAZORPAY_KEY_SECRET");
    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(signaturePayload)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error(`[AUTH] ❌ Invalid signature for order ${razorpay_order_id}. Generated: ${generatedSignature}, Received: ${razorpay_signature}`);

      // Record failed transaction
      console.log(`[DB] Recording failed transaction for order ${razorpay_order_id}`);
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
      console.log(`[DB] ✅ Failed transaction recorded.`);

      return { 
        statusCode: 400, 
        body: JSON.stringify({ success: false, error: "Invalid Razorpay signature" }) 
      };
    }

    console.log(`[AUTH] ✅ Signature verified for order ${razorpay_order_id}`);

    // Fetch user and masterclass
    console.log(`[DB] Fetching user ${userId} and masterclass ${masterclassId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      console.error(`[404] User ${userId} not found.`);
      return { statusCode: 404, body: JSON.stringify({ success: false, error: "User not found" }) };
    }

    const userData = userSnap.data();
    const userEmail = userData?.email;
    const userName = userData?.name || userData?.displayName || "";
    console.log(`[DB] Found user: Email=${userEmail}, Name=${userName}`);

    if (!masterRef) {
      // This should be caught earlier, but for safety
      console.error(`[500] Internal error: masterRef is null for masterclassId ${masterclassId}`);
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing masterclassRef" }) };
    }

    const mcSnap = await masterRef.get();
    if (!mcSnap.exists) {
      console.error(`[404] Masterclass ${masterclassId} not found.`);
      return { statusCode: 404, body: JSON.stringify({ success: false, error: "Masterclass not found" }) };
    }

    const mcData = mcSnap.data();
    console.log(`[DB] Found masterclass: "${mcData?.title}"`);

    // Grant access & record transaction
    console.log(`[DB] Starting transaction to grant access and record payment for order ${razorpay_order_id}`);
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
    console.log(`[DB] ✅ Transaction completed successfully.`);

    // ✅ Generate PDF as base64
    let pdfBase64: string | null = null;
    if (userEmail) {
      console.log(`[PDF] Generating receipt for Razorpay payment ${razorpay_payment_id}...`);
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
        }
      } catch (pdfError) {
        console.error("[PDF] ❌ PDF generation failed:", pdfError);
      }
    } else {
      console.log("[PDF] Skipping PDF receipt generation: no user email found.");
    }

    // Send emails
    if (userEmail) {
      console.log(`[EMAIL] Preparing to send emails for order ${razorpay_order_id} to ${userEmail}`);
      const doc = await masterRef.get();
      const mcDataWithId = doc.exists ? { id: doc.id, ...doc.data() } : mcData;

      await triggerPurchaseConfirmationEmail(userEmail, userName, mcDataWithId, userId, pdfBase64);

      // ✅ FIXED: Send immediate reminders with proper type checking
      const typedMcDataWithId = mcDataWithId as Masterclass;
      if (typedMcDataWithId?.content) {
        console.log(`[REMINDER] Checking for immediate reminders for masterclass "${typedMcDataWithId.title}"`);
        for (const contentItem of typedMcDataWithId.content) {
          // ✅ Only check Zoom content with type guard
          if (isZoomContent(contentItem) && contentItem.scheduled_date) {
            const scheduledTime = new Date(contentItem.scheduled_date).getTime();
            if (scheduledTime > now.getTime() && scheduledTime < twelveHoursFromNow) {
              console.log(`[REMINDER] Found session "${contentItem.title}" starting soon.`);
              // ✅ Now contentItem is typed as ZoomContent
              await sendImmediateReminder(userEmail, userName, typedMcDataWithId, contentItem);
            }
          }
        }
      } else {
        console.log(`[REMINDER] No content found for masterclass, skipping reminder check.`);
      }
    } else {
      console.log("[EMAIL] Skipping email notifications: no user email found.");
    }

    console.log(`[RAZORPAY] ✅ Payment for order ${razorpay_order_id} completed successfully.`);
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
    console.error("❌ FATAL Error in payment-verify handler:", err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ success: false, error: err?.message || String(err) }) 
    };
  }
};