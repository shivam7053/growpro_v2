"use client";

import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContexts";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import HeroSection from "@/components/home/HeroSection";
import MasterclassSection from "@/components/home/MasterclassSection";
import UpcomingMasterclassSection from "@/components/home/UpcomingMasterClassSection";
import WorkshopsTestimonialsSection from "@/components/home/WorkshopsTestimonialsSection";
import CTAFooter from "@/components/home/CTAFooter";
import BackgroundAnimation from "@/components/home/BackgroundAnimation";
import TeachersCarousel from "@/components/home/TeachersCarousel";
import FAQSection from "@/components/home/FAQSection";
import StudentFeedback from "@/components/home/StudentFeedback";
import HeroVideoSection from "@/components/home/HeroVideoSection";

import { Masterclass } from "@/types/masterclass";
import { parseMasterclassData } from "@/utils/masterclass";

export default function HomePage() {
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // ✅ Fetch Masterclasses from Firestore
  const fetchMasterclasses = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "MasterClasses"));
      
      const list: Masterclass[] = [];
      querySnapshot.docs.forEach((docSnap) => {
        const parsed = parseMasterclassData(docSnap.id, docSnap.data());
        if (parsed) list.push(parsed);
      });

      setMasterclasses(list);
    } catch (error: any) {
      console.error("❌ Error loading masterclasses:", error);
      toast.error("Error loading masterclasses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterclasses();
  }, [fetchMasterclasses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden relative text-gray-900 dark:text-gray-100">
      <BackgroundAnimation />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <HeroSection />
      </motion.div>

      {/* Hero Video Section */}
      {/* <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <HeroVideoSection />
      </motion.div> */}

      {/* Featured Masterclasses Section - Shows any 4 classes */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <MasterclassSection
          masterclasses={masterclasses}
          loading={loading}
          user={user}
          onPurchaseComplete={fetchMasterclasses}
        />
      </motion.div>

      {/* Upcoming Masterclasses Section - Shows only upcoming classes */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <UpcomingMasterclassSection
          masterclasses={masterclasses}
          loading={loading}
          user={user}
          onPurchaseComplete={fetchMasterclasses}
        />
      </motion.div>

      {/* Workshops & Testimonials */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <WorkshopsTestimonialsSection />
      </motion.div>

      {/* Teachers Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <TeachersCarousel />
      </motion.div>

      {/* Student Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <StudentFeedback />
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <FAQSection />
      </motion.div>

      {/* CTA Footer */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <CTAFooter />
      </motion.div>
    </div>
  );
}