"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
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
  animate: { transition: { staggerChildren: 0.12 } },
};

export default function MasterclassSection({
  masterclasses,
  loading,
  user,
  onPurchaseComplete,
}: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Show featured, upcoming, and recent masterclasses (max 4)
  const displayedMasterclasses = masterclasses
    .filter((mc) => mc.type === "featured" || mc.type === "upcoming")
    .slice(0, 4);

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev >= displayedMasterclasses.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev <= 0 ? displayedMasterclasses.length - 1 : prev - 1
    );
  };

  return (
    <motion.section
      className="py-20 bg-gray-50 dark:bg-gray-900 relative z-10 transition-colors duration-300"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      variants={staggerChildren}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row justify-between items-center mb-10"
        >
          <div className="text-center md:text-left">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-3 text-gray-900 dark:text-white">
              Featured Masterclasses
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
              Learn from industry experts and unlock your career potential
            </p>
          </div>
          <Link
            href="/masterclasses"
            className="mt-6 md:mt-0 inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black 
                       px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all duration-300 shadow-md"
          >
            View All
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white"></div>
          </div>
        )}

        {/* No Masterclasses */}
        {!loading && displayedMasterclasses.length === 0 && (
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.7 }}
            className="text-center text-gray-700 dark:text-gray-300 py-12"
          >
            <AlertTriangle className="w-12 h-12 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
            <p className="font-medium">No featured masterclasses available right now.</p>
          </motion.div>
        )}

        {/* Carousel */}
        {!loading && displayedMasterclasses.length > 0 && (
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl shadow-md">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {displayedMasterclasses.map((mc) => (
                  <div key={mc.id} className="w-full flex-shrink-0 px-2">
                    <MasterclassCard
                      masterclass={mc}
                      user={user}
                      onPurchaseComplete={onPurchaseComplete}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            {displayedMasterclasses.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-3 rounded-full shadow-md hover:scale-110 transition"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-gray-100" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-3 rounded-full shadow-md hover:scale-110 transition"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800 dark:text-gray-100" />
                </button>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {displayedMasterclasses.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition ${
                        index === currentSlide
                          ? "bg-black dark:bg-white"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}