import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction, UserProfile } from "@/types/masterclass";

/** ✅ Ensure a user document exists in Firestore */
export async function ensureUserDocument(user: any): Promise<void> {
  if (!user?.uid) throw new Error("User not authenticated");

  const userRef = doc(db, "user_profiles", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const userData: UserProfile = {
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

/** ✅ Add purchased class safely */
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
    console.log("✅ Added to user's purchased classes:", classTitle);
  } catch (error: any) {
    if (error.code === "not-found" || error.message.includes("No document")) {
      const userData: UserProfile = {
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

/** ✅ Get user's purchased classes */
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
 * ✅ Add or update a transaction (prevents duplicates)
 * If same `orderId` already exists, only updates instead of adding.
 */
export async function addTransactionRecord(
  userId: string,
  transaction: Transaction
): Promise<void> {
  const userRef = doc(db, "user_profiles", userId);

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentData = userSnap.data();
      const currentTransactions = currentData.transactions || [];

      // ✅ Check if this transaction already exists
      const existingTxn = currentTransactions.find(
        (t: Transaction) => t.orderId === transaction.orderId
      );

      if (existingTxn) {
        console.warn(`⚠️ Transaction ${transaction.orderId} already exists → skipping to avoid overwriting method`);
        // ✅ DON'T call updateTransactionStatus - it might change the method
        // Just log and return
        return;
      }

      // ✅ Otherwise, add it
      await updateDoc(userRef, {
        transactions: [...currentTransactions, transaction],
      });

      console.log(`✅ Transaction recorded (new): ${transaction.status} with method: ${transaction.method}`);
    } else {
      // ✅ Create user doc with the first transaction
      const userData: UserProfile = {
        id: userId,
        email: "",
        full_name: "",
        purchasedClasses: [],
        transactions: [transaction],
        created_at: new Date().toISOString(),
      };
      await setDoc(userRef, userData);
      console.log("✅ Created new user doc with first transaction");
    }
  } catch (error: any) {
    console.error("❌ addTransactionRecord error:", error);
    throw error;
  }
}

/**
 * ✅ Update transaction status (e.g., pending → success)
 * CRITICAL: Preserves the original 'method' field
 */
export async function updateTransactionStatus(
  userId: string,
  orderId: string,
  updates: Partial<Transaction>
): Promise<void> {
  try {
    const userRef = doc(db, "user_profiles", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error("❌ User not found:", userId);
      return;
    }

    const data = userSnap.data();
    const transactions = data.transactions || [];

    const updatedTransactions = transactions.map((txn: Transaction) => {
      if (txn.orderId === orderId) {
        // ✅ CRITICAL: Only update provided fields, preserve everything else (especially 'method')
        return { 
          ...txn,           // Keep all existing fields
          ...updates,       // Apply updates
          method: txn.method,  // ✅ FORCE preserve original method
          timestamp: new Date().toISOString() 
        };
      }
      return txn;
    });

    await updateDoc(userRef, { transactions: updatedTransactions });
    console.log(`✅ Transaction ${orderId} updated → ${updates.status || 'updated'} (method preserved: ${transactions.find((t: Transaction) => t.orderId === orderId)?.method})`);
  } catch (error) {
    console.error("❌ Error updating transaction status:", error);
    throw error;
  }
}

/** ✅ Get all transactions of a user */
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  try {
    const userRef = doc(db, "user_profiles", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return [];
    return userSnap.data().transactions || [];
  } catch (error) {
    console.error("❌ Error fetching user transactions:", error);
    return [];
  }
}