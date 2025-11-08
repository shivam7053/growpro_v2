"use client";

import React from "react";
import { useAuth } from "@/context/AuthContexts";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PurchasesPage() {
  const { userProfile, loading } = useAuth();

  if (loading)
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
          Purchased Classes
        </motion.h1>

        {userProfile?.purchasedClasses?.length ? (
          <ul className="space-y-3">
            {userProfile.purchasedClasses.map((cls, i) => (
              <li
                key={i}
                className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-gray-800 shadow"
              >
                <CheckCircle className="text-green-600 w-5 h-5" />
                <span>{cls}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 mt-6">
            No purchased classes found.
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
