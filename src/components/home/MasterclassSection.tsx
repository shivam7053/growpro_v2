"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import MasterclassCard from "@/components/masterclassCard";
import { Masterclass } from "@/types/masterclass";

interface Props {
  masterclasses: Masterclass[];
  loading: boolean;
  user: any;
}

const fadeInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const staggerChildren: Variants = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function MasterclassSection({
  masterclasses,
  loading,
  user,
}: Props) {
  // --- NEW SORTING LOGIC ---
  // Prioritize masterclasses with upcoming Zoom sessions, sorted by the soonest date.
  const getSoonestFutureZoomDate = (mc: Masterclass): Date | null => {
    const now = new Date();
    const futureZoomDates = mc.content
      .filter(c => c.source === 'zoom' && c.scheduled_date && new Date(c.scheduled_date) > now)
      .map(c => new Date(c.scheduled_date!));

    if (futureZoomDates.length === 0) return null;
    return new Date(Math.min(...futureZoomDates.map(d => d.getTime())));
  };

  const sortedMasterclasses = [...masterclasses].sort((a, b) => {
    const aSoonestDate = getSoonestFutureZoomDate(a);
    const bSoonestDate = getSoonestFutureZoomDate(b);

    // If both have future zoom sessions, sort by the soonest date
    if (aSoonestDate && bSoonestDate) {
      return aSoonestDate.getTime() - bSoonestDate.getTime();
    }
    // Prioritize 'a' if it has a future zoom session and 'b' does not
    if (aSoonestDate) return -1;
    // Prioritize 'b' if it has a future zoom session and 'a' does not
    if (bSoonestDate) return 1;

    // Fallback: sort by most recently created
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const displayedMasterclasses = sortedMasterclasses.slice(0, 4);

  // The old logic is now replaced:
  // const displayedMasterclasses = [
  //   ...masterclasses.filter((mc) => mc.type === "featured"),
  //   ...masterclasses.filter((mc) => mc.type !== "featured"),
  // ].slice(0, 4);

  return (
    <motion.section
      className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative z-10"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      variants={staggerChildren}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* HEADER */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col md:flex-row justify-between items-center mb-12"
        >
          <div className="text-center md:text-left">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
              Upcoming & New Masterclasses
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Explore our latest sessions and join live events
            </p>
          </div>

          {/* BUTTON — FIXED HOVER */}
          <Link
            href="/masterclasses"
            className="
              mt-6 md:mt-0
              inline-flex items-center gap-2
              bg-black text-white 
              dark:bg-white dark:text-black
              px-6 py-3 rounded-full font-semibold
              transition-all duration-300 
              shadow-md

              hover:scale-[1.07]
              hover:shadow-xl

              hover:bg-gray-800
              dark:hover:bg-gray-100
            "
          >
            View All
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center py-14">
            <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white rounded-full" />
          </div>
        )}

        {/* EMPTY */}
        {!loading && displayedMasterclasses.length === 0 && (
          <motion.div
            variants={fadeInUp}
            className="text-center py-14 text-gray-700 dark:text-gray-300"
          >
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-500 dark:text-gray-400" />
            <p className="font-medium">No masterclasses available right now.</p>
          </motion.div>
        )}

        {/* GRID */}
        {!loading && displayedMasterclasses.length > 0 && (
          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {displayedMasterclasses.map((mc) => (
              <MasterclassCard
                key={mc.id}
                masterclass={mc}
                user={user}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
