"use client";

import React from "react";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-center">Cookie Policy</h1>

        <p className="mb-4">
          This Cookie Policy explains how <strong>GrowPro</strong> uses cookies
          and similar technologies on our website.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. What Are Cookies?</h2>
        <p className="mb-4">
          Cookies are small text files stored on your device when you visit a
          website. They help us improve your browsing experience and analyze
          site usage.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          2. Types of Cookies We Use
        </h2>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>
            <strong>Essential Cookies:</strong> Required for site functionality.
          </li>
          <li>
            <strong>Analytics Cookies:</strong> Help us understand usage
            patterns.
          </li>
          <li>
            <strong>Preference Cookies:</strong> Remember your settings and
            preferences.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Managing Cookies</h2>
        <p className="mb-4">
          You can manage or disable cookies in your browser settings. However,
          some features may not function properly if cookies are disabled.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          4. Third-Party Cookies
        </h2>
        <p className="mb-4">
          We may use third-party tools such as Google Analytics and Razorpay
          that set their own cookies for analytics or payment processing.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Contact</h2>
        <p className="mb-4">
          If you have any questions about this policy, contact us at{" "}
          <strong>india.growpro@gmail.com</strong>.
        </p>

        <p className="text-sm mt-8 text-gray-600 dark:text-gray-400">
          <strong>Effective Date:</strong> November 8, 2025
        </p>
      </div>
    </div>
  );
}
