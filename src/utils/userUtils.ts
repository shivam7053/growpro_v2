// import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Transaction, UserProfile } from "@/types/masterclass";

// /** ✅ Ensure a user document exists in Firestore */
// export async function ensureUserDocument(user: any): Promise<void> {
//   if (!user?.uid) throw new Error("User not authenticated");

//   const userRef = doc(db, "user_profiles", user.uid);
//   const userSnap = await getDoc(userRef);

//   if (!userSnap.exists()) {
//     const userData: UserProfile = {
//       id: user.uid,
//       email: user.email || "",
//       full_name: user.displayName || "",
//       phone: user.phoneNumber || "",
//       avatar_url: user.photoURL || "",
//       purchasedClasses: [],
//       transactions: [],
//       created_at: new Date().toISOString(),
//     };

//     await setDoc(userRef, userData);
//     console.log("✅ User document created:", user.uid);
//   }
// }

// /** ✅ Add purchased class safely */
// export async function addPurchasedClass(
//   userId: string,
//   classTitle: string,
//   userEmail?: string,
//   userName?: string
// ): Promise<void> {
//   const userRef = doc(db, "user_profiles", userId);

//   try {
//     await updateDoc(userRef, {
//       purchasedClasses: arrayUnion(classTitle),
//     });
//     console.log("✅ Added to user's purchased classes:", classTitle);
//   } catch (error: any) {
//     if (error.code === "not-found" || error.message.includes("No document")) {
//       const userData: UserProfile = {
//         id: userId,
//         email: userEmail || "",
//         full_name: userName || "",
//         purchasedClasses: [classTitle],
//         transactions: [],
//         created_at: new Date().toISOString(),
//       };

//       await setDoc(userRef, userData);
//       console.log("✅ Created new user doc with purchased class");
//     } else {
//       console.error("❌ addPurchasedClass error:", error);
//       throw error;
//     }
//   }
// }

// /** ✅ Get user's purchased classes */
// export async function getUserPurchasedClasses(userId: string): Promise<string[]> {
//   try {
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);
//     if (userSnap.exists()) {
//       const data = userSnap.data();
//       return data.purchasedClasses || [];
//     }
//     return [];
//   } catch (error) {
//     console.error("❌ Error fetching purchased classes:", error);
//     return [];
//   }
// }

// /**
//  * ✅ Add or update a transaction (prevents duplicates)
//  * If same `orderId` already exists, only updates instead of adding.
//  */
// export async function addTransactionRecord(
//   userId: string,
//   transaction: Transaction
// ): Promise<void> {
//   const userRef = doc(db, "user_profiles", userId);

//   try {
//     const userSnap = await getDoc(userRef);

//     if (userSnap.exists()) {
//       const currentData = userSnap.data();
//       const currentTransactions = currentData.transactions || [];

//       // ✅ Check if this transaction already exists
//       const existingTxn = currentTransactions.find(
//         (t: Transaction) => t.orderId === transaction.orderId
//       );

//       if (existingTxn) {
//         console.warn(`⚠️ Transaction ${transaction.orderId} already exists → skipping to avoid overwriting method`);
//         // ✅ DON'T call updateTransactionStatus - it might change the method
//         // Just log and return
//         return;
//       }

//       // ✅ Otherwise, add it
//       await updateDoc(userRef, {
//         transactions: [...currentTransactions, transaction],
//       });

//       console.log(`✅ Transaction recorded (new): ${transaction.status} with method: ${transaction.method}`);
//     } else {
//       // ✅ Create user doc with the first transaction
//       const userData: UserProfile = {
//         id: userId,
//         email: "",
//         full_name: "",
//         purchasedClasses: [],
//         transactions: [transaction],
//         created_at: new Date().toISOString(),
//       };
//       await setDoc(userRef, userData);
//       console.log("✅ Created new user doc with first transaction");
//     }
//   } catch (error: any) {
//     console.error("❌ addTransactionRecord error:", error);
//     throw error;
//   }
// }

// /**
//  * ✅ Update transaction status (e.g., pending → success)
//  * CRITICAL: Preserves the original 'method' field
//  */
// export async function updateTransactionStatus(
//   userId: string,
//   orderId: string,
//   updates: Partial<Transaction>
// ): Promise<void> {
//   try {
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);

//     if (!userSnap.exists()) {
//       console.error("❌ User not found:", userId);
//       return;
//     }

//     const data = userSnap.data();
//     const transactions = data.transactions || [];

//     const updatedTransactions = transactions.map((txn: Transaction) => {
//       if (txn.orderId === orderId) {
//         // ✅ CRITICAL: Only update provided fields, preserve everything else (especially 'method')
//         return { 
//           ...txn,           // Keep all existing fields
//           ...updates,       // Apply updates
//           method: txn.method,  // ✅ FORCE preserve original method
//           timestamp: new Date().toISOString() 
//         };
//       }
//       return txn;
//     });

//     await updateDoc(userRef, { transactions: updatedTransactions });
//     console.log(`✅ Transaction ${orderId} updated → ${updates.status || 'updated'} (method preserved: ${transactions.find((t: Transaction) => t.orderId === orderId)?.method})`);
//   } catch (error) {
//     console.error("❌ Error updating transaction status:", error);
//     throw error;
//   }
// }

// /** ✅ Get all transactions of a user */
// export async function getUserTransactions(userId: string): Promise<Transaction[]> {
//   try {
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);

//     if (!userSnap.exists()) return [];
//     return userSnap.data().transactions || [];
//   } catch (error) {
//     console.error("❌ Error fetching user transactions:", error);
//     return [];
//   }
// }

// import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Transaction, UserProfile } from "@/types/masterclass";

// /** ============================================================
//  *  ✅ Ensure user document exists based on NEW UserProfile model
//  * ============================================================ */
// export async function ensureUserDocument(user: any): Promise<void> {
//   if (!user?.uid) throw new Error("User not authenticated");

//   const userRef = doc(db, "user_profiles", user.uid);
//   const userSnap = await getDoc(userRef);

//   if (!userSnap.exists()) {
//     const userData: UserProfile = {
//       id: user.uid,
//       email: user.email || "",
//       full_name: user.displayName || "",
//       phone: user.phoneNumber || "",
//       avatar_url: user.photoURL || "",
//       bio: "",
//       linkedin: "",
//       purchasedClasses: [],
//       purchasedVideos: [],
//       transactions: [],
//       selectedCheckpoints: [],
//       created_at: new Date().toISOString(),
//     };

//     await setDoc(userRef, userData);
//     console.log("✅ User document created:", user.uid);
//   }
// }

// /** ============================================================
//  *  ✅ Add purchased class
//  * ============================================================ */
// export async function addPurchasedClass(
//   userId: string,
//   classId: string,
//   userEmail?: string,
//   userName?: string
// ): Promise<void> {
//   const userRef = doc(db, "user_profiles", userId);

//   try {
//     await updateDoc(userRef, {
//       purchasedClasses: arrayUnion(classId),
//     });
//     console.log("✅ Added purchased class:", classId);
//   } catch (error: any) {
//     if (error.code === "not-found") {
//       const newUser: UserProfile = {
//         id: userId,
//         email: userEmail || "",
//         full_name: userName || "",
//         purchasedClasses: [classId],
//         purchasedVideos: [],
//         transactions: [],
//         selectedCheckpoints: [],
//         created_at: new Date().toISOString(),
//       };
//       await setDoc(userRef, newUser);
//       console.log("✅ Created new user doc with purchased class");
//     } else {
//       console.error("❌ addPurchasedClass error:", error);
//     }
//   }
// }

// /** ============================================================
//  *  ✅ Add purchased video
//  * ============================================================ */
// export async function addPurchasedVideo(
//   userId: string,
//   videoId: string
// ): Promise<void> {
//   const userRef = doc(db, "user_profiles", userId);

//   try {
//     await updateDoc(userRef, {
//       purchasedVideos: arrayUnion(videoId),
//     });

//     console.log("🎬 Added purchased video:", videoId);
//   } catch (error: any) {
//     console.error("❌ Error adding purchased video:", error);
//   }
// }

// /** ============================================================
//  *  ✅ Get purchased classes
//  * ============================================================ */
// export async function getUserPurchasedClasses(
//   userId: string
// ): Promise<string[]> {
//   try {
//     const snap = await getDoc(doc(db, "user_profiles", userId));
//     return snap.exists() ? snap.data().purchasedClasses || [] : [];
//   } catch (error) {
//     console.error("❌ Error fetching purchased classes:", error);
//     return [];
//   }
// }

// /** ============================================================
//  *  ✅ Add Transaction (Prevents Duplicates)
//  * ============================================================ */
// export async function addTransactionRecord(
//   userId: string,
//   transaction: Transaction
// ): Promise<void> {
//   const userRef = doc(db, "user_profiles", userId);
//   const snap = await getDoc(userRef);

//   try {
//     if (snap.exists()) {
//       const data = snap.data();
//       const transactions: Transaction[] = data.transactions || [];

//       const already = transactions.find(
//         (t) => t.orderId === transaction.orderId
//       );

//       if (already) {
//         console.warn("⚠️ Transaction already exists:", transaction.orderId);
//         return;
//       }

//       await updateDoc(userRef, {
//         transactions: [...transactions, transaction],
//       });

//       console.log("✅ Stored new transaction");

//     } else {
//       // Create fresh user doc structure
//       const newUser: UserProfile = {
//         id: userId,
//         email: "",
//         full_name: "",
//         purchasedClasses: [],
//         purchasedVideos: [],
//         selectedCheckpoints: [],
//         transactions: [transaction],
//         created_at: new Date().toISOString(),
//       };

//       await setDoc(userRef, newUser);
//       console.log("✅ Created user doc with 1st transaction");
//     }
//   } catch (error) {
//     console.error("❌ addTransactionRecord error:", error);
//   }
// }

// /** ============================================================
//  *  ✅ Update transaction status (method preserved)
//  * ============================================================ */
// export async function updateTransactionStatus(
//   userId: string,
//   orderId: string,
//   updates: Partial<Transaction>
// ): Promise<void> {
//   const userRef = doc(db, "user_profiles", userId);
//   const snap = await getDoc(userRef);

//   if (!snap.exists()) return;

//   const data = snap.data();
//   const updated = data.transactions.map((txn: Transaction) =>
//     txn.orderId === orderId
//       ? {
//           ...txn,
//           ...updates,
//           method: txn.method, // preserve
//           timestamp: new Date().toISOString(),
//         }
//       : txn
//   );

//   await updateDoc(userRef, { transactions: updated });
//   console.log("🔄 Transaction updated:", orderId);
// }

// /** ============================================================
//  *  ✅ Get all transactions
//  * ============================================================ */
// export async function getUserTransactions(
//   userId: string
// ): Promise<Transaction[]> {
//   try {
//     const snap = await getDoc(doc(db, "user_profiles", userId));
//     return snap.exists() ? snap.data().transactions || [] : [];
//   } catch (error) {
//     console.error("❌ Error fetching transactions:", error);
//     return [];
//   }
// }

// // utils/userUtils.ts
// import { doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Transaction } from "@/types/masterclass";

// /**
//  * ✅ UPDATED: Add transaction record with new fields
//  */
// export async function addTransactionRecord(
//   userId: string,
//   transaction: Partial<Transaction>
// ) {
//   try {
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);

//     const newTransaction: Transaction = {
//       orderId: transaction.orderId || `txn_${Date.now()}`,
//       paymentId: transaction.paymentId,
//       masterclassId: transaction.masterclassId || "",
//       videoId: transaction.videoId,
//       masterclassTitle: transaction.masterclassTitle || "Unknown",
//       videoTitle: transaction.videoTitle,
//       amount: transaction.amount || 0,
//       status: transaction.status || "pending",
//       method: transaction.method || "razorpay",
//       type: transaction.type, // ✅ NEW: Transaction type
//       failureReason: transaction.failureReason,
//       timestamp: transaction.timestamp || new Date().toISOString(),
//     };

//     if (userSnap.exists()) {
//       const currentTransactions = userSnap.data().transactions || [];
      
//       // ✅ Check for duplicate to prevent double recording
//       const duplicate = currentTransactions.find(
//         (txn: Transaction) => txn.orderId === newTransaction.orderId
//       );
      
//       if (!duplicate) {
//         await updateDoc(userRef, {
//           transactions: arrayUnion(newTransaction),
//         });
//         console.log("✅ Transaction added:", newTransaction.orderId);
//       } else {
//         console.log("ℹ️ Transaction already exists:", newTransaction.orderId);
//       }
//     } else {
//       // Create user profile if doesn't exist
//       await setDoc(userRef, {
//         id: userId,
//         transactions: [newTransaction],
//         purchasedClasses: [],
//         purchasedVideos: [],
//         created_at: new Date().toISOString(),
//       });
//       console.log("✅ User profile created with transaction");
//     }
//   } catch (error) {
//     console.error("❌ Error adding transaction:", error);
//     throw error;
//   }
// }

// /**
//  * ✅ UPDATED: Update transaction status with more details
//  */
// export async function updateTransactionStatus(
//   userId: string,
//   orderId: string,
//   updates: Partial<Transaction>
// ) {
//   try {
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);

//     if (!userSnap.exists()) {
//       throw new Error("User not found");
//     }

//     const userData = userSnap.data();
//     const transactions = userData.transactions || [];

//     const updatedTransactions = transactions.map((txn: Transaction) => {
//       if (txn.orderId === orderId) {
//         return {
//           ...txn,
//           ...updates,
//           updatedAt: new Date().toISOString(),
//         };
//       }
//       return txn;
//     });

//     await updateDoc(userRef, { transactions: updatedTransactions });
//     console.log(`✅ Transaction ${orderId} updated`);
//   } catch (error) {
//     console.error("❌ Error updating transaction:", error);
//     throw error;
//   }
// }

// /**
//  * Add masterclass to user's purchased list
//  */
// export async function addPurchasedClass(userId: string, masterclassTitle: string) {
//   try {
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);

//     if (userSnap.exists()) {
//       await updateDoc(userRef, {
//         purchasedClasses: arrayUnion(masterclassTitle),
//       });
//     } else {
//       await setDoc(userRef, {
//         id: userId,
//         purchasedClasses: [masterclassTitle],
//         transactions: [],
//         purchasedVideos: [],
//         created_at: new Date().toISOString(),
//       });
//     }
//     console.log("✅ Masterclass added to purchased list");
//   } catch (error) {
//     console.error("❌ Error adding purchased class:", error);
//     throw error;
//   }
// }

// /**
//  * ✅ NEW: Add individual video to user's purchased videos
//  */
// export async function addPurchasedVideo(userId: string, videoId: string) {
//   try {
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);

//     if (userSnap.exists()) {
//       await updateDoc(userRef, {
//         purchasedVideos: arrayUnion(videoId),
//       });
//     } else {
//       await setDoc(userRef, {
//         id: userId,
//         purchasedVideos: [videoId],
//         purchasedClasses: [],
//         transactions: [],
//         created_at: new Date().toISOString(),
//       });
//     }
//     console.log("✅ Video added to purchased list");
//   } catch (error) {
//     console.error("❌ Error adding purchased video:", error);
//     throw error;
//   }
// }

// /**
//  * ✅ NEW: Check if user has access to specific video
//  */
// export async function hasVideoAccess(
//   userId: string,
//   masterclassId: string,
//   videoId: string
// ): Promise<boolean> {
//   try {
//     // Check if user has full masterclass access
//     const masterclassRef = doc(db, "MasterClasses", masterclassId);
//     const masterclassSnap = await getDoc(masterclassRef);
    
//     if (masterclassSnap.exists()) {
//       const joinedUsers = masterclassSnap.data().joined_users || [];
//       if (joinedUsers.includes(userId)) {
//         return true; // Full access
//       }
//     }

//     // Check if user purchased individual video
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);
    
//     if (userSnap.exists()) {
//       const purchasedVideos = userSnap.data().purchasedVideos || [];
//       return purchasedVideos.includes(videoId);
//     }

//     return false;
//   } catch (error) {
//     console.error("❌ Error checking video access:", error);
//     return false;
//   }
// }

// /**
//  * ✅ NEW: Get user's transaction history
//  */
// export async function getUserTransactions(userId: string): Promise<Transaction[]> {
//   try {
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);

//     if (userSnap.exists()) {
//       const transactions = userSnap.data().transactions || [];
//       // Sort by timestamp (newest first)
//       return transactions.sort((a: Transaction, b: Transaction) => 
//         new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//       );
//     }

//     return [];
//   } catch (error) {
//     console.error("❌ Error fetching transactions:", error);
//     return [];
//   }
// }

// /**
//  * ✅ NEW: Get transaction by order ID
//  */
// export async function getTransactionByOrderId(
//   userId: string,
//   orderId: string
// ): Promise<Transaction | null> {
//   try {
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);

//     if (userSnap.exists()) {
//       const transactions = userSnap.data().transactions || [];
//       return transactions.find((txn: Transaction) => txn.orderId === orderId) || null;
//     }

//     return null;
//   } catch (error) {
//     console.error("❌ Error fetching transaction:", error);
//     return null;
//   }
// }

// /**
//  * ✅ NEW: Check if user is registered for upcoming masterclass
//  */
// export async function isUserRegistered(
//   userId: string,
//   masterclassId: string
// ): Promise<boolean> {
//   try {
//     const masterclassRef = doc(db, "MasterClasses", masterclassId);
//     const masterclassSnap = await getDoc(masterclassRef);

//     if (masterclassSnap.exists()) {
//       const joinedUsers = masterclassSnap.data().joined_users || [];
//       return joinedUsers.includes(userId);
//     }

//     return false;
//   } catch (error) {
//     console.error("❌ Error checking registration:", error);
//     return false;
//   }
// }

// /**
//  * ✅ NEW: Get user's purchased content summary
//  */
// export async function getUserPurchaseSummary(userId: string) {
//   try {
//     const userRef = doc(db, "user_profiles", userId);
//     const userSnap = await getDoc(userRef);

//     if (!userSnap.exists()) {
//       return {
//         totalSpent: 0,
//         purchasedClasses: [],
//         purchasedVideos: [],
//         transactionCount: 0,
//         successfulPayments: 0,
//         failedPayments: 0,
//       };
//     }

//     const userData = userSnap.data();
//     const transactions: Transaction[] = userData.transactions || [];

//     const summary = {
//       totalSpent: transactions
//         .filter((txn) => txn.status === "success")
//         .reduce((sum, txn) => sum + txn.amount, 0),
//       purchasedClasses: userData.purchasedClasses || [],
//       purchasedVideos: userData.purchasedVideos || [],
//       transactionCount: transactions.length,
//       successfulPayments: transactions.filter((txn) => txn.status === "success").length,
//       failedPayments: transactions.filter((txn) => txn.status === "failed").length,
//       recentTransactions: transactions.slice(0, 5), // Last 5 transactions
//     };

//     return summary;
//   } catch (error) {
//     console.error("❌ Error getting purchase summary:", error);
//     throw error;
//   }
// }

import { doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types/masterclass";

/**
 * ===================================================
 *  SAFE SANITIZER
 *  Removes undefined values (Firestore-safe)
 *  DOES NOT add null anywhere.
 * ===================================================
 */
function sanitizeTransactionInput<T extends object>(obj: Partial<T>): Partial<T> {
  const out: Partial<T> = {};

  for (const key of Object.keys(obj)) {
    const val = obj[key as keyof T];

    if (val !== undefined) {
      out[key as keyof T] = val;
    }
  }

  return out;
}

/**
 * ===================================================
 * ADD TRANSACTION
 * ===================================================
 */
export async function addTransactionRecord(
  userId: string,
  transaction: Partial<Transaction>
) {
  try {
    const userRef = doc(db, "user_profiles", userId);
    const userSnap = await getDoc(userRef);

    const safeTxInput = sanitizeTransactionInput<Transaction>(transaction);

    const newTransaction: Transaction = {
      orderId: safeTxInput.orderId || `txn_${Date.now()}`,
      paymentId: safeTxInput.paymentId,
      masterclassId: safeTxInput.masterclassId ?? "",
      videoId: safeTxInput.videoId,
      masterclassTitle: safeTxInput.masterclassTitle ?? "Unknown",
      videoTitle: safeTxInput.videoTitle,
      amount: safeTxInput.amount ?? 0,
      status: safeTxInput.status ?? "pending",
      method: safeTxInput.method ?? "razorpay",
      type: safeTxInput.type,
      failureReason: safeTxInput.failureReason,
      errorCode: safeTxInput.errorCode,
      timestamp: safeTxInput.timestamp ?? new Date().toISOString(),
      updatedAt: safeTxInput.updatedAt,
    };

    if (userSnap.exists()) {
      const currentTransactions = userSnap.data().transactions || [];

      const duplicate = currentTransactions.find(
        (txn: Transaction) => txn.orderId === newTransaction.orderId
      );

      if (!duplicate) {
        await updateDoc(userRef, {
          transactions: arrayUnion(newTransaction),
        });
        console.log("✅ Transaction added:", newTransaction.orderId);
      } else {
        console.log("ℹ️ Transaction already exists:", newTransaction.orderId);
      }
    } else {
      await setDoc(userRef, {
        id: userId,
        transactions: [newTransaction],
        purchasedClasses: [],
        purchasedVideos: [],
        created_at: new Date().toISOString(),
      });
      console.log("✅ User profile created with transaction");
    }
  } catch (error) {
    console.error("❌ Error adding transaction:", error);
    throw error;
  }
}

/**
 * ===================================================
 * UPDATE TRANSACTION STATUS
 * ===================================================
 */
export async function updateTransactionStatus(
  userId: string,
  orderId: string,
  updates: Partial<Transaction>
) {
  try {
    const userRef = doc(db, "user_profiles", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) throw new Error("User not found");

    const userData = userSnap.data();
    const transactions = userData.transactions || [];

    const safeUpdates = sanitizeTransactionInput(updates);

    const updatedTransactions = transactions.map((txn: Transaction) => {
      if (txn.orderId === orderId) {
        return {
          ...txn,
          ...safeUpdates,
          updatedAt: new Date().toISOString(),
        };
      }
      return txn;
    });

    await updateDoc(userRef, { transactions: updatedTransactions });

    console.log(`✅ Transaction ${orderId} updated`);
  } catch (error) {
    console.error("❌ Error updating transaction:", error);
    throw error;
  }
}

/**
 * ===================================================
 * ADD PURCHASED CLASS
 * ===================================================
 */
export async function addPurchasedClass(userId: string, masterclassTitle: string | null) {
  try {
    if (!masterclassTitle) return;

    const userRef = doc(db, "user_profiles", userId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      await updateDoc(userRef, {
        purchasedClasses: arrayUnion(masterclassTitle),
      });
    } else {
      await setDoc(userRef, {
        id: userId,
        purchasedClasses: [masterclassTitle],
        purchasedVideos: [],
        transactions: [],
        created_at: new Date().toISOString(),
      });
    }

    console.log("✅ Masterclass added to purchased list");
  } catch (e) {
    console.error("❌ Error adding purchased class:", e);
    throw e;
  }
}

/**
 * ===================================================
 * ADD PURCHASED VIDEO
 * ===================================================
 */
export async function addPurchasedVideo(userId: string, videoId: string | null) {
  try {
    if (!videoId) return;

    const userRef = doc(db, "user_profiles", userId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      await updateDoc(userRef, {
        purchasedVideos: arrayUnion(videoId),
      });
    } else {
      await setDoc(userRef, {
        id: userId,
        purchasedVideos: [videoId],
        purchasedClasses: [],
        transactions: [],
        created_at: new Date().toISOString(),
      });
    }

    console.log("✅ Video added to purchased list");
  } catch (e) {
    console.error("❌ Error adding purchased video:", e);
    throw e;
  }
}

/**
 * ===================================================
 * CHECK VIDEO ACCESS
 * ===================================================
 */
export async function hasVideoAccess(
  userId: string,
  masterclassId: string,
  videoId: string
): Promise<boolean> {
  try {
    const masterclassRef = doc(db, "MasterClasses", masterclassId);
    const mcSnap = await getDoc(masterclassRef);

    if (mcSnap.exists()) {
      const joinedUsers = mcSnap.data().joined_users || [];
      if (joinedUsers.includes(userId)) return true;
    }

    const userRef = doc(db, "user_profiles", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return (userSnap.data().purchasedVideos || []).includes(videoId);
    }

    return false;
  } catch (error) {
    console.error("❌ Error checking video access:", error);
    return false;
  }
}

/**
 * ===================================================
 * GET USER TRANSACTIONS
 * ===================================================
 */
export async function getUserTransactions(userId: string) {
  try {
    const userRef = doc(db, "user_profiles", userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return [];

    const transactions: Transaction[] = snap.data().transactions || [];

    return transactions.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (e) {
    console.error("❌ Error fetching transactions:", e);
    return [];
  }
}

/**
 * ===================================================
 * GET TRANSACTION BY ORDER ID
 * ===================================================
 */
export async function getTransactionByOrderId(
  userId: string,
  orderId: string
) {
  try {
    const userRef = doc(db, "user_profiles", userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return null;

    return (snap.data().transactions || []).find(
      (txn: Transaction) => txn.orderId === orderId
    ) || null;
  } catch (e) {
    console.error("❌ Error fetching transaction:", e);
    return null;
  }
}

/**
 * ===================================================
 * CHECK UPCOMING MASTERCLASS REGISTRATION
 * ===================================================
 */
export async function isUserRegistered(
  userId: string,
  masterclassId: string
): Promise<boolean> {
  try {
    const mcRef = doc(db, "MasterClasses", masterclassId);
    const snap = await getDoc(mcRef);

    if (!snap.exists()) return false;

    return (snap.data().joined_users || []).includes(userId);
  } catch (e) {
    console.error("❌ Error checking registration:", e);
    return false;
  }
}

/**
 * ===================================================
 * USER PURCHASE SUMMARY
 * ===================================================
 */
export async function getUserPurchaseSummary(userId: string) {
  try {
    const userRef = doc(db, "user_profiles", userId);
    const snap = await getDoc(userRef);

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
    const transactions: Transaction[] = data.transactions || [];

    return {
      totalSpent: transactions
        .filter((t) => t.status === "success")
        .reduce((sum, t) => sum + t.amount, 0),
      purchasedClasses: data.purchasedClasses || [],
      purchasedVideos: data.purchasedVideos || [],
      transactionCount: transactions.length,
      successfulPayments: transactions.filter((t) => t.status === "success").length,
      failedPayments: transactions.filter((t) => t.status === "failed").length,
      recentTransactions: transactions.slice(0, 5),
    };
  } catch (e) {
    console.error("❌ Error getting summary:", e);
    throw e;
  }
}
