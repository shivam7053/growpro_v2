
// src/utils/userUtils.ts
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types/masterclass";

/**
 * OPTION B: Full-mode sanitizer
 * For storing in Firestore we must store every Transaction field (if missing -> null)
 * This function builds a plain object (Record<string, any>) suitable for writing.
 * NOTE: We return a plain object (not typed Transaction) to allow null values
 * for optional fields while keeping TS checks for in-memory Transaction usage.
 */
function buildFullTxForStorage(tx: Partial<Transaction>): Record<string, any> {
  // List all Transaction keys in exact shape (order matters not important)
  const keys = [
    "orderId",
    "paymentId",
    "masterclassId",
    "videoId",
    "masterclassTitle",
    "videoTitle",
    "amount",
    "status",
    "method",
    "type",
    "failureReason",
    "errorCode",
    "timestamp",
    "updatedAt",
  ] as const;

  const out: Record<string, any> = {};

  // Ensure default values for required fields when missing
  out.orderId = tx.orderId ?? `txn_${Date.now()}`;
  out.masterclassId = tx.masterclassId ?? "";
  out.masterclassTitle = tx.masterclassTitle ?? "Unknown";
  out.amount = tx.amount ?? 0;
  out.status = tx.status ?? "pending";
  out.method = tx.method ?? "razorpay";
  out.timestamp = tx.timestamp ?? new Date().toISOString();
  out.updatedAt = tx.updatedAt ?? null;

  // Optional fields: map undefined -> null or keep provided value
  out.paymentId = tx.paymentId === undefined ? null : tx.paymentId;
  out.videoId = tx.videoId === undefined ? null : tx.videoId;
  out.videoTitle = tx.videoTitle === undefined ? null : tx.videoTitle;
  out.type = tx.type === undefined ? null : tx.type;
  out.failureReason = tx.failureReason === undefined ? null : tx.failureReason;
  out.errorCode = tx.errorCode === undefined ? null : tx.errorCode;

  return out;
}

/**
 * Helper to build an in-memory Transaction object (typed) from partial input.
 * This keeps internal logic typed, while storage uses buildFullTxForStorage().
 */
function buildInMemoryTransaction(tx: Partial<Transaction>): Transaction {
  return {
    orderId: tx.orderId ?? `txn_${Date.now()}`,
    paymentId: tx.paymentId,
    masterclassId: tx.masterclassId ?? "",
    videoId: tx.videoId,
    masterclassTitle: tx.masterclassTitle ?? "Unknown",
    videoTitle: tx.videoTitle,
    amount: tx.amount ?? 0,
    status: tx.status ?? "pending",
    method: tx.method ?? "razorpay",
    type: tx.type,
    failureReason: tx.failureReason,
    errorCode: tx.errorCode,
    timestamp: tx.timestamp ?? new Date().toISOString(),
    updatedAt: tx.updatedAt,
  };
}

/* -----------------------------------------------------
   ADD TRANSACTION
   - Stores a full object (all keys present; missing values -> null)
   - Prevents duplicates by orderId
----------------------------------------------------- */
export async function addTransactionRecord(
  userId: string,
  transaction: Partial<Transaction>
) {
  try {
    const userRef = doc(db, "user_profiles", userId);
    const snap = await getDoc(userRef);

    // Build typed in-memory txn for logic & duplicate checks
    const inMemTx = buildInMemoryTransaction(transaction);

    // Build storage-friendly txn object (nulls for missing values)
    const storageTx = buildFullTxForStorage(inMemTx);

    if (snap.exists()) {
      const data = snap.data();
      const existing: any[] = data.transactions || [];

      const isDuplicate = existing.some((t: any) => t.orderId === storageTx.orderId);

      if (!isDuplicate) {
        await updateDoc(userRef, {
          transactions: arrayUnion(storageTx),
        });
        console.log("✅ Transaction added:", storageTx.orderId);
      } else {
        console.log("ℹ️ Transaction already exists:", storageTx.orderId);
      }
    } else {
      // Create user doc with full transaction saved
      await setDoc(userRef, {
        id: userId,
        transactions: [storageTx],
        purchasedClasses: [],
        purchasedVideos: [],
        created_at: new Date().toISOString(),
      });
      console.log("✅ User profile created with transaction");
    }
  } catch (err) {
    console.error("❌ Error adding transaction:", err);
    throw err;
  }
}

/* -----------------------------------------------------
   UPDATE TRANSACTION STATUS
   - updates is Partial<Transaction>
   - we convert any missing optional fields -> null for stored object keys,
     and then merge into existing transaction objects (in-memory),
     and then update the full transactions array (keeping other tx fields intact)
----------------------------------------------------- */
export async function updateTransactionStatus(
  userId: string,
  orderId: string,
  updates: Partial<Transaction>
) {
  try {
    const ref = doc(db, "user_profiles", userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) throw new Error("User not found");

    const data = snap.data();
    const transactions: any[] = data.transactions || [];

    // Build storage-friendly updates (undefined -> null)
    const storageUpdates = buildFullTxForStorage({
      // include only provided update keys; buildFullTxForStorage will set defaults for required fields,
      // but we want to avoid overwriting required fields unintentionally. So build a minimal object.
      ... (updates as Partial<Transaction>),
      // do not overwrite orderId/masterclassId/masterclassTitle/amount/status/method/timestamp unless provided
    });

    // Instead of blindly using buildFullTxForStorage (which supplies defaults),
    // create a sanitized updates object where we map provided keys: undefined->null, but we don't inject defaults.
    const sanitizedUpdates: Record<string, any> = {};
    const updateKeys = Object.keys(updates) as (keyof Transaction)[];
    updateKeys.forEach((k) => {
      const v = (updates as any)[k];
      sanitizedUpdates[k as string] = v === undefined ? null : v;
    });

    // Apply updates to the matching transaction(s)
    const updatedTxns = transactions.map((t: any) => {
      if (t.orderId === orderId) {
        // keep existing properties, overwrite with sanitizedUpdates, set updatedAt
        return {
          ...t,
          ...sanitizedUpdates,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    await updateDoc(ref, { transactions: updatedTxns });
    console.log(`✅ Transaction ${orderId} updated`);
  } catch (err) {
    console.error("❌ Error updating transaction:", err);
    throw err;
  }
}

/* -----------------------------------------------------
   ADD PURCHASED CLASS
   (Guarded; simple string arrayUnion)
----------------------------------------------------- */
export async function addPurchasedClass(
  userId: string,
  masterclassTitle: string | null
) {
  try {
    if (!masterclassTitle) {
      console.log("⚠️ addPurchasedClass called with empty title — skipping");
      return;
    }

    const ref = doc(db, "user_profiles", userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, {
        purchasedClasses: arrayUnion(masterclassTitle),
      });
    } else {
      await setDoc(ref, {
        id: userId,
        purchasedClasses: [masterclassTitle],
        purchasedVideos: [],
        transactions: [],
        created_at: new Date().toISOString(),
      });
    }

    console.log("✅ Masterclass added to purchased list");
  } catch (err) {
    console.error("❌ Error adding purchased class:", err);
    throw err;
  }
}

/* -----------------------------------------------------
   ADD PURCHASED VIDEO
   (Guarded; simple string arrayUnion)
----------------------------------------------------- */
export async function addPurchasedVideo(userId: string, videoId: string | null) {
  try {
    if (!videoId) {
      console.log("⚠️ addPurchasedVideo called with empty videoId — skipping");
      return;
    }

    const ref = doc(db, "user_profiles", userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, {
        purchasedVideos: arrayUnion(videoId),
      });
    } else {
      await setDoc(ref, {
        id: userId,
        purchasedVideos: [videoId],
        purchasedClasses: [],
        transactions: [],
        created_at: new Date().toISOString(),
      });
    }

    console.log("✅ Video added to purchased list");
  } catch (err) {
    console.error("❌ Error adding purchased video:", err);
    throw err;
  }
}

/* -----------------------------------------------------
   HAS VIDEO ACCESS
----------------------------------------------------- */
export async function hasVideoAccess(
  userId: string,
  masterclassId: string,
  videoId: string
): Promise<boolean> {
  try {
    const mcRef = doc(db, "MasterClasses", masterclassId);
    const mcSnap = await getDoc(mcRef);

    if (mcSnap.exists()) {
      const joinedUsers: string[] = mcSnap.data().joined_users || [];
      if (joinedUsers.includes(userId)) return true;
    }

    const userSnap = await getDoc(doc(db, "user_profiles", userId));
    if (userSnap.exists()) {
      const purchasedVideos: string[] = userSnap.data().purchasedVideos || [];
      return purchasedVideos.includes(videoId);
    }

    return false;
  } catch (err) {
    console.error("❌ Error checking access:", err);
    return false;
  }
}

/* -----------------------------------------------------
   GET USER TRANSACTIONS
   - returns typed Transaction[] built from stored docs
   - converts stored (possibly null) fields into typed Transaction
----------------------------------------------------- */
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  try {
    const snap = await getDoc(doc(db, "user_profiles", userId));
    if (!snap.exists()) return [];

    const raw = snap.data().transactions || [];
    // Map raw stored transactions (may contain nulls) to typed Transaction objects
    const mapped: Transaction[] = raw.map((r: any) => {
      const tx: Transaction = {
        orderId: r.orderId,
        paymentId: r.paymentId ?? undefined,
        masterclassId: r.masterclassId ?? "",
        videoId: r.videoId ?? undefined,
        masterclassTitle: r.masterclassTitle ?? "Unknown",
        videoTitle: r.videoTitle ?? undefined,
        amount: r.amount ?? 0,
        status: r.status ?? "pending",
        method: r.method ?? "razorpay",
        type: r.type ?? undefined,
        failureReason: r.failureReason ?? undefined,
        errorCode: r.errorCode ?? undefined,
        timestamp: r.timestamp ?? new Date().toISOString(),
        updatedAt: r.updatedAt ?? undefined,
      };
      return tx;
    });

    // Sort newest first
    return mapped.sort(
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
    const snap = await getDoc(doc(db, "user_profiles", userId));
    if (!snap.exists()) return null;

    const raw = snap.data().transactions || [];
    const found = raw.find((r: any) => r.orderId === orderId);
    if (!found) return null;

    const tx: Transaction = {
      orderId: found.orderId,
      paymentId: found.paymentId ?? undefined,
      masterclassId: found.masterclassId ?? "",
      videoId: found.videoId ?? undefined,
      masterclassTitle: found.masterclassTitle ?? "Unknown",
      videoTitle: found.videoTitle ?? undefined,
      amount: found.amount ?? 0,
      status: found.status ?? "pending",
      method: found.method ?? "razorpay",
      type: found.type ?? undefined,
      failureReason: found.failureReason ?? undefined,
      errorCode: found.errorCode ?? undefined,
      timestamp: found.timestamp ?? new Date().toISOString(),
      updatedAt: found.updatedAt ?? undefined,
    };

    return tx;
  } catch (err) {
    console.error("❌ Error fetching transaction:", err);
    return null;
  }
}

/* -----------------------------------------------------
   USER PURCHASE SUMMARY
   - typed reducers
----------------------------------------------------- */
export async function getUserPurchaseSummary(userId: string) {
  try {
    const snap = await getDoc(doc(db, "user_profiles", userId));
    if (!snap.exists()) {
      return {
        totalSpent: 0,
        purchasedClasses: [],
        purchasedVideos: [],
        transactionCount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        recentTransactions: [],
      };
    }

    const data = snap.data();
    const raw: any[] = data.transactions || [];

    // Map to typed transactions
    const tx: Transaction[] = raw.map((r: any) => ({
      orderId: r.orderId,
      paymentId: r.paymentId ?? undefined,
      masterclassId: r.masterclassId ?? "",
      videoId: r.videoId ?? undefined,
      masterclassTitle: r.masterclassTitle ?? "Unknown",
      videoTitle: r.videoTitle ?? undefined,
      amount: r.amount ?? 0,
      status: r.status ?? "pending",
      method: r.method ?? "razorpay",
      type: r.type ?? undefined,
      failureReason: r.failureReason ?? undefined,
      errorCode: r.errorCode ?? undefined,
      timestamp: r.timestamp ?? new Date().toISOString(),
      updatedAt: r.updatedAt ?? undefined,
    }));

    return {
      totalSpent: tx
        .filter((t: Transaction) => t.status === "success")
        .reduce((sum: number, t: Transaction) => sum + (t.amount ?? 0), 0),

      purchasedClasses: data.purchasedClasses || [],
      purchasedVideos: data.purchasedVideos || [],

      transactionCount: tx.length,
      successfulPayments: tx.filter((t: Transaction) => t.status === "success").length,
      failedPayments: tx.filter((t: Transaction) => t.status === "failed").length,

      recentTransactions: tx.slice(0, 5),
    };
  } catch (err) {
    console.error("❌ Summary error:", err);
    throw err;
  }
}
