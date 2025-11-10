"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContexts";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import HeroSection from "@/components/home/HeroSection";
import MasterclassSection from "@/components/home/MasterclassSection";
import WorkshopsTestimonialsSection from "@/components/home/WorkshopsTestimonialsSection";
import CTAFooter from "@/components/home/CTAFooter";
import BackgroundAnimation from "@/components/home/BackgroundAnimation";
import TeachersCarousel from "@/components/home/TeachersCarousel";
import FAQSection from "@/components/home/FAQSection";
import StudentFeedback from "@/components/home/StudentFeedback";
import HeroVideoSection from "@/components/home/HeroVideoSection";

import { Masterclass } from "@/types/masterclass"; // ✅ Single source of truth

export default function HomePage() {
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // ✅ Fetch Masterclasses from Firestore
  useEffect(() => {
    const fetchMasterclasses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "MasterClasses"));
        const list = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          joined_users: d.data().joined_users || [],
          price: d.data().price || 0,
        })) as Masterclass[];
        setMasterclasses(list);
      } catch (error: any) {
        console.error("❌ Error loading masterclasses:", error);
        toast.error("Error loading masterclasses");
      } finally {
        setLoading(false);
      }
    };
    fetchMasterclasses();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden relative text-gray-900 dark:text-gray-100">
      <BackgroundAnimation />


      {/* ✅ Animate only when visible */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <HeroSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <HeroVideoSection />
      </motion.div>

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
          onPurchaseComplete={() => {
            // re-fetch masterclasses after purchase
            getDocs(collection(db, "MasterClasses")).then((querySnapshot) => {
              const list = querySnapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                joined_users: d.data().joined_users || [],
                price: d.data().price || 0,
              })) as Masterclass[];
              setMasterclasses(list);
            });
          }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <WorkshopsTestimonialsSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <TeachersCarousel />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <StudentFeedback />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <FAQSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <CTAFooter />
      </motion.div>
    </div>
  );
}
