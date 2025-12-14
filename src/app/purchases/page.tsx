"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContexts";
import { motion } from "framer-motion";
import { CheckCircle, ShoppingBag, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Masterclass } from "@/types/masterclass"; // ✅ Single source of truth

export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    const fetchPurchasedMasterclasses = async () => {
      // Use the user's UID directly for the query
      if (!user?.uid) {
        setLoadingClasses(false);
        return;
      }

      setLoadingClasses(true);
      try {
        const masterclassesRef = collection(db, "MasterClasses");
        // Query for masterclasses where the user's ID is in the 'purchased_by_users' array.
        const q = query(
          masterclassesRef,
          where("purchased_by_users", "array-contains", user.uid)
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedClasses: Masterclass[] = [];
        querySnapshot.forEach((doc) => {
          // Reconstruct the object to ensure type safety
          const data = doc.data();
          fetchedClasses.push({ id: doc.id, ...data } as Masterclass);
        });

        setMasterclasses(fetchedClasses);
      } catch (error) {
        console.error("Error fetching purchased masterclasses:", error);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchPurchasedMasterclasses();
  }, [user]);

  if (authLoading || loadingClasses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pt-28 pb-12 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold mb-2">Purchased Classes</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Access all your enrolled masterclasses
          </p>
        </motion.div>

        {/* Statistics */}
        <motion.div
          className={`p-6 rounded-lg shadow mb-8 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {masterclasses.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Masterclasses Enrolled
              </div>
            </div>
            <ShoppingBag className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </motion.div>

        {/* Classes List */}
        {masterclasses.length === 0 ? (
          <motion.div
            className={`text-center py-16 rounded-lg shadow ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No purchased classes yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Start learning by enrolling in a masterclass
            </p>
            <Link
              href="/masterclasses"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Masterclasses
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* If we have full masterclass data */}
            {masterclasses.map((masterclass, i) => (
              <motion.div
                key={masterclass.id}
                className={`p-5 rounded-lg shadow hover:shadow-md transition ${
                  theme === "dark"
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {masterclass.thumbnail_url && (
                    <img
                      src={masterclass.thumbnail_url}
                      alt={masterclass.title}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {masterclass.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          By {masterclass.speaker_name}
                        </p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    </div>
                    <Link
                      href={`/masterclasses/${masterclass.id}`}
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Access Class
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Additional Info */}
        <motion.div
          className={`mt-8 p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Having trouble accessing your purchased classes? Contact our support team.
          </p>
          <Link
            href="/contact"
            className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Contact Support
          </Link>
        </motion.div>
      </div>
    </div>
  );
}