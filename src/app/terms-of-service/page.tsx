"use client";

import React from "react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-center">Terms of Service</h1>

        <p className="mb-4">
          Welcome to <strong>GrowPro</strong>. By accessing or using our website
          and services, you agree to these Terms of Service (“Terms”).
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Use of Services</h2>
        <p className="mb-4">
          You agree to use our services only for lawful purposes and in
          accordance with these Terms. Unauthorized access, copying, or resale
          of our materials is prohibited.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          2. Account Responsibilities
        </h2>
        <p className="mb-4">
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activities under your account.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Payments</h2>
        <p className="mb-4">
          All payments are processed through <strong>Razorpay</strong>. You
          agree to provide accurate billing information. We are not responsible
          for any payment processing errors made by Razorpay.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Refund Policy</h2>
        <p className="mb-4">
          Fees for masterclasses or other paid services are non-refundable
          unless explicitly stated otherwise or required by law.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          5. Limitation of Liability
        </h2>
        <p className="mb-4">
          GrowPro is not liable for indirect, incidental, or consequential
          damages arising from the use or inability to use our services.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Contact Information</h2>
        <p className="mb-4">
          For any questions about these Terms, please contact us at{" "}
          <strong>india.growpro@gmail.com</strong> or call{" "}
          <strong>+91 9625003045</strong>.
        </p>

        <p className="text-sm mt-8 text-gray-600 dark:text-gray-400">
          <strong>Effective Date:</strong> November 8, 2025
        </p>
      </div>
    </div>
  );
}
