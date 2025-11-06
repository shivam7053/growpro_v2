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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            className="text-center mb-12"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Global Remote Opportunities
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover handpicked remote jobs and internships from top companies worldwide.
            </p>
          </motion.div>

          {/* Search + Filter */}
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, company, or skills"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
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
            className="grid md:grid-cols-4 gap-6 mb-12"
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
                className="bg-white rounded-xl shadow-md p-6 text-center"
              >
                <div className="text-3xl font-bold text-black mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Job Listings */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No opportunities found
              </h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <motion.div
              className="space-y-6"
              initial="initial"
              animate="animate"
              variants={staggerChildren}
            >
              {filteredOpportunities.map((job) => (
                <motion.div
                  key={job.id}
                  variants={fadeInUp}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{job.type}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-4">{job.description}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {job.skills?.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 lg:mt-0 lg:ml-6">
                      {applied[job.id] || job.applied_user?.includes(user?.uid ?? "") ? (
                        <button
                          disabled
                          className="w-full lg:w-auto bg-green-100 text-green-700 px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" /> Applied
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApply(job.id)}
                          className="w-full lg:w-auto bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
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
