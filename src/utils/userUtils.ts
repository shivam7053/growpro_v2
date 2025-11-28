// src/utils/userUtils.ts
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types/masterclass";

/**
 * Sanitizes a partial transaction for Firestore storage.
 * Converts undefined to null for optional fields.
 * Provides defaults for required fields.
 */
function sanitizeTransaction(tx: Partial<Transaction>): Record<string, any> {
  const now = new Date().toISOString();

  return {
    // Required fields with defaults
    orderId: tx.orderId ?? `txn_${Date.now()}`,
    masterclassId: tx.masterclassId ?? "",
    masterclassTitle: tx.masterclassTitle ?? "Unknown",
    amount: tx.amount ?? 0,
    status: tx.status ?? "pending",
    method: tx.method ?? "razorpay",
    timestamp: tx.timestamp ?? now,

    // Optional fields (undefined -> null)
    paymentId: tx.paymentId ?? null,
    type: tx.type ?? null,
    failureReason: tx.failureReason ?? null,
    errorCode: tx.errorCode ?? null,
    updatedAt: tx.updatedAt ?? null,
  };
}

/**
 * Converts stored transaction (with nulls) back to typed Transaction
 */
function deserializeTransaction(raw: any): Transaction {
  return {
    orderId: raw.orderId ?? `txn_${Date.now()}`,
    paymentId: raw.paymentId ?? undefined,
    masterclassId: raw.masterclassId ?? "",
    masterclassTitle: raw.masterclassTitle ?? "Unknown",
    amount: raw.amount ?? 0,
    status: raw.status ?? "pending",
    method: raw.method ?? "razorpay",
    type: raw.type ?? undefined,
    failureReason: raw.failureReason ?? undefined,
    errorCode: raw.errorCode ?? undefined,
    timestamp: raw.timestamp ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? undefined,
  };
}

/**
 * Handle Firestore errors with retry logic
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;

      // Don't retry on permission or not-found errors
      if (
        err.code === "permission-denied" ||
        err.code === "not-found" ||
        err.code === "unauthenticated"
      ) {
        throw err;
      }

      // Retry on aborted, deadline-exceeded, or unavailable
      if (
        attempt < maxRetries &&
        (err.code === "aborted" ||
          err.code === "deadline-exceeded" ||
          err.code === "unavailable")
      ) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.warn(
          `⚠️ Firestore operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw err;
    }
  }

  throw lastError!;
}

/* -----------------------------------------------------
   ADD TRANSACTION (ATOMIC)
   Uses Firestore transaction to prevent race conditions
----------------------------------------------------- */
export async function addTransactionRecord(
  userId: string,
  transaction: Partial<Transaction>
): Promise<void> {
  if (!userId) {
    throw new Error("userId is required");
  }

  const sanitized = sanitizeTransaction(transaction);

  await retryOperation(async () => {
    const userRef = doc(db, "user_profiles", userId);

    await runTransaction(db, async (firestoreTransaction) => {
      const snap = await firestoreTransaction.get(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const existing: any[] = data.transactions || [];

        // Check for duplicates
        const isDuplicate = existing.some(
          (t: any) => t.orderId === sanitized.orderId
        );

        if (isDuplicate) {
          console.log("ℹ️ Transaction already exists:", sanitized.orderId);
          return; // Exit early, don't update
        }

        // Add to array
        firestoreTransaction.update(userRef, {
          transactions: [...existing, sanitized],
        });

        console.log("✅ Transaction added:", sanitized.orderId);
      } else {
        // Create new user profile
        firestoreTransaction.set(userRef, {
          id: userId,
          transactions: [sanitized],
          created_at: new Date().toISOString(),
        });

        console.log("✅ User profile created with transaction");
      }
    });
  });
}

/* -----------------------------------------------------
   UPDATE TRANSACTION STATUS (ATOMIC)
----------------------------------------------------- */
export async function updateTransactionStatus(
  userId: string,
  orderId: string,
  updates: Partial<Transaction>
): Promise<void> {
  if (!userId || !orderId) {
    throw new Error("userId and orderId are required");
  }

  await retryOperation(async () => {
    const userRef = doc(db, "user_profiles", userId);

    await runTransaction(db, async (firestoreTransaction) => {
      const snap = await firestoreTransaction.get(userRef);

      if (!snap.exists()) {
        throw new Error("User not found");
      }

      const data = snap.data();
      const transactions: any[] = data.transactions || [];

      // Find transaction index
      const txIndex = transactions.findIndex(
        (t: any) => t.orderId === orderId
      );

      if (txIndex === -1) {
        console.warn(`⚠️ Transaction ${orderId} not found for update`);
        return; // Exit early
      }

      // Prevent updating successful transactions to failed
      if (
        transactions[txIndex].status === "success" &&
        updates.status === "failed"
      ) {
        console.warn(
          `⚠️ Attempted to mark successful transaction as failed: ${orderId}`
        );
        return;
      }

      // Sanitize updates (undefined -> null)
      const sanitizedUpdates: Record<string, any> = {};
      Object.keys(updates).forEach((key) => {
        const value = (updates as any)[key];
        sanitizedUpdates[key] = value === undefined ? null : value;
      });

      // Merge updates with existing transaction
      const updatedTransactions = [...transactions];
      updatedTransactions[txIndex] = {
        ...transactions[txIndex],
        ...sanitizedUpdates,
        updatedAt: new Date().toISOString(),
      };

      firestoreTransaction.update(userRef, {
        transactions: updatedTransactions,
      });

      console.log(`✅ Transaction ${orderId} updated to status: ${updates.status}`);
    });
  });
}

/* -----------------------------------------------------
   GET USER TRANSACTIONS
----------------------------------------------------- */
export async function getUserTransactions(
  userId: string
): Promise<Transaction[]> {
  try {
    if (!userId) {
      return [];
    }

    const snap = await getDoc(doc(db, "user_profiles", userId));
    if (!snap.exists()) {
      return [];
    }

    const raw = snap.data().transactions || [];
    const transactions = raw.map(deserializeTransaction);

    // Sort by timestamp (newest first)
    return transactions.sort(
      (a: Transaction, b: Transaction) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (err) {
    console.error("❌ Error fetching transactions:", err);
    return [];
  }
}

/* -----------------------------------------------------
   GET TRANSACTION BY ORDER ID
----------------------------------------------------- */
export async function getTransactionByOrderId(
  userId: string,
  orderId: string
): Promise<Transaction | null> {
  try {
    if (!userId || !orderId) {
      return null;
    }

    const snap = await getDoc(doc(db, "user_profiles", userId));
    if (!snap.exists()) {
      return null;
    }

    const raw = snap.data().transactions || [];
    const found = raw.find((r: any) => r.orderId === orderId);

    return found ? deserializeTransaction(found) : null;
  } catch (err) {
    console.error("❌ Error fetching transaction:", err);
    return null;
  }
}

/* -----------------------------------------------------
   USER PURCHASE SUMMARY
----------------------------------------------------- */
export async function getUserPurchaseSummary(userId: string) {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }

    const snap = await getDoc(doc(db, "user_profiles", userId));

    if (!snap.exists()) {
      return {
        totalSpent: 0,
        transactionCount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        recentTransactions: [],
      };
    }

    const data = snap.data();
    const raw: any[] = data.transactions || [];
    const transactions = raw.map(deserializeTransaction);

    return {
      totalSpent: transactions
        .filter((t) => t.status === "success")
        .reduce((sum, t) => sum + t.amount, 0),

      transactionCount: transactions.length,
      successfulPayments: transactions.filter((t) => t.status === "success")
        .length,
      failedPayments: transactions.filter((t) => t.status === "failed")
        .length,

      recentTransactions: transactions
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 5),
    };
  } catch (err) {
    console.error("❌ Summary error:", err);
    throw err;
  }
}