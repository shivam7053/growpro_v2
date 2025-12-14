"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContexts";
import { motion } from "framer-motion";
import {
  IndianRupee,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Transaction } from "@/types/masterclass"; // ✅ Single source of truth

type FilterStatus = "all" | "success" | "failed" | "pending";

export default function TransactionsPage() {
  const { userProfile, loading } = useAuth();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<FilterStatus>("all");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "success":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case "failed":
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const transactions = userProfile?.transactions || [];
  const filteredTransactions =
    filter === "all" ? transactions : transactions.filter((t) => t.status === filter);

  // Sort by timestamp (newest first)
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Calculate statistics
  const stats = {
    total: transactions.length,
    success: transactions.filter((t) => t.status === "success").length,
    failed: transactions.filter((t) => t.status === "failed").length,
    pending: transactions.filter((t) => t.status === "pending").length,
  };

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
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all your payment transactions and their status
          </p>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } shadow`}
          >
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div
            className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } shadow`}
          >
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
          </div>
          <div
            className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } shadow`}
          >
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
          <div
            className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } shadow`}
          >
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setFilter("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Filter className="w-4 h-4" />
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter("success")}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
              filter === "success"
                ? "bg-green-600 text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Success ({stats.success})
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
              filter === "failed"
                ? "bg-red-600 text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Failed ({stats.failed})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Pending ({stats.pending})
          </button>
        </motion.div>

        {/* Transactions List */}
        {sortedTransactions.length === 0 ? (
          <motion.div
            className={`text-center py-16 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } shadow`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No transactions found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {filter !== "all"
                ? `You don't have any ${filter} transactions`
                : "Your transaction history will appear here"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {sortedTransactions.map((txn, i) => (
              <motion.div
                key={i}
                className={`p-5 rounded-lg shadow hover:shadow-md transition ${
                  theme === "dark"
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-1">{getStatusIcon(txn.status)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">
                        {txn.masterclassTitle || "Unknown Masterclass"}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(txn.timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {txn.method?.toUpperCase() || "UNKNOWN"}
                        </span>
                      </div>
                      {txn.failureReason && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-md">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700 dark:text-red-400">
                            {txn.failureReason}
                          </p>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 font-mono">
                        <div>Order: {txn.orderId}</div>
                        {txn.paymentId && <div>Payment: {txn.paymentId}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={getStatusBadge(txn.status)}>
                      {txn.status?.toUpperCase() || "UNKNOWN"}
                    </span>
                    <div className="flex items-center gap-1 text-lg font-bold">
                      <IndianRupee className="w-5 h-5" />
                      {txn.amount?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}