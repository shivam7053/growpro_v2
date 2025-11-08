"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContexts";
import { motion } from "framer-motion";
import { IndianRupee } from "lucide-react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TransactionsPage() {
  const { userProfile, loading } = useAuth();
  const [masterclassTitles, setMasterclassTitles] = useState<Record<string, string>>({});
  const [loadingTitles, setLoadingTitles] = useState(true);

  // Fetch all masterclass titles once
  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "MasterClasses"));
        const titlesMap: Record<string, string> = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          titlesMap[doc.id] = data.title || "Untitled Class";
        });
        setMasterclassTitles(titlesMap);
      } catch (error) {
        console.error("Error fetching masterclass titles:", error);
      } finally {
        setLoadingTitles(false);
      }
    };

    fetchTitles();
  }, []);

  if (loading || loadingTitles)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen pt-28 pb-12 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <motion.h1
          className="text-3xl font-bold mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Transaction History
        </motion.h1>

        {userProfile?.transactions?.length ? (
          <div className="space-y-3">
            {userProfile.transactions
              .slice()
              .reverse()
              .map((txn, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow border dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">
                      {masterclassTitles[txn.masterclassId] || txn.masterclassId}
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <IndianRupee className="w-4 h-4" />
                      {txn.amount?.toFixed(2)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Order ID: {txn.orderId}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Payment ID: {txn.paymentId}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(txn.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-6">
            No transactions found.
          </p>
        )}

        <div className="text-center mt-8">
          <Link
            href="/profile"
            className="inline-block px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
