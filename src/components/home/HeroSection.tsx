"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ✅ Correct variants definition
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const staggerChildren: Variants = {
  animate: {
    transition: { staggerChildren: 0.12 },
  },
};

const steps = [
  {
    title: "Join 10,000+ job seekers who leveled up their careers",
    desc: "Be part of a thriving community that's landing dream jobs!",
  },
  {
    title:
      "Get your resume screened, find the perfect job, and attend workshops",
    desc: "A full suite of tools designed to boost your career.",
  },
  {
    title: "Personalised career support tailored for you",
    desc: "Guidance crafted around your career journey.",
  },
];

export default function HeroSection() {
  return (
    <motion.section
      className="pt-24 pb-20 bg-white dark:bg-gray-900 relative z-10 shadow-sm"
      initial="initial"
      animate="animate"
      variants={staggerChildren}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Hero Title & Buttons */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-gray-900 dark:text-white">
            WE HELP YOU CRACK YOUR DREAM JOB!
          </h1>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Link
              href="/global-opportunities"
              className="bg-black text-white dark:bg-white dark:text-black 
                         px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-md"
            >
              Global Remote Opportunities
            </Link>
            <Link
              href="/masterclasses"
              className="bg-black text-white dark:bg-white dark:text-black 
                         px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-md"
            >
              Master Classes
            </Link>
          </div>
        </motion.div>

        {/* Hero Illustration + Steps */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <motion.img
            src="/1stpage.png"
            alt="Professional success illustration"
            className="w-full rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            variants={fadeInUp}
          />

          <motion.div
            variants={fadeInUp}
            className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Your Dream Job Awaits!
            </h2>

            <div className="space-y-6 text-gray-800 dark:text-gray-300">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-black dark:bg-white dark:text-black text-white rounded-full flex items-center justify-center font-bold shadow-md">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {step.title}
                    </p>
                    <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="w-full bg-black text-white dark:bg-white dark:text-black 
                         py-4 mt-8 rounded-full font-semibold hover:scale-105 transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
