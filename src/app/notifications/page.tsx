//app/notifications/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContexts'; // Assuming this is the correct path
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, writeBatch, updateDoc, where, getDocs } from 'firebase/firestore';
import { AppNotification } from '@/types/masterclass';
import { Bell, CheckCheck, Mail, X, Trash2 } from 'lucide-react';
import NotificationCard from '@/components/NotificationCard'; // ⭐ Import the new component

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `user_profiles/${user.uid}/notifications`), 
      // ✅ FIX: Use an equality '==' check instead of '!='. This is more efficient and allows ordering by other fields.
      where("dismissed", "==", false),
      orderBy('createdAt', 'desc') // Then you can order by other fields.
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as AppNotification));
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleMarkAsRead = async (id: string) => {
    if (!user?.uid) return;
    
    try {
      const notifRef = doc(db, `user_profiles/${user.uid}/notifications`, id);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;

    // ✅ FIX: Re-fetch the documents to ensure we operate on the current state, avoiding race conditions.
    const userNotificationsRef = collection(db, `user_profiles/${user.uid}/notifications`);
    const q = query(userNotificationsRef, where("read", "==", false), where("dismissed", "==", false));
    
    try {
      const unreadSnapshot = await getDocs(q);
      if (unreadSnapshot.empty) return;

      const batch = writeBatch(db);
      unreadSnapshot.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleClearAll = async () => {
    if (!user?.uid || notifications.length === 0) return;

    if (!window.confirm("Are you sure you want to clear all your notifications? This action cannot be undone.")) {
      return;
    }

    // ✅ FIX: Re-fetch all non-dismissed notifications to ensure we delete only what currently exists.
    const userNotificationsRef = collection(db, `user_profiles/${user.uid}/notifications`);
    const q = query(userNotificationsRef, where("dismissed", "==", false));
    
    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      alert("Failed to clear notifications. Please try again.");
    }
  };

  const handleDismiss = async (id: string) => {
    if (!user?.uid) return;
    
    try {
      const notifRef = doc(db, `user_profiles/${user.uid}/notifications`, id);
      await updateDoc(notifRef, { dismissed: true });
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    // Mark as read when clicked
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate if there's a CTA link
    if (notification.ctaLink) {
      window.location.href = notification.ctaLink;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center text-center p-4">
        <Bell className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          You need to be logged in
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sign in to view your notifications.
        </p>
        <Link 
          href="/signin" 
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You\'re all caught up! 🎉'
            }
          </p>
        </div>

        {/* Filter & Actions Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  <CheckCheck className="w-5 h-5" />
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
                onClick={() => handleNotificationClick(notification)}
              />
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 text-center p-12">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread' 
                  ? 'You\'re all caught up! Check back later for updates.'
                  : 'You\'ll see notifications here when there are updates.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}