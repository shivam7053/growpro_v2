"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What types of masterclasses do you offer?",
    answer:
      "We offer a wide range of masterclasses covering resume building, interview preparation, LinkedIn optimization, salary negotiation, and industry-specific skills. All classes are led by professionals from top companies like Google, Amazon, Microsoft, and more.",
  },
  {
    question: "How do I access the masterclasses after purchasing?",
    answer:
      "Once you purchase a masterclass, it will be available in your dashboard under 'My Masterclasses'. You'll get lifetime access to the content, including video recordings, resources, and materials. You can watch at your own pace from any device.",
  },
  {
    question: "Are the workshops live or recorded?",
    answer:
      "We offer both live interactive workshops and pre-recorded masterclasses. Live workshops allow you to ask questions in real-time, while recorded sessions give you the flexibility to learn at your own schedule. All live sessions are recorded for later viewing.",
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer:
      "Yes! We offer a 7-day money-back guarantee on all paid masterclasses. If you're not satisfied with the content, simply contact our support team within 7 days of purchase for a full refund, no questions asked.",
  },
  {
    question: "Do you provide certificates after completing a masterclass?",
    answer:
      "Absolutely! Upon completing a masterclass, you'll receive a verified certificate of completion that you can add to your LinkedIn profile or resume. These certificates are recognized by many employers and demonstrate your commitment to professional development.",
  },
  {
    question: "How can I connect with the instructors?",
    answer:
      "Each masterclass includes a Q&A session where you can ask questions directly to the instructor. Additionally, our premium members get access to exclusive networking events and one-on-one mentorship sessions with industry experts.",
  },
];

// ✅ Proper Variants definition
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.section
      className="py-20 bg-gray-50 dark:bg-gray-900 relative z-10"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-3 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
            Everything you need to know about GrowPro
          </p>
        </motion.div>

        {/* FAQ Items */}
        <motion.div variants={fadeInUp} className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg 
                         transition-shadow duration-300 overflow-hidden 
                         border border-gray-200 dark:border-gray-700"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="text-lg font-semibold text-gray-900 dark:text-white pr-8">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-gray-700 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        {/* Footer CTA */}
        <motion.div variants={fadeInUp} className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black 
                       px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all duration-300 shadow-md"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </motion.section>
  );
}
