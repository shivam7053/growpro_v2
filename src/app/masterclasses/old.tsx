//masterclasses/page.tsx
"use client";


import React, { useState, useEffect, useCallback } from "react";
import { motion, easeOut } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContexts";
import toast from "react-hot-toast";
import MasterclassCard from "@/components/masterclassCard";
import { FirebaseError } from "firebase/app";
import { Masterclass, FilterType } from "@/types/masterclass";
import { parseMasterclassData, filterMasterclasses } from "@/utils/masterclass";

export default function MasterclassesPage() {
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [filteredMasterclasses, setFilteredMasterclasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const { user } = useAuth();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredMasterclasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMasterclasses = filteredMasterclasses.slice(startIndex, startIndex + itemsPerPage);

  // Fetch masterclasses
  const fetchMasterclasses = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "MasterClasses"));
      await new Promise((res) => setTimeout(res, 600));

      if (querySnapshot.empty) {
        toast("No masterclasses available yet.");
        setMasterclasses([]);
        return;
      }

      const list: Masterclass[] = [];
      querySnapshot.docs.forEach((docSnap) => {
        const parsed = parseMasterclassData(docSnap.id, docSnap.data());
        if (parsed) list.push(parsed);
      });

      setMasterclasses(list);
      toast.success(`Loaded ${list.length} masterclass${list.length !== 1 ? "es" : ""}`);
    } catch (error) {
      console.error("🔥 Error fetching masterclasses:", error);
      if (error instanceof FirebaseError) {
        toast.error(`Firebase Error: ${error.code}`);
      } else {
        toast.error("Unexpected error while loading masterclasses.");
      }
      setMasterclasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterclasses();
  }, [fetchMasterclasses]);

  // Apply filters
  useEffect(() => {
    if (filterType === "enrolled" && !user) {
      toast("Login required to view enrolled courses.");
    }
    const filtered = filterMasterclasses(masterclasses, searchQuery, filterType, user?.uid);
    setFilteredMasterclasses(filtered);
    setCurrentPage(1);
  }, [masterclasses, searchQuery, filterType, user]);

  const handleRefresh = () => fetchMasterclasses();

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
  };

  const SkeletonCard = () => (
    <div className="animate-pulse bg-white dark:bg-gray-800 shadow rounded-xl p-6 space-y-4 border border-gray-300 dark:border-gray-700">
      <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
    </div>
  );

  const filterButtons: { type: FilterType; label: string }[] = [
    { type: "all", label: "All" },
    { type: "free", label: "Free" },
    { type: "paid", label: "Paid" },
    { type: "featured", label: "Featured" },
    { type: "upcoming", label: "Upcoming" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <section className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium transition mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
                  All Masterclasses
                </h1>
                <p className="text-lg text-gray-700 dark:text-gray-400">
                  Explore expert-led sessions and level up your skills
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-3 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-lg font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="mb-10 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, speaker, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 border border-gray-400 dark:border-gray-700 rounded-lg 
                           text-gray-900 dark:text-gray-100 placeholder-gray-700 dark:placeholder-gray-400 
                           bg-white dark:bg-gray-800 focus:ring-2 focus:ring-black dark:focus:ring-gray-300 
                           focus:border-transparent shadow-sm transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap justify-start">
              {filterButtons.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    filterType === type
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-400 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
              {user && (
                <button
                  onClick={() => setFilterType("enrolled")}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    filterType === "enrolled"
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-400 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  My Courses
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 py-10">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredMasterclasses.length === 0 ? (
            <div className="text-center py-20">
              <AlertTriangle className="w-16 h-16 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Results Found
              </h3>
              <p className="text-gray-700 dark:text-gray-400 mb-6">
                {searchQuery
                  ? `No masterclass found for "${searchQuery}".`
                  : filterType === "enrolled" && !user
                  ? "Login to view your enrolled courses."
                  : filterType === "enrolled"
                  ? "You haven't enrolled in any courses yet."
                  : "No masterclasses available under this filter."}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 font-semibold transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <motion.div
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {currentMasterclasses.map((mc) => (
                  <motion.div key={mc.id} variants={cardVariants}>
                    <MasterclassCard masterclass={mc} user={user} onPurchaseComplete={fetchMasterclasses} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                  >
                    <ChevronLeft className="w-5 h-5" /> Prev
                  </button>

                  <span className="font-medium">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                  >
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}