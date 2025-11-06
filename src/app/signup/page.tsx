"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/context/AuthContexts";
import UserForm, { UserProfile } from "@/components/UserForm";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();

  // 👇 Initialize empty user profile
  const [userData, setUserData] = useState<UserProfile>({
    id: "",
    full_name: "",
    email: "",
    avatar_url: "",
    phone: "",
    bio: "",
    linkedin: "",
    created_at: "",
  });

  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Handle field updates
  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  // Signup logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUp(userData.email || "", password, userData.full_name);
      // ✅ After successful signup, redirect to home
      router.push("/");
    } catch (error: any) {
      console.error("Sign up error:", error.message);
      // You can use toast here instead of alert if you prefer
      alert(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (error: any) {
      console.error("Google sign-in error:", error.message);
      alert(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Side (Form) */}
      <motion.div
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center items-center mb-8">
            <img src="/logo_growpro.png" alt="GrowPro" className="h-20 w-20" />
          </div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-gray-900 mb-8 text-center"
          >
            Unlock Your Career Potential with GrowPro
          </motion.h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reusable User Form */}
            <UserForm userData={userData} onChange={handleFieldChange} isSignup={true} />

            {/* Password */}
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           text-gray-900 placeholder-gray-500"
                placeholder="Password"
                required
                minLength={6}
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold 
                         hover:bg-gray-800 transition-colors disabled:opacity-50 
                         disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Agree & Join"}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-3 border 
                         border-gray-300 rounded-full text-gray-700 bg-white 
                         hover:bg-gray-50 transition-colors font-medium 
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Already on GrowPro?{" "}
              <Link href="/signin" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </motion.div>

      {/* Right Side (Image) */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 bg-gray-100 items-center justify-center relative overflow-hidden"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{ height: "100vh" }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src="/authentication.png"
            alt="Professional working"
            className="h-4/5 w-auto object-cover object-top"
            style={{
              maxHeight: "80vh",
              objectPosition: "center top",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}