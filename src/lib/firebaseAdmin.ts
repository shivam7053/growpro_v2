//lib/firebaseAdmin

import * as admin from "firebase-admin";

// ✅ FIX: Use a server-side specific env var for the bucket and validate it.
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
if (!storageBucket) {
  console.error("🔥 Firebase Admin Error: FIREBASE_STORAGE_BUCKET environment variable is not set.");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
    storageBucket: storageBucket,
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
