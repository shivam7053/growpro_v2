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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>

        {error && (
          <div className="text-red-500 text-center text-sm mb-3">{error}</div>
        )}

        <input
          type="text"
          placeholder="Admin ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full mb-4 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
