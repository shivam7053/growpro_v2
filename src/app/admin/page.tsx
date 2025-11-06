"use client";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-11/12 max-w-4xl">
        <Link
          href="/admin/contacts"
          className="p-6 bg-white rounded-xl shadow hover:shadow-lg text-center"
        >
          <h2 className="text-xl font-semibold mb-2">📬 Contact Us Messages</h2>
          <p>View all user-submitted contact forms</p>
        </Link>

        <Link
          href="/admin/opportunity"
          className="p-6 bg-white rounded-xl shadow hover:shadow-lg text-center"
        >
          <h2 className="text-xl font-semibold mb-2">
            💼 Global Opportunities
          </h2>
          <p>View and Add job/internship listings</p>
        </Link>

        <Link
          href="/admin/masterclass"
          className="p-6 bg-white rounded-xl shadow hover:shadow-lg text-center"
        >
          <h2 className="text-xl font-semibold mb-2">🎓 Master Classes</h2>
          <p>Manage all masterclass data</p>
        </Link>
      </div>
    </div>
  );
}
