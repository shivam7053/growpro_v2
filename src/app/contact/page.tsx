"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      await addDoc(collection(db, "contacts"), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error saving message:", error);
      toast.error("Failed to send message. Try again later!");
    } finally {
      setSending(false);
    }
  };

  // ✅ Fixed and typed fadeInUp variant
  const fadeInUp: Variants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const staggerChildren: Variants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">


      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Get in Touch
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Have questions about our services? Need help with your career journey?
              We're here to help you succeed.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
            >
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Send us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-400 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-gray-400 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    placeholder="Enter subject"
                    className="w-full px-4 py-3 border border-gray-400 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, message: e.target.value }))
                    }
                    rows={6}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 border border-gray-400 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 text-lg flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              className="space-y-8"
              initial="initial"
              animate="animate"
              variants={staggerChildren}
            >
              <motion.div
                variants={fadeInUp}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Contact Information
                </h3>

                <div className="space-y-6 text-base">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Email</p>
                      <p className="text-gray-700 dark:text-gray-300">India.growpro@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-700 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Phone</p>
                      <p className="text-gray-700 dark:text-gray-300">+91 9625003045</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-purple-700 dark:text-purple-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Address</p>
                      <p className="text-gray-700 dark:text-gray-300">New Delhi, India</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>


    </div>
  );
}
