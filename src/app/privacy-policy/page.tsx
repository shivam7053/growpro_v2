"use client";

import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-center">Privacy Policy</h1>

        <p className="mb-4">
          This Privacy Policy explains how <strong>GrowPro</strong> (“we”,
          “our”, “us”) collects, uses, and protects the personal information of
          users (“you”, “your”) who access our website and services.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          1. Information We Collect
        </h2>
        <p className="mb-4">
          We collect information you provide directly (such as name, email, and
          phone number), and automatically collected data (like IP address and
          usage details) to improve our services.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          2. How We Use Your Information
        </h2>
        <p className="mb-4">
          We use your data to process payments, provide masterclasses, enhance
          user experience, send updates, and ensure compliance with legal
          requirements.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Payment Information</h2>
        <p className="mb-4">
          All payment transactions are securely processed by{" "}
          <strong>Razorpay</strong>. We do not store your full card or payment
          details on our servers.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Protection</h2>
        <p className="mb-4">
          We use industry-standard encryption and security measures to protect
          your data. However, no method of transmission is 100% secure, and we
          cannot guarantee absolute security.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Your Rights</h2>
        <p className="mb-4">
          You can request access, correction, or deletion of your data by
          emailing us at <strong>india.growpro@gmail.com</strong>.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Updates</h2>
        <p className="mb-4">
          We may update this Privacy Policy occasionally. Updates will be posted
          on this page with a revised effective date.
        </p>

        <p className="text-sm mt-8 text-gray-600 dark:text-gray-400">
          <strong>Effective Date:</strong> November 8, 2025
        </p>
      </div>
    </div>
  );
}
