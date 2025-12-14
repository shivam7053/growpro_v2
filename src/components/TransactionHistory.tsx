"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Calendar,
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import { getUserTransactions } from "@/utils/userUtils";
import { Transaction } from "@/types/masterclass";

interface TransactionHistoryProps {
  userId: string;
}

export default function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "success" | "failed" | "pending">(
    "all"
  );

  useEffect(() => {
    loadTransactions();
  }, [userId]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await getUserTransactions(userId);

      // Sort by newest first — FIXED TYPE ERROR
      const sorted = data.sort(
        (a: Transaction, b: Transaction) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setTransactions(sorted);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    const base = "px-3 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "success":
        return `${base} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case "failed":
        return `${base} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case "pending":
        return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      default:
        return base;
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

  const filteredTransactions = transactions.filter((txn) =>
    filter === "all" ? true : txn.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Transaction History
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          View all your payment transactions and their status
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "success", "failed", "pending"].map((status) => (
          <button
            key={status}
            onClick={() =>
              setFilter(status as "all" | "success" | "failed" | "pending")
            }
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 text-xs">
              (
              {status === "all"
                ? transactions.length
                : transactions.filter((t) => t.status === status).length}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Transactions */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No transactions found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {filter !== "all"
              ? `You don't have any ${filter} transactions`
              : "Your transaction history will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.orderId}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(transaction.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {transaction.masterclassTitle}
                    </h3>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(transaction.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        {transaction.method.toUpperCase()}
                      </span>
                    </div>

                    {transaction.failureReason && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-md">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-400">
                          {transaction.failureReason}
                        </p>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 font-mono">
                      Order: {transaction.orderId}
                      {transaction.paymentId && (
                        <>
                          <br />
                          Payment: {transaction.paymentId}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={getStatusBadge(transaction.status)}>
                    {transaction.status.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1 text-lg font-bold text-gray-900 dark:text-white">
                    <IndianRupee className="w-5 h-5" />
                    {transaction.amount}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {transactions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {transactions.filter((t) => t.status === "success").length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Successful
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold text-red-600">
                {transactions.filter((t) => t.status === "failed").length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Failed
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {transactions.filter((t) => t.status === "pending").length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Pending
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
