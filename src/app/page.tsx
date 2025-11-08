"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContexts";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import HeroSection from "@/components/home/HeroSection";
import MasterclassSection from "@/components/home/MasterclassSection";
import WorkshopsTestimonialsSection from "@/components/home/WorkshopsTestimonialsSection";
import CTAFooter from "@/components/home/CTAFooter";
import BackgroundAnimation from "@/components/home/BackgroundAnimation";
import TeachersCarousel from "@/components/home/TeachersCarousel";
import FAQSection from "@/components/home/FAQSection";
import StudentFeedback from "@/components/home/StudentFeedback";

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

export default function HomePage() {
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchMasterclasses();
  }, []);

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
      toast.error("Error loading masterclasses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden relative text-gray-900 dark:text-gray-100">
      <BackgroundAnimation />
      <Header />
      <HeroSection />
      <MasterclassSection
        masterclasses={masterclasses}
        loading={loading}
        user={user}
        onPurchaseComplete={fetchMasterclasses}
      />
      <WorkshopsTestimonialsSection />
      <TeachersCarousel />
      <StudentFeedback />
      <FAQSection />
      <CTAFooter />
    </div>
  );
}