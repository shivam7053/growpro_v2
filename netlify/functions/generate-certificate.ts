
// // netlify/functions/generate-certificate.ts


// import type { Handler, HandlerEvent } from "@netlify/functions";
// import { readFileSync } from 'fs';
// import { join } from 'path';
// import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
// import { adminDb } from '../../src/lib/firebaseAdmin';
// import { UserProfile } from '../../src/types/masterclass';

// const handler: Handler = async (event: HandlerEvent) => {
//   if (event.httpMethod !== 'GET') {
//     return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
//   }

//   try {
//     // Path will be like /.netlify/functions/generate-certificate/userId/certId
//     const pathParts = event.path.split('/').filter(p => p);
//     const userId = pathParts[pathParts.length - 2];
//     const certificateId = pathParts[pathParts.length - 1];

//     if (!userId || !certificateId) {
//       return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId or certificateId in URL' }) };
//     }

//     // 1. Fetch user profile from Firestore
//     const userProfileRef = adminDb.collection("user_profiles").doc(userId);
//     const userProfileSnap = await userProfileRef.get();

//     if (!userProfileSnap.exists) {
//       return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
//     }
//     const userProfile = userProfileSnap.data() as UserProfile;

//     // 2. Find the specific certificate data
//     const certificateData = userProfile.certificates?.find(c => c.id === certificateId);

//     if (!certificateData) {
//       return { statusCode: 404, body: JSON.stringify({ error: 'Certificate not found' }) };
//     }

//     // 3. Generate PDF using pdf-lib
//     const pdfDoc = await PDFDocument.create();
//     const page = pdfDoc.addPage([841.89, 595.28]); // A4 Landscape
//     const { width, height } = page.getSize();

//     // Load fonts
//     const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//     // Load images (assuming they are in the same directory as the function)
//     const logoImageBytes = readFileSync(join(process.cwd(), 'public', 'logo_growpro.png'));
//     const signatureImageBytes = readFileSync(join(process.cwd(), 'public', 'signature.png'));
//     const logoImage = await pdfDoc.embedPng(logoImageBytes);
//     const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

//     // Define colors
//     const growproBlue = rgb(79 / 255, 70 / 255, 229 / 255);
//     const growproGray = rgb(107 / 255, 114 / 255, 128 / 255);

//     // --- Draw Watermark ---
//     const watermarkText = 'GrowPro';
//     const watermarkFontSize = 150;
//     const watermarkWidth = helveticaBoldFont.widthOfTextAtSize(watermarkText, watermarkFontSize);
//     page.drawText(watermarkText, {
//       x: width / 2 - watermarkWidth / 2,
//       y: height / 2 - watermarkFontSize / 3,
//       font: helveticaBoldFont,
//       size: watermarkFontSize,
//       color: growproGray,
//       opacity: 0.08,
//       rotate: degrees(45),
//     });

//     // --- Draw Content ---
//     // Header Logo
//     page.drawImage(logoImage, {
//       x: width / 2 - (1.5 * 28.35) / 2,
//       y: height - 1.5 * 28.35 - 30,
//       height: 1.5 * 28.35, // 1cm = 28.35 points
//     });

//     // Certificate Title
//     const titleText = 'Certificate of Completion';
//     const titleFontSize = 40;
//     const titleWidth = helveticaBoldFont.widthOfTextAtSize(titleText, titleFontSize);
//     page.drawText(titleText, {
//       x: width / 2 - titleWidth / 2,
//       y: height - 180,
//       font: helveticaBoldFont,
//       size: titleFontSize,
//       color: growproBlue,
//     });

//     // "This is to certify that"
//     page.drawText('This is to certify that', {
//       x: width / 2 - helveticaFont.widthOfTextAtSize('This is to certify that', 16) / 2,
//       y: height - 250,
//       font: helveticaFont,
//       size: 16,
//       color: growproGray,
//     });

//     // User Name
//     const userName = certificateData.userName;
//     const userNameFontSize = 32;
//     const userNameWidth = helveticaBoldFont.widthOfTextAtSize(userName, userNameFontSize);
//     page.drawText(userName, {
//       x: width / 2 - userNameWidth / 2,
//       y: height - 300,
//       font: helveticaBoldFont,
//       size: userNameFontSize,
//     });

//     // "has successfully completed the masterclass"
//     const completedText = 'has successfully completed the masterclass';
//     const completedTextWidth = helveticaFont.widthOfTextAtSize(completedText, 16);
//     page.drawText(completedText, {
//       x: width / 2 - completedTextWidth / 2,
//       y: height - 350,
//       font: helveticaFont,
//       size: 16,
//       color: growproGray,
//     });

//     // Masterclass Title
//     const masterclassTitle = `"${certificateData.masterclassTitle}"`;
//     const masterclassTitleFontSize = 24;
//     const masterclassTitleWidth = helveticaBoldFont.widthOfTextAtSize(masterclassTitle, masterclassTitleFontSize);
//     page.drawText(masterclassTitle, {
//       x: width / 2 - masterclassTitleWidth / 2,
//       y: height - 390,
//       font: helveticaBoldFont,
//       size: masterclassTitleFontSize,
//     });

//     // Speaker Name
//     const speakerText = `conducted by ${certificateData.speakerName}`;
//     const speakerTextWidth = helveticaFont.widthOfTextAtSize(speakerText, 16);
//     page.drawText(speakerText, {
//       x: width / 2 - speakerTextWidth / 2,
//       y: height - 425,
//       font: helveticaFont,
//       size: 16,
//       color: growproGray,
//     });

//     // --- Footer Section ---
//     // (This is a simplified layout; you can adjust coordinates as needed)
//     const leftColumnX = width * 0.25;
//     const rightColumnX = width * 0.75;

//     // Signature, Date, and ID details... (implementation similar to above)

//     // Save PDF to buffer
//     const pdfBytes = await pdfDoc.save();

//     return {
//       statusCode: 200,
//       headers: {
//         'Content-Type': 'application/pdf',
//         'Content-Disposition': 'inline; filename="certificate.pdf"'
//       },
//       body: Buffer.from(pdfBytes).toString('base64'),
//       isBase64Encoded: true,
//     };

//   } catch (error: any) {
//     console.error('Error generating certificate:', error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: error.message || 'An internal server error occurred.' }),
//     };
//   }
// };

// export { handler };




// netlify/functions/generate-certificate.ts

import type { Handler, HandlerEvent } from "@netlify/functions";
import { readFileSync } from 'fs';
import { join } from 'path';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { adminDb } from '../../src/lib/firebaseAdmin';
import { UserProfile, CertificateData } from '../../src/types/masterclass';

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Path will be like /.netlify/functions/generate-certificate/userId/certId
    const pathParts = event.path.split('/').filter(p => p);
    const userId = pathParts[pathParts.length - 2];
    const certificateId = pathParts[pathParts.length - 1];

    if (!userId || !certificateId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId or certificateId in URL' }) };
    }

    // 1. Fetch user profile from Firestore
    const userProfileRef = adminDb.collection("user_profiles").doc(userId);
    const userProfileSnap = await userProfileRef.get();

    if (!userProfileSnap.exists) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }
    const userProfile = userProfileSnap.data() as UserProfile;

    // 2. Find the specific certificate data
    const certificateRecord = userProfile.certificates?.find(c => c.id === certificateId);

    if (!certificateRecord) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Certificate not found' }) };
    }

    // 3. Prepare certificate data from the stored record
    const certificateData: CertificateData = {
      certificateId: certificateRecord.id,
      userName: certificateRecord.userName,
      masterclassTitle: certificateRecord.masterclassTitle,
      speakerName: certificateRecord.speakerName,
      issuedDate: new Date(certificateRecord.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      grade: certificateRecord.grade,
      masterclassThumbnailUrl: certificateRecord.masterclassThumbnailUrl,
    };

    // 4. Generate PDF using pdf-lib with professional government-style design
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]); // A4 Landscape
    const { width, height } = page.getSize();

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Load images
    const logoImageBytes = readFileSync(join(process.cwd(), 'public', 'logo_growpro.png'));
    const signatureImageBytes = readFileSync(join(process.cwd(), 'public', 'signature.png'));
    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

    // Define professional color scheme (Black & White with subtle accents)
    const black = rgb(0, 0, 0);
    const darkGray = rgb(0.2, 0.2, 0.2);
    const mediumGray = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.85, 0.85, 0.85);
    const accentGold = rgb(0.72, 0.65, 0.26); // Subtle gold accent for official look

    // --- GOVERNMENT-STYLE WATERMARK PATTERN ---
    // Multiple diagonal watermarks like official documents
    const watermarkText = 'GROWPRO';
    const watermarkFontSize = 80;
    const watermarkColor = rgb(0.95, 0.95, 0.95); // Very light gray
    const watermarkOpacity = 0.15;

    // Create diagonal pattern of watermarks
    const positions = [
      { x: width * 0.15, y: height * 0.75 },
      { x: width * 0.45, y: height * 0.55 },
      { x: width * 0.75, y: height * 0.35 },
      { x: width * 0.30, y: height * 0.25 },
      { x: width * 0.60, y: height * 0.65 },
    ];

    positions.forEach(pos => {
      const textWidth = helveticaBoldFont.widthOfTextAtSize(watermarkText, watermarkFontSize);
      page.drawText(watermarkText, {
        x: pos.x - textWidth / 2,
        y: pos.y,
        font: helveticaBoldFont,
        size: watermarkFontSize,
        color: watermarkColor,
        opacity: watermarkOpacity,
        rotate: degrees(-45),
      });
    });

    // --- DECORATIVE BORDER (Government Document Style) ---
    // Outer border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: black,
      borderWidth: 3,
    });

    // Inner border
    page.drawRectangle({
      x: 40,
      y: 40,
      width: width - 80,
      height: height - 80,
      borderColor: black,
      borderWidth: 1,
    });

    // Corner decorative elements (simple lines for professional look)
    const cornerSize = 15;
    const corners = [
      { x: 40, y: height - 40 }, // Top-left
      { x: width - 40, y: height - 40 }, // Top-right
      { x: 40, y: 40 }, // Bottom-left
      { x: width - 40, y: 40 }, // Bottom-right
    ];

    corners.forEach((corner, index) => {
      if (index === 0 || index === 2) {
        // Left corners - horizontal line
        page.drawLine({
          start: { x: corner.x, y: corner.y },
          end: { x: corner.x + cornerSize, y: corner.y },
          color: accentGold,
          thickness: 2,
        });
      } else {
        // Right corners - horizontal line
        page.drawLine({
          start: { x: corner.x - cornerSize, y: corner.y },
          end: { x: corner.x, y: corner.y },
          color: accentGold,
          thickness: 2,
        });
      }
    });

    // --- HEADER SECTION ---
    // Logo centered at top
    const logoHeight = 50;
    const logoWidth = logoImage.width * (logoHeight / logoImage.height);
    page.drawImage(logoImage, {
      x: width / 2 - logoWidth / 2,
      y: height - 100,
      height: logoHeight,
      width: logoWidth,
    });

    // Organization name under logo
    const orgName = 'GROWPRO LEARNING PLATFORM';
    const orgNameSize = 12;
    const orgNameWidth = helveticaBoldFont.widthOfTextAtSize(orgName, orgNameSize);
    page.drawText(orgName, {
      x: width / 2 - orgNameWidth / 2,
      y: height - 115,
      font: helveticaBoldFont,
      size: orgNameSize,
      color: darkGray,
    });

    // --- CERTIFICATE TITLE ---
    const titleText = 'CERTIFICATE OF COMPLETION';
    const titleFontSize = 32;
    const titleWidth = timesRomanBoldFont.widthOfTextAtSize(titleText, titleFontSize);
    page.drawText(titleText, {
      x: width / 2 - titleWidth / 2,
      y: height - 170,
      font: timesRomanBoldFont,
      size: titleFontSize,
      color: black,
    });

    // Decorative line under title
    page.drawLine({
      start: { x: width / 2 - 150, y: height - 180 },
      end: { x: width / 2 + 150, y: height - 180 },
      color: accentGold,
      thickness: 2,
    });

    // --- CERTIFICATE NUMBER ---
    const certNum = `Certificate No: ${certificateData.certificateId.substring(0, 8).toUpperCase()}`;
    const certNumSize = 10;
    const certNumWidth = helveticaFont.widthOfTextAtSize(certNum, certNumSize);
    page.drawText(certNum, {
      x: width / 2 - certNumWidth / 2,
      y: height - 200,
      font: helveticaFont,
      size: certNumSize,
      color: mediumGray,
    });

    // --- MAIN CONTENT ---
    // "This is to certify that"
    const certifyText = 'This is to certify that';
    const certifyTextSize = 14;
    const certifyTextWidth = timesRomanFont.widthOfTextAtSize(certifyText, certifyTextSize);
    page.drawText(certifyText, {
      x: width / 2 - certifyTextWidth / 2,
      y: height - 240,
      font: timesRomanFont,
      size: certifyTextSize,
      color: darkGray,
    });

    // User Name (Emphasized)
    const userName = certificateData.userName.toUpperCase();
    const userNameFontSize = 28;
    const userNameWidth = timesRomanBoldFont.widthOfTextAtSize(userName, userNameFontSize);
    page.drawText(userName, {
      x: width / 2 - userNameWidth / 2,
      y: height - 280,
      font: timesRomanBoldFont,
      size: userNameFontSize,
      color: black,
    });

    // Underline for name
    page.drawLine({
      start: { x: width / 2 - userNameWidth / 2 - 20, y: height - 285 },
      end: { x: width / 2 + userNameWidth / 2 + 20, y: height - 285 },
      color: black,
      thickness: 1,
    });

    // "has successfully completed"
    const completedText = 'has successfully completed the masterclass';
    const completedTextSize = 14;
    const completedTextWidth = timesRomanFont.widthOfTextAtSize(completedText, completedTextSize);
    page.drawText(completedText, {
      x: width / 2 - completedTextWidth / 2,
      y: height - 320,
      font: timesRomanFont,
      size: completedTextSize,
      color: darkGray,
    });

    // Masterclass Title (in quotes)
    const masterclassTitle = `"${certificateData.masterclassTitle}"`;
    const masterclassTitleSize = 20;
    const masterclassTitleWidth = timesRomanBoldFont.widthOfTextAtSize(masterclassTitle, masterclassTitleSize);
    page.drawText(masterclassTitle, {
      x: width / 2 - masterclassTitleWidth / 2,
      y: height - 355,
      font: timesRomanBoldFont,
      size: masterclassTitleSize,
      color: black,
    });

    // Speaker name
    const speakerText = `conducted by ${certificateData.speakerName}`;
    const speakerTextSize = 13;
    const speakerTextWidth = timesRomanFont.widthOfTextAtSize(speakerText, speakerTextSize);
    page.drawText(speakerText, {
      x: width / 2 - speakerTextWidth / 2,
      y: height - 385,
      font: timesRomanFont,
      size: speakerTextSize,
      color: mediumGray,
    });

    // Grade achieved
    const gradeText = `with a score of ${certificateData.grade.toFixed(0)}%`;
    const gradeTextSize = 12;
    const gradeTextWidth = helveticaBoldFont.widthOfTextAtSize(gradeText, gradeTextSize);
    page.drawText(gradeText, {
      x: width / 2 - gradeTextWidth / 2,
      y: height - 410,
      font: helveticaBoldFont,
      size: gradeTextSize,
      color: darkGray,
    });

    // --- FOOTER SECTION (Three Columns) ---
    const footerY = 120;

    // Left Column: Issue Date
    const dateLabel = 'Date of Issue';
    const dateValue = certificateData.issuedDate;
    const dateX = 150;

    page.drawText(dateLabel, {
      x: dateX - helveticaBoldFont.widthOfTextAtSize(dateLabel, 10) / 2,
      y: footerY + 20,
      font: helveticaBoldFont,
      size: 10,
      color: mediumGray,
    });

    page.drawText(dateValue, {
      x: dateX - helveticaFont.widthOfTextAtSize(dateValue, 11) / 2,
      y: footerY,
      font: helveticaFont,
      size: 11,
      color: black,
    });

    // Underline for date
    page.drawLine({
      start: { x: dateX - 80, y: footerY - 5 },
      end: { x: dateX + 80, y: footerY - 5 },
      color: black,
      thickness: 1,
    });

    // Center Column: Signature
    const signatureX = width / 2;
    const signatureWidth = 80;
    const signatureHeight = signatureImage.height * (signatureWidth / signatureImage.width);

    page.drawImage(signatureImage, {
      x: signatureX - signatureWidth / 2,
      y: footerY + 10,
      width: signatureWidth,
      height: signatureHeight,
    });

    const sigLabel = 'Authorized Signature';
    page.drawText(sigLabel, {
      x: signatureX - helveticaBoldFont.widthOfTextAtSize(sigLabel, 10) / 2,
      y: footerY - 10,
      font: helveticaBoldFont,
      size: 10,
      color: mediumGray,
    });

    // Underline for signature
    page.drawLine({
      start: { x: signatureX - 80, y: footerY - 15 },
      end: { x: signatureX + 80, y: footerY - 15 },
      color: black,
      thickness: 1,
    });

    // Right Column: Verification
    const verifyX = width - 150;
    const verifyLabel = 'Verify Online';
    const verifyUrl = `growpro.in/verify/${certificateData.certificateId.substring(0, 8)}`;

    page.drawText(verifyLabel, {
      x: verifyX - helveticaBoldFont.widthOfTextAtSize(verifyLabel, 10) / 2,
      y: footerY + 20,
      font: helveticaBoldFont,
      size: 10,
      color: mediumGray,
    });

    page.drawText(verifyUrl, {
      x: verifyX - helveticaFont.widthOfTextAtSize(verifyUrl, 9) / 2,
      y: footerY,
      font: helveticaFont,
      size: 9,
      color: black,
    });

    // Underline for verification
    page.drawLine({
      start: { x: verifyX - 80, y: footerY - 5 },
      end: { x: verifyX + 80, y: footerY - 5 },
      color: black,
      thickness: 1,
    });

    // --- AUTHENTICITY SEAL (Bottom Right Corner) ---
    const sealText = 'AUTHENTIC';
    const sealSize = 10;
    const sealX = width - 100;
    const sealY = 60;

    page.drawText(sealText, {
      x: sealX - helveticaBoldFont.widthOfTextAtSize(sealText, sealSize) / 2,
      y: sealY,
      font: helveticaBoldFont,
      size: sealSize,
      color: accentGold,
    });

    // Small circle around "AUTHENTIC"
    const sealRadius = 25;
    // Note: pdf-lib doesn't have a circle method, so we skip this or draw with path

    // Save PDF to buffer
    const pdfBytes = await pdfDoc.save();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="certificate.pdf"',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
      body: Buffer.from(pdfBytes).toString('base64'),
      isBase64Encoded: true,
    };

  } catch (error: any) {
    console.error('Error generating certificate:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'An internal server error occurred.' }),
    };
  }
};

export { handler };