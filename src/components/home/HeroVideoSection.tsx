"use client";

import React from "react";
import { motion } from "framer-motion";

const topics = [
  "Web Development",
  "Data Structures",
  "Algorithms",
  "System Design",
  "Machine Learning",
  "Cloud Computing",
  "Database Management",
  "Cyber Security",
  "UI/UX Design",
  "Next.js",
  "React.js",
];

export default function HeroVideoSection() {
  return (
    <section className="relative h-[90vh] w-full overflow-hidden flex flex-col justify-center items-center text-center">
      {/* 🎥 Background Video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        src="/hero-back.mp4" // 🔹 replace with your own video path in public/videos
        autoPlay
        muted
        loop
        playsInline
      ></video>

      {/* 🩵 Overlay for readability */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70"></div>

      {/* 🧠 Hero Content */}
      <div className="relative z-10 text-white px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-bold mb-4"
        >
          Master Every Skill with <span className="text-blue-400">GrowPro</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="text-lg md:text-2xl text-gray-200 max-w-2xl mx-auto"
        >
          Learn from industry experts with real-world projects and guidance.
        </motion.p>
      </div>

      {/* 🚀 Moving Horizontal Topics */}
      <div className="absolute bottom-12 w-full overflow-hidden">
        <motion.div
          className="flex gap-10 text-white text-xl font-semibold whitespace-nowrap"
          animate={{ x: ["0%", "-100%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 25,
          }}
        >
          {[...topics, ...topics].map((topic, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-blue-500/20 backdrop-blur-md rounded-xl border border-blue-400/40"
            >
              {topic}
            </span>
          ))}
        </motion.div>
      </div>

      {/* 🩶 Gradient Fade at bottom */}
      <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-black to-transparent"></div>
    </section>
  );
}
