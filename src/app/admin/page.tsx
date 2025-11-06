"use client";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-16 text-gray-900">
      <h1 className="text-4xl font-extrabold mb-10 text-gray-800">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-11/12 max-w-5xl">
        <Link
          href="/admin/contacts"
          className="p-8 bg-white rounded-2xl shadow-md hover:shadow-xl text-center transition-all duration-300 border border-gray-200"
        >
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            📬 Contact Us Messages
          </h2>
          <p className="text-gray-600">
            View all user-submitted contact forms
          </p>
        </Link>

        <Link
          href="/admin/opportunity"
          className="p-8 bg-white rounded-2xl shadow-md hover:shadow-xl text-center transition-all duration-300 border border-gray-200"
        >
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            💼 Global Opportunities
          </h2>
          <p className="text-gray-600">
            View and add job/internship listings
          </p>
        </Link>

        <Link
          href="/admin/masterclass"
          className="p-8 bg-white rounded-2xl shadow-md hover:shadow-xl text-center transition-all duration-300 border border-gray-200"
        >
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            🎓 Master Classes
          </h2>
          <p className="text-gray-600">
            Manage all masterclass data
          </p>
        </Link>
      </div>
    </div>
  );
}
