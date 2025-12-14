// components/Header.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, Sun, Moon, Bell, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContexts";
import { useTheme } from "next-themes";
import { AppNotification } from "@/types/masterclass";
import NotificationCard from "./NotificationCard"; // ⭐ Import NotificationCard

interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = false }: HeaderProps) {
  const { user, userProfile, signOut, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setMounted(true);

    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    // Listen for real-time notifications (only latest 5 for dropdown)
    const q = query(
      collection(db, `user_profiles/${user.uid}/notifications`), 
      orderBy("createdAt", "desc"),
      limit(5)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifs = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as AppNotification));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    if (!user?.uid) return;
    try {
      const notifRef = doc(db, `user_profiles/${user.uid}/notifications`, id);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDismiss = async (id: string) => {
    if (!user?.uid) return;
    try {
      const notifRef = doc(db, `user_profiles/${user.uid}/notifications`, id);
      await updateDoc(notifRef, { dismissed: true });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error dismissing:", error);
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setNotificationOpen(false);
    if (notification.ctaLink) {
      router.push(notification.ctaLink);
    }
  };

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
          <Link
            href="/"
            className="flex items-center rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-sm"
          >
            <img
              src={
                !mounted
                  ? "/logo_growpro.png"
                  : theme === "dark" || resolvedTheme === "dark"
                  ? "/white-logo.png"
                  : "/logo_growpro.png"
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
            {[
              { path: "/", label: "Home" },
              { path: "/contact", label: "Contact Us" },
              { path: "/about", label: "About Us" },
              { path: "/masterclasses", label: "Master Classes" },
            ].map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "bg-white text-black"
                    : transparent
                    ? "text-white hover:bg-white/20"
                    : "text-white hover:bg-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(prev => !prev)}
                  className={`p-3 rounded-full border transition-all hover:bg-gray-200 dark:hover:bg-gray-700 ${
                    transparent
                      ? "border-white text-white hover:bg-white/10"
                      : "border-gray-300 text-gray-700 dark:text-gray-200"
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                <AnimatePresence>
                  {isNotificationOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setNotificationOpen(false)}
                      />
                      
                      {/* Panel */}
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-14 right-0 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 z-50 overflow-hidden"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Notifications</h4>
                            {unreadCount > 0 && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {unreadCount} unread
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={() => setNotificationOpen(false)} 
                            className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[32rem] overflow-y-auto">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                              {notifications.map(notification => (
                                <div key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <NotificationCard
                                    notification={notification}
                                    onMarkAsRead={markAsRead}
                                    onDismiss={handleDismiss}
                                    onClick={() => handleNotificationClick(notification)}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center">
                              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No notifications yet
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 text-center border-t dark:border-gray-700">
                          <Link 
                            href="/notifications" 
                            onClick={() => setNotificationOpen(false)}
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            View all notifications
                          </Link>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

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
              <div className="flex items-center space-x-2">
                <div className="animate-pulse bg-gray-200 h-10 w-20 rounded-full"></div>
                <div className="animate-pulse bg-gray-200 h-10 w-24 rounded-full"></div>
              </div>
            ) : user ? (
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