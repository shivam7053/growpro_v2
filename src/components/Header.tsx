"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContexts";
import { useTheme } from "next-themes";

interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = false }: HeaderProps) {
  const { user, userProfile, signOut, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
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
          : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm text-gray-800 dark:text-gray-100"
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-sm">
            <img
              src={
                theme === "dark"
                  ? "/white-logo.png" // 👈 White logo for dark mode
                  : "/logo_growpro.png" // 👈 Default logo
              }
              alt="GrowPro"
              className="h-20 w-auto rounded-xl object-contain"
            />
          </Link>


          {/* Navigation */}
          <nav
            className={`hidden md:flex items-center space-x-1 rounded-full px-3 py-2 transition-all ${
              transparent ? "bg-white/10" : "bg-black dark:bg-gray-800"
            }`}
          >
            <Link
              href="/"
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-white text-black"
                  : transparent
                  ? "text-white hover:bg-white/20"
                  : "text-white hover:bg-gray-700"
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
                  : "text-white hover:bg-gray-700"
              }`}
            >
              Contact Us
            </Link>

            <Link
              href="/about"
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                isActive("/about")
                  ? "bg-white text-black"
                  : transparent
                  ? "text-white hover:bg-white/20"
                  : "text-white hover:bg-gray-700"
              }`}
            >
              About Us
            </Link>

            <Link
              href="/masterclasses"
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                isActive("/masterclasses")
                  ? "bg-white text-black"
                  : transparent
                  ? "text-white hover:bg-white/20"
                  : "text-white hover:bg-gray-700"
              }`}
            >
              Master Classes
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`p-3 rounded-full border transition-all hover:bg-gray-200 dark:hover:bg-gray-700 ${
                transparent
                  ? "border-white text-white hover:bg-white/10"
                  : "border-gray-300 text-gray-700 dark:text-gray-200"
              }`}
              title="Toggle Theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === "light" ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-400" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

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
                      : "border-gray-300 text-gray-700 dark:text-gray-200 hover:text-black"
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
                      : "border-gray-300 text-gray-700 dark:text-gray-200 hover:text-black"
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
                      : "border-gray-300 text-gray-700 dark:text-gray-200 hover:text-black"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                    transparent
                      ? "bg-white text-black hover:bg-gray-100"
                      : "bg-black text-white dark:bg-gray-200 dark:text-black hover:bg-gray-800"
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
