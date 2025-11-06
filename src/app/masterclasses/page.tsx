"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Search,
  RefreshCw,
} from "lucide-react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContexts";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MasterclassCard from "@/components/masterclassCard";
import { FirebaseError } from "firebase/app";

interface Masterclass {
  id: string;
  title: string;
  speaker_name: string;
  speaker_designation: string;
  youtube_url: string;
  created_at: string;
  price: number;
  joined_users: string[];
  type: "free" | "paid" | "featured";
}

type FilterType = "all" | "free" | "paid" | "featured" | "enrolled";

export default function MasterclassesPage() {
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [filteredMasterclasses, setFilteredMasterclasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const { user } = useAuth();

  // Fetch masterclasses
  const fetchMasterclasses = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "MasterClasses"));
      await new Promise((res) => setTimeout(res, 600)); // smoother transition

      if (querySnapshot.empty) {
        toast("No masterclasses available yet.");
        setMasterclasses([]);
        return;
      }

      const list: Masterclass[] = [];
      querySnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();

        if (!data.title || !data.speaker_name) return;

        let createdAt: string;
        if (data.created_at instanceof Timestamp) {
          createdAt = data.created_at.toDate().toISOString();
        } else if (typeof data.created_at === "string") {
          createdAt = data.created_at;
        } else {
          createdAt = new Date().toISOString();
        }

        const price =
          typeof data.price === "number" ? data.price : Number(data.price) || 0;
        const joinedUsers = Array.isArray(data.joined_users)
          ? data.joined_users.filter((uid) => typeof uid === "string")
          : [];

        const type =
          data.type === "free" || data.type === "paid" || data.type === "featured"
            ? data.type
            : price === 0
            ? "free"
            : "paid";

        list.push({
          id: docSnap.id,
          title: String(data.title),
          speaker_name: String(data.speaker_name),
          speaker_designation: String(data.speaker_designation ?? "N/A"),
          youtube_url: String(data.youtube_url ?? ""),
          created_at: createdAt,
          joined_users: joinedUsers,
          price,
          type,
        });
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

  // Filter logic
  const filterMasterclasses = useCallback(() => {
    if (!masterclasses.length) {
      setFilteredMasterclasses([]);
      return;
    }

    let filtered = [...masterclasses];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((mc) =>
        [mc.title, mc.speaker_name, mc.speaker_designation].some((field) =>
          field?.toLowerCase().includes(query)
        )
      );
    }

    switch (filterType) {
      case "free":
        filtered = filtered.filter((mc) => mc.type === "free" || mc.price === 0);
        break;
      case "paid":
        filtered = filtered.filter((mc) => mc.type === "paid" || mc.price > 0);
        break;
      case "featured":
        filtered = filtered.filter((mc) => mc.type === "featured");
        break;
      case "enrolled":
        if (!user) {
          toast("Login required to view enrolled courses.");
          filtered = [];
        } else {
          filtered = filtered.filter((mc) => mc.joined_users.includes(user.uid));
        }
        break;
    }

    setFilteredMasterclasses(filtered);
  }, [masterclasses, searchQuery, filterType, user]);

  useEffect(() => {
    filterMasterclasses();
  }, [filterMasterclasses]);

  const handleRefresh = () => fetchMasterclasses();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="animate-pulse bg-white shadow rounded-xl p-6 space-y-4 border border-gray-200">
      <div className="h-40 bg-gray-200 rounded-lg" />
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Header />

      <section className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                  All Masterclasses
                </h1>
                <p className="text-gray-600 text-lg">
                  Explore expert-led sessions and level up your skills
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, speaker, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {["all", "free", "paid", "featured"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as FilterType)}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    filterType === type
                      ? "bg-black text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
              {user && (
                <button
                  onClick={() => setFilterType("enrolled")}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    filterType === "enrolled"
                      ? "bg-black text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
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
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Results Found
              </h3>
              <p className="text-gray-600 mb-6">
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredMasterclasses.map((mc) => (
                <motion.div key={mc.id} variants={cardVariants}>
                  <MasterclassCard
                    masterclass={mc}
                    user={user}
                    onPurchaseComplete={fetchMasterclasses}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

    </div>
  );
}
