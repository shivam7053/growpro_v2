"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ✅ Proper animation definitions — valid for Framer Motion's Variants type
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7 },
  },
};

const staggerChildren = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export default function CTAFooter() {
  return (
    <motion.section
      className="py-20 bg-black dark:bg-gray-950 text-white text-center relative z-10"
      initial="initial"
      whileInView="animate"
      viewport={{ once: false, amount: 0.3 }} // ✅ Re-animates when visible again
      variants={staggerChildren}
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Title */}
        <motion.h2
          variants={fadeInUp}
          className="text-4xl font-extrabold mb-6 tracking-tight"
        >
          Ready to Transform Your Career?
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          variants={fadeInUp}
          className="text-lg text-gray-300 mb-8 leading-relaxed"
        >
          Join thousands of professionals accelerating their careers with{" "}
          <span className="text-white font-semibold">GrowPro</span>.
        </motion.p>

        {/* Button */}
        <motion.div
          variants={fadeInUp}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <Link
            href="/signup"
            className="relative z-20 bg-white text-black dark:bg-white dark:text-black 
                       px-8 py-4 rounded-full font-semibold transition-all duration-300 
                       inline-flex items-center gap-2 shadow-lg hover:shadow-white/40"
          >
            <span>Start Your Journey</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
