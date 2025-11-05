"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContexts"; // ✅ Firebase Auth Context

interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = false }: HeaderProps) {
  const { user, userProfile, signOut, loading, isAdmin } = useAuth(); // ✅ Corrected: signOut (not signOutUser)
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut(); // ✅ Correct function name
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        transparent
          ? "bg-transparent text-white"
          : "bg-white/95 backdrop-blur-md shadow-sm text-gray-800"
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/logo_growpro.png" alt="GrowPro" className="h-20 w-25" />
          </Link>

          {/* Navigation */}
          <nav
            className={`hidden md:flex items-center space-x-1 rounded-full px-3 py-2 transition-all ${
              transparent ? "bg-white/10" : "bg-black"
            }`}
          >
            <Link
              href="/"
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-white text-black"
                  : transparent
                  ? "text-white hover:bg-white/20"
                  : "text-white hover:bg-gray-800"
              }`}
            >
              Home
            </Link>

            <Link
              href="/contact"
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                isActive("/contact")
                  ? "bg-white text-black"
                  : transparent
                  ? "text-white hover:bg-white/20"
                  : "text-white hover:bg-gray-800"
              }`}
            >
              Contact Us
            </Link>

            <Link
              href="/masterclasses"
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                isActive("/masterclasses")
                  ? "bg-white text-black"
                  : transparent
                  ? "text-white hover:bg-white/20"
                  : "text-white hover:bg-gray-800"
              }`}
            >
              Master Classes
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {loading ? (
              // Loading Skeleton
              <div className="flex items-center space-x-2">
                <div className="animate-pulse bg-gray-200 h-10 w-20 rounded-full"></div>
                <div className="animate-pulse bg-gray-200 h-10 w-24 rounded-full"></div>
              </div>
            ) : user ? (
              // Logged-in User
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="bg-red-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Admin
                  </Link>
                )}

                <Link
                  href="/profile"
                  className={`flex items-center space-x-2 transition-colors px-4 py-2 border rounded-full text-sm font-medium ${
                    transparent
                      ? "border-white text-white hover:bg-white/10"
                      : "border-gray-300 text-gray-700 hover:text-black"
                  }`}
                >
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Profile"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span>{userProfile?.full_name || "Profile"}</span>
                  <Settings className="w-4 h-4" />
                </Link>

                <button
                  onClick={handleSignOut}
                  className={`transition-colors px-6 py-3 border rounded-full text-sm font-medium ${
                    transparent
                      ? "border-white text-white hover:bg-white/10"
                      : "border-gray-300 text-gray-700 hover:text-black"
                  }`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              // Guest (Not logged in)
              <>
                <Link
                  href="/signin"
                  className={`transition-colors px-6 py-3 border rounded-full text-sm font-medium ${
                    transparent
                      ? "border-white text-white hover:bg-white/10"
                      : "border-gray-300 text-gray-700 hover:text-black"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                    transparent
                      ? "bg-white text-black hover:bg-gray-100"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  Join Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
