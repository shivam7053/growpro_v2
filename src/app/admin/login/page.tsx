"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const adminUser = process.env.NEXT_PUBLIC_ADMIN_USER;
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASS;

    if (userId === adminUser && password === adminPass) {
      localStorage.setItem("isAdmin", "true");
      router.push("/admin");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-950 dark:to-black transition-colors duration-500">
      <form
        onSubmit={handleLogin}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 transition-all duration-300"
      >
        <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-900 dark:text-white tracking-tight">
          Admin Login
        </h1>

        {error && (
          <div className="text-red-600 dark:text-red-400 text-center text-sm font-medium mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg py-2 px-3">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
              Admin ID
            </label>
            <input
              type="text"
              placeholder="Enter Admin ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
          Login
        </button>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} GrowPro Admin Panel
        </p>
      </form>
    </div>
  );
}
