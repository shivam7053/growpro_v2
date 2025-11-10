"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { Calendar, ArrowRight, AlertTriangle, Clock, Sparkles } from "lucide-react";
import MasterclassCard from "@/components/masterclassCard";
import { Masterclass } from "@/types/masterclass";

interface Props {
  masterclasses: Masterclass[];
  loading: boolean;
  user: any;
  onPurchaseComplete: () => void;
}

const fadeInUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
};

const staggerChildren: Variants = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function UpcomingMasterclassSection({
  masterclasses,
  loading,
  user,
  onPurchaseComplete,
}: Props) {
  // Filter only upcoming masterclasses
  const upcomingMasterclasses = masterclasses
    .filter((mc) => mc.type === "upcoming")
    .sort((a, b) => {
      // Sort by scheduled date (earliest first)
      const dateA = a.scheduled_date ? new Date(a.scheduled_date).getTime() : 0;
      const dateB = b.scheduled_date ? new Date(b.scheduled_date).getTime() : 0;
      return dateA - dateB;
    });

  // Don't render section if no upcoming classes
  if (!loading && upcomingMasterclasses.length === 0) {
    return null;
  }

  return (
    <motion.section
      className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 relative z-10 transition-colors duration-300"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      variants={staggerChildren}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">
            Upcoming Masterclasses
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium max-w-2xl mx-auto">
            Register now for free and be the first to join when these sessions go live
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-300 border-t-blue-600 dark:border-blue-700 dark:border-t-blue-400"></div>
          </div>
        )}

        {/* Upcoming Masterclasses Grid */}
        {!loading && upcomingMasterclasses.length > 0 && (
          <motion.div
            variants={staggerChildren}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {upcomingMasterclasses.map((mc, index) => (
              <motion.div
                key={mc.id}
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <MasterclassCard
                  masterclass={mc}
                  user={user}
                  onPurchaseComplete={onPurchaseComplete}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* CTA - View All Upcoming */}
        {!loading && upcomingMasterclasses.length > 3 && (
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link
              href="/masterclasses?filter=upcoming"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Calendar className="w-5 h-5" />
              View All Upcoming Classes
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        )}

        {/* Info Banner */}
        {!loading && upcomingMasterclasses.length > 0 && (
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 dark:bg-blue-500 p-3 rounded-full flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Don't Miss Out!
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Register for upcoming masterclasses for free and get notified when they go live. 
                  Seats are limited, so secure your spot today!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}