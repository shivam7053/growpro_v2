import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Reusable Transaction type
export interface Transaction {
  orderId: string;
  paymentId: string;
  masterclassId: string;
  amount: number;
  timestamp: string;
}

export interface UserDocument {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  linkedin?: string;
  purchasedClasses: string[];
  transactions?: Transaction[];
  created_at: string;
}

/**
 * ✅ Ensures user document exists in Firestore (creates if missing)
 */
export async function ensureUserDocument(user: any): Promise<void> {
  if (!user?.uid) throw new Error("User not authenticated");

  const userRef = doc(db, "user_profiles", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const userData: UserDocument = {
      id: user.uid,
      email: user.email || "",
      full_name: user.displayName || "",
      phone: user.phoneNumber || "",
      avatar_url: user.photoURL || "",
      purchasedClasses: [],
      transactions: [],
      created_at: new Date().toISOString(),
    };

    await setDoc(userRef, userData);
    console.log("✅ User document created:", user.uid);
  }
}

/**
 * ✅ Safely adds a purchased class to user's profile
 * Creates the user document if missing
 */
export async function addPurchasedClass(
  userId: string,
  classTitle: string,
  userEmail?: string,
  userName?: string
): Promise<void> {
  const userRef = doc(db, "user_profiles", userId);

  try {
    await updateDoc(userRef, {
      purchasedClasses: arrayUnion(classTitle),
    });
  } catch (error: any) {
    if (error.code === "not-found" || error.message.includes("No document")) {
      const userData: UserDocument = {
        id: userId,
        email: userEmail || "",
        full_name: userName || "",
        purchasedClasses: [classTitle],
        transactions: [],
        created_at: new Date().toISOString(),
      };

      await setDoc(userRef, userData);
      console.log("✅ Created new user doc with purchased class");
    } else {
      console.error("❌ addPurchasedClass error:", error);
      throw error;
    }
  }
}

/**
 * ✅ Fetch user's purchased classes safely
 */
export async function getUserPurchasedClasses(userId: string): Promise<string[]> {
  try {
    const userRef = doc(db, "user_profiles", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.purchasedClasses || [];
    }
    return [];
  } catch (error) {
    console.error("❌ Error fetching purchased classes:", error);
    return [];
  }
}

/**
 * ✅ Adds a transaction record to user's Firestore doc
 */
export async function addTransactionRecord(
  userId: string,
  transaction: Transaction
): Promise<void> {
  const userRef = doc(db, "user_profiles", userId);

  try {
    await updateDoc(userRef, {
      transactions: arrayUnion(transaction),
    });
  } catch (error: any) {
    if (error.message.includes("No document to update") || error.code === "not-found") {
      await setDoc(
        userRef,
        {
          id: userId,
          email: "",
          full_name: "",
          purchasedClasses: [],
          transactions: [transaction],
          created_at: new Date().toISOString(),
        },
        { merge: true } // ✅ Merges instead of overwriting
      );
      console.log("✅ Created new user doc with first transaction");
    } else {
      console.error("❌ addTransactionRecord error:", error);
      throw error;
    }
  }
}
