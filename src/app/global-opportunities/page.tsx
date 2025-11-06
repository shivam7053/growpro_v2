"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  DollarSign,
  Building,
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContexts";
import toast from "react-hot-toast";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  types: string;
  description: string;
  skills: string[];
  posted_date: string;
  created_at: any;
  applied_user?: string[];
}

export default function GlobalOpportunitiesPage() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [applied, setApplied] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    try {
      const q = query(collection(db, "opportunities"), orderBy("created_at", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Opportunity[];
        setOpportunities(data);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to fetch opportunities");
      setLoading(false);
    }
  }, []);

  const categories = [
    { id: "all", name: "All" },
    { id: "tech", name: "Technology" },
    { id: "marketing", name: "Marketing" },
    { id: "design", name: "Design" },
    { id: "content", name: "Content" },
  ];

  const filteredOpportunities = opportunities.filter((job) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      job.title?.toLowerCase().includes(search) ||
      job.company?.toLowerCase().includes(search) ||
      job.skills?.some((s) => s.toLowerCase().includes(search));
    if (selectedCategory === "all") return matchesSearch;
    return matchesSearch && job.types?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleApply = async (jobId: string) => {
    if (!user) return toast.error("Please login first!");
    try {
      const jobRef = doc(db, "opportunities", jobId);
      await updateDoc(jobRef, {
        applied_user: arrayUnion(user.uid),
      });
      setApplied((prev) => ({ ...prev, [jobId]: true }));
      toast.success("Application submitted successfully!");
    } catch (err) {
      console.error("Error applying:", err);
      toast.error("Error applying for the job");
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };
  const staggerChildren = { animate: { transition: { staggerChildren: 0.1 } } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900">
      <Header />

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            className="text-center mb-16"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Global Remote Opportunities
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Discover <span className="font-semibold text-black">handpicked remote jobs</span> and
              internships from top companies worldwide. Start your global career journey today.
            </p>
          </motion.div>

          {/* Search + Filter */}
          <motion.div
            className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-gray-100"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search by title, company, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none placeholder-gray-400"
                />
              </div>

              <div className="flex items-center space-x-3">
                <Filter className="w-6 h-6 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-5 py-4 text-lg border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-black outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid md:grid-cols-4 gap-8 mb-16"
            initial="initial"
            animate="animate"
            variants={staggerChildren}
          >
            {[
              { label: "Total Opportunities", value: opportunities.length.toString() },
              {
                label: "Companies",
                value: new Set(opportunities.map((o) => o.company)).size.toString(),
              },
              {
                label: "Categories",
                value: new Set(opportunities.map((o) => o.types)).size.toString(),
              },
              { label: "Active Users", value: "10,000+" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className="text-4xl font-extrabold text-black mb-3">{stat.value}</div>
                <div className="text-gray-700 text-lg font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Job Listings */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-black"></div>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="text-center py-16">
              <Building className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                No opportunities found
              </h3>
              <p className="text-gray-500 text-lg">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <motion.div
              className="space-y-8"
              initial="initial"
              animate="animate"
              variants={staggerChildren}
            >
              {filteredOpportunities.map((job) => (
                <motion.div
                  key={job.id}
                  variants={fadeInUp}
                  className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl border border-gray-100 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-gray-700 mb-3">
                        <div className="flex items-center gap-1">
                          <Building className="w-5 h-5" />
                          <span className="font-medium">{job.company}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-5 h-5" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-5 h-5" />
                          <span>{job.type}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-lg leading-relaxed">{job.description}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {job.skills?.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium border border-gray-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 lg:mt-0 lg:ml-8">
                      {applied[job.id] || job.applied_user?.includes(user?.uid ?? "") ? (
                        <button
                          disabled
                          className="w-full lg:w-auto bg-green-100 text-green-700 px-8 py-4 rounded-full font-semibold flex items-center justify-center gap-2 cursor-default"
                        >
                          <CheckCircle2 className="w-5 h-5" /> Applied
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApply(job.id)}
                          className="w-full lg:w-auto bg-gradient-to-r from-black to-gray-800 text-white px-10 py-4 rounded-full font-semibold hover:scale-105 hover:shadow-xl transition-all duration-300"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

    </div>
  );
}
