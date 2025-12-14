'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, writeBatch, doc, deleteDoc, updateDoc, query, where, DocumentData } from 'firebase/firestore';
import { AppNotification, AppNotificationType, Masterclass } from '@/types/masterclass';
import { 
  Bell, Plus, Send, Clock, Tag, Sparkles, CheckCircle, 
  Video, PlayCircle, Award, DollarSign, AlertTriangle, 
  User, Zap, MessageSquare, FileText, Gift, Calendar, Trash2, Edit, X,
  Users, TrendingUp
} from 'lucide-react';

// ✅ FIX: Complete template with ALL notification types
const NOTIFICATION_TEMPLATES: Record<AppNotificationType, {
  icon: any;
  color: string;
  defaultTitle: string;
  defaultMessage: string;
  fields: string[];
  ctaText: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}> = {
  new_masterclass: {
    icon: Sparkles,
    color: 'blue',
    defaultTitle: '🎉 New Masterclass Available!',
    defaultMessage: 'Check out our latest masterclass and enhance your skills.',
    fields: ['masterclass'],
    ctaText: 'View Masterclass'
  },
  discount: {
    icon: Tag,
    color: 'green',
    defaultTitle: '💰 Special Discount Alert!',
    defaultMessage: 'Limited time offer on selected courses. Don\'t miss out!',
    fields: ['masterclass', 'discount'],
    ctaText: 'Get Discount'
  },
  masterclass_reminder: {
    icon: Clock,
    color: 'orange',
    defaultTitle: '⏰ Your Class Starts Soon',
    defaultMessage: 'Your enrolled masterclass is starting soon. Get ready!',
    fields: ['masterclass'],
    ctaText: 'Join Now'
  },
  enrollment_confirmation: {
    icon: CheckCircle,
    color: 'green',
    defaultTitle: '✅ Enrollment Successful!',
    defaultMessage: 'You\'re all set! Your masterclass access is now active.',
    fields: ['masterclass'],
    ctaText: 'Start Learning'
  },
  class_started: {
    icon: Video,
    color: 'red',
    defaultTitle: '🔴 Class is Live!',
    defaultMessage: 'Join the live session now. Don\'t miss out!',
    fields: ['masterclass'],
    ctaText: 'Join Live',
    priority: 'urgent'
  },
  class_recording: {
    icon: PlayCircle,
    color: 'purple',
    defaultTitle: '📹 Recording Now Available',
    defaultMessage: 'The recording of your recent class is ready to watch.',
    fields: ['masterclass'],
    ctaText: 'Watch Recording'
  },
  achievement: {
    icon: Award,
    color: 'yellow',
    defaultTitle: '🏆 Achievement Unlocked!',
    defaultMessage: 'Congratulations on reaching a new milestone in your learning journey!',
    fields: ['custom'],
    ctaText: 'View Achievement'
  },
  payment_success: {
    icon: DollarSign,
    color: 'green',
    defaultTitle: '✅ Payment Successful',
    defaultMessage: 'Your payment has been processed successfully.',
    fields: ['amount'],
    ctaText: 'View Receipt'
  },
  payment_failed: {
    icon: AlertTriangle,
    color: 'red',
    defaultTitle: '⚠️ Payment Failed',
    defaultMessage: 'Your payment could not be processed. Please try again.',
    fields: ['amount'],
    ctaText: 'Retry Payment',
    priority: 'high'
  },
  profile_update: {
    icon: User,
    color: 'blue',
    defaultTitle: '👤 Profile Updated',
    defaultMessage: 'Your profile information has been successfully updated.',
    fields: ['custom'],
    ctaText: 'View Profile'
  },
  special_offer: {
    icon: Gift,
    color: 'pink',
    defaultTitle: '🎁 Limited Time Offer!',
    defaultMessage: 'Exclusive deal just for you. Grab it before it expires!',
    fields: ['discount', 'expiry'],
    ctaText: 'Claim Offer',
    priority: 'high'
  },
  new_feature: {
    icon: Zap,
    color: 'indigo',
    defaultTitle: '✨ New Feature Released!',
    defaultMessage: 'We\'ve added exciting new features to improve your experience.',
    fields: ['custom'],
    ctaText: 'Explore Now'
  },
  feedback_request: {
    icon: MessageSquare,
    color: 'teal',
    defaultTitle: '💬 We Value Your Feedback',
    defaultMessage: 'Help us improve by sharing your thoughts on the recent class.',
    fields: ['masterclass'],
    ctaText: 'Give Feedback'
  },
  certificate_ready: {
    icon: FileText,
    color: 'purple',
    defaultTitle: '🎓 Certificate Ready!',
    defaultMessage: 'Your course completion certificate is ready to download.',
    fields: ['masterclass'],
    ctaText: 'Download Certificate'
  },
  general_update: {
    icon: Bell,
    color: 'gray',
    defaultTitle: '📢 Important Update',
    defaultMessage: 'We have an important announcement for you.',
    fields: ['custom'],
    ctaText: 'Learn More'
  }
};

// ✅ FIX: Create a map for Tailwind CSS classes to ensure they are discoverable.
// Tailwind cannot dynamically build classes from strings like `bg-${color}-500`.
const COLOR_MAP = {
  background: {
    blue: 'bg-blue-500', green: 'bg-green-500', orange: 'bg-orange-500', red: 'bg-red-500',
    purple: 'bg-purple-500', yellow: 'bg-yellow-500', pink: 'bg-pink-500', indigo: 'bg-indigo-500',
    teal: 'bg-teal-500', gray: 'bg-gray-500'
  },
  backgroundLight: {
    blue: 'bg-blue-50 dark:bg-blue-900/20', green: 'bg-green-50 dark:bg-green-900/20', orange: 'bg-orange-50 dark:bg-orange-900/20',
    red: 'bg-red-50 dark:bg-red-900/20', purple: 'bg-purple-50 dark:bg-purple-900/20', yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    pink: 'bg-pink-50 dark:bg-pink-900/20', indigo: 'bg-indigo-50 dark:bg-indigo-900/20', teal: 'bg-teal-50 dark:bg-teal-900/20',
    gray: 'bg-gray-50 dark:bg-gray-900/20'
  },
  text: {
    blue: 'text-blue-500', green: 'text-green-500', orange: 'text-orange-500', red: 'text-red-500',
    purple: 'text-purple-500', yellow: 'text-yellow-500', pink: 'text-pink-500', indigo: 'text-indigo-500',
    teal: 'text-teal-500', gray: 'text-gray-500'
  },
  border: {
    blue: 'border-blue-500', green: 'border-green-500', orange: 'border-orange-500', red: 'border-red-500',
    purple: 'border-purple-500', yellow: 'border-yellow-500', pink: 'border-pink-500', indigo: 'border-indigo-500',
    teal: 'border-teal-500', gray: 'border-gray-500'
  }
};

// ✅ FIX: Create a map for priority badge classes to fix dynamic Tailwind class generation.
const PRIORITY_BADGE_MAP = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-700'
};

const PRIORITY_BADGE_MAP_DARK = { // For dark mode if needed, though current classes work
  // Example: urgent: 'dark:bg-red-900/50 dark:text-red-300'
};

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority', color: 'gray' },
  { value: 'medium', label: 'Medium Priority', color: 'blue' },
  { value: 'high', label: 'High Priority', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' }
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingNotification, setEditingNotification] = useState<AppNotification | null>(null);
  const [allUsers, setAllUsers] = useState<DocumentData[]>([]);
  const [sendTarget, setSendTarget] = useState<'all' | 'selected'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Form state
  const [type, setType] = useState<AppNotificationType>('general_update');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [targetMasterclassId, setTargetMasterclassId] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [customMetadata, setCustomMetadata] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const mcSnapshot = await getDocs(collection(db, 'MasterClasses'));
        const mcList = mcSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Masterclass));
        setMasterclasses(mcList);

        const usersSnapshot = await getDocs(collection(db, 'user_profiles'));
        const userList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(userList);

        const notifSnapshot = await getDocs(collection(db, 'notifications'));
        const notifList = notifSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
        setNotifications(notifList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-fill template when type changes
  useEffect(() => {
    const template = NOTIFICATION_TEMPLATES[type];
    if (template) {
      setTitle(template.defaultTitle);
      setMessage(template.defaultMessage);
      if (!editingNotification) { // Only reset priority if not editing
        setPriority(template.priority || 'medium');
      }
    }
  }, [type, editingNotification]);

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'sent') => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      return alert("Title and message are required.");
    }

    // If we are editing, and the user tries to send, confirm first.
    if (editingNotification && editingNotification.status === 'sent' && status === 'sent') {
      if (!window.confirm("This notification has already been sent. Resending will distribute it to all users again. Are you sure you want to proceed?")) {
        return;
      }
    } else if (editingNotification && status === 'sent') {
      if (!window.confirm("You are about to send a draft notification to all users. Are you sure?")) {
        return;
      }
    }

    const template = NOTIFICATION_TEMPLATES[type];
    if (template.fields.includes('masterclass') && !targetMasterclassId) {
      return alert("A masterclass must be selected for this notification type.");
    }

    if (sendTarget === 'selected' && selectedUserIds.length === 0) {
      return alert("Please select at least one user to send the notification to.");
    }

    setIsSending(status === 'sent');

    const metadata: any = {};
    if (discountPercent) metadata.discountPercent = parseInt(discountPercent);
    if (customMetadata) {
      try {
        Object.assign(metadata, JSON.parse(customMetadata));
      } catch (e) {
        console.error("Invalid JSON in metadata");
      }
    }

    const newNotification: any = {
      type,
      title,
      message,
      status,
      priority,
      createdAt: new Date().toISOString(),
      ctaText: template.ctaText,
      read: false
    };

    // ✅ FIX: Conditionally add metadata only if it's not empty
    if (Object.keys(metadata).length > 0) {
      newNotification.metadata = metadata;
    }

    if (targetMasterclassId) {
      newNotification.targetMasterclassId = targetMasterclassId;
      newNotification.ctaLink = `/masterclasses/${targetMasterclassId}`;
    }

    if (expiryDays && parseInt(expiryDays) > 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + parseInt(expiryDays));
      newNotification.expiresAt = expiry.toISOString();
    }

    try {
      let notificationId: string;
      let notificationData: any; // ✅ FIX: Use 'any' to avoid union type conflicts during creation

      if (editingNotification) {
        notificationId = editingNotification.id;
        notificationData = { ...newNotification, id: notificationId };
        await updateDoc(doc(db, 'notifications', notificationId), newNotification);
      } else {
        const docRef = await addDoc(collection(db, 'notifications'), newNotification);
        notificationId = docRef.id;
        notificationData = { ...newNotification, id: notificationId };
      }

      if (status === 'sent') {
        // ✅ FIX: If editing, first delete all existing copies from users before re-sending.
        if (editingNotification) {
          const usersSnapshot = await getDocs(collection(db, 'user_profiles'));
          const deletePromises = usersSnapshot.docs.map(async (userDoc) => {
            const userId = userDoc.id;
            const userNotificationsRef = collection(db, `user_profiles/${userId}/notifications`);
            const q = query(userNotificationsRef, where("sourceId", "==", editingNotification.id));
            const userNotifsSnapshot = await getDocs(q);
            
            const batch = writeBatch(db);
            userNotifsSnapshot.forEach(notifDoc => batch.delete(notifDoc.ref));
            return batch.commit();
          });
          await Promise.all(deletePromises);
        }

        // Determine target user IDs
        const targetUserIds = sendTarget === 'all' 
          ? allUsers.map(u => u.id) 
          : selectedUserIds;

        if (targetUserIds.length > 0) {
          const batch = writeBatch(db);
          targetUserIds.forEach(userId => {
            const userNotifRef = doc(collection(db, `user_profiles/${userId}/notifications`));
            // ✅ FIX: Ensure 'dismissed' field is set to false on creation for query consistency.
            batch.set(userNotifRef, { ...notificationData, sourceId: notificationId, read: false, dismissed: false });
          });
          await batch.commit();
          alert(`✅ Notification ${editingNotification ? 're-sent' : 'sent'} to ${targetUserIds.length} user(s)!`);
        }
      } else if (editingNotification) {
        alert(`✅ Notification updated and saved as draft!`);
      } else {
        alert(`✅ Notification saved as draft!`);
      }
      
      // Reset form
      setEditingNotification(null);
      setTitle('');
      setMessage('');
      setTargetMasterclassId('');
      setDiscountPercent('');
      setCustomMetadata('');
      setType('general_update');
      setPriority('medium');
      setSelectedUserIds([]);
      setSendTarget('all');

      // Refresh list
      const notifSnapshot = await getDocs(collection(db, 'notifications'));
      const notifList = notifSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(notifList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    } catch (error) {
      console.error("Error saving notification:", error);
      alert(`❌ Failed to ${editingNotification ? 'update' : 'save'} notification.`);
    } finally {
      setIsSending(false);
    }
  };

  const handleEdit = (notification: AppNotification) => {
    setEditingNotification(notification);
    setType(notification.type);
    setTitle(notification.title);
    setMessage(notification.message);
    setPriority(notification.priority || 'medium');
    setTargetMasterclassId(notification.targetMasterclassId || '');
    setExpiryDays(notification.expiresAt ? 
      Math.ceil((new Date(notification.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)).toString() : '7'
    );

    // ✅ FIX: Safely destructure metadata to separate discountPercent from the rest
    const { discountPercent, ...otherMeta } = (notification.metadata as Record<string, any>) || {};
    setDiscountPercent(discountPercent ? String(discountPercent) : '');
    setCustomMetadata(Object.keys(otherMeta).length > 0 ? JSON.stringify(otherMeta, null, 2) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllNotifications = async () => {
    if (!window.confirm("DANGER: You are about to delete ALL notifications from the system, including from every user's account. This action is irreversible. Are you sure?")) {
      return;
    }
    if (!window.confirm("FINAL CONFIRMATION: Please confirm you want to permanently delete all notifications.")) {
      return;
    }

    setIsSending(true); // Reuse loading state
    try {
      // 1. Delete all master notifications
      const masterNotifsSnapshot = await getDocs(collection(db, 'notifications'));
      const masterBatch = writeBatch(db);
      masterNotifsSnapshot.docs.forEach(doc => masterBatch.delete(doc.ref));
      await masterBatch.commit();

      // 2. Delete all user-specific notifications
      const usersSnapshot = await getDocs(collection(db, 'user_profiles'));
      const userDeletionPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const userNotificationsRef = collection(db, `user_profiles/${userId}/notifications`);
        const userNotifsSnapshot = await getDocs(userNotificationsRef);
        
        const userBatch = writeBatch(db);
        userNotifsSnapshot.forEach(notifDoc => userBatch.delete(notifDoc.ref));
        return userBatch.commit();
      });

      await Promise.all(userDeletionPromises);

      setNotifications([]); // Clear local state
      alert("✅ All notifications have been successfully cleared from the system.");
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      alert("❌ Failed to clear all notifications. Check the console for details.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!window.confirm("Are you sure you want to delete this notification? This will remove it from the main list AND from all users who have received it. This action cannot be undone.")) {
      return;
    }

    try {
      // 1. Delete the master notification
      await deleteDoc(doc(db, 'notifications', notificationId));

      // 2. Delete the fanned-out notifications from all users
      const usersSnapshot = await getDocs(collection(db, 'user_profiles'));
      const deletePromises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const userNotificationsRef = collection(db, `user_profiles/${userId}/notifications`);
        const q = query(userNotificationsRef, where("sourceId", "==", notificationId));
        const userNotifsSnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        userNotifsSnapshot.forEach(notifDoc => batch.delete(notifDoc.ref));
        return batch.commit();
      });

      await Promise.all(deletePromises);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      alert("✅ Notification deleted successfully from admin and all users.");
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("❌ Failed to delete notification.");
    }
  };

  const cancelEdit = () => setEditingNotification(null);

  const template = NOTIFICATION_TEMPLATES[type];
  const TemplateIcon = template.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-6">
      {/* Stats Bar */}
      <div className="max-w-6xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sent</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {notifications.filter(n => n.status === 'sent').length}
              </p>
            </div>
            <Send className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Drafts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {notifications.filter(n => n.status === 'draft').length}
              </p>
            </div>
            <FileText className="w-12 h-12 text-yellow-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {notifications.filter(n => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(n.createdAt) > weekAgo;
                }).length}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
        📣 Notification Center
      </h1>

      {/* Create Notification Form */}
      <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 max-w-4xl mx-auto mb-10 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 ${COLOR_MAP.background[template.color as keyof typeof COLOR_MAP.background]} rounded-xl flex items-center justify-center`}>
            <TemplateIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-grow">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {editingNotification ? 'Edit Notification' : 'Create New Notification'}
            </h2>
          </div>
          {editingNotification && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Cancel Edit"
            ><X className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
          )}
        </div>

        <form className="space-y-6">
          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(NOTIFICATION_TEMPLATES) as AppNotificationType[]).map((t) => {
                const template = NOTIFICATION_TEMPLATES[t];
                const Icon = template.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      type === t 
                        ? `${COLOR_MAP.border[template.color as keyof typeof COLOR_MAP.border]} ${COLOR_MAP.backgroundLight[template.color as keyof typeof COLOR_MAP.backgroundLight]}`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${COLOR_MAP.text[template.color as keyof typeof COLOR_MAP.text]}`} />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                      {t.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value as any)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    priority === opt.value 
                      ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700 dark:bg-${opt.color}-900/20 dark:text-${opt.color}-300` // This is safe as priority colors are limited
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Fields */}
          {template.fields.includes('masterclass') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Masterclass *
              </label>
              <select
                value={targetMasterclassId}
                onChange={(e) => setTargetMasterclassId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a masterclass...</option>
                {masterclasses.map(mc => (
                  <option key={mc.id} value={mc.id}>{mc.title}</option>
                ))}
              </select>
            </div>
          )}

          {template.fields.includes('discount') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Percentage
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="e.g., 50"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg"
              />
            </div>
          )}

          {template.fields.includes('expiry') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expires In (Days)
              </label>
              <input
                type="number"
                min="1"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg"
              rows={4}
            />
          </div>

          {/* Send Target */}
          <div className="pt-6 border-t dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient Group
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="sendTarget" 
                  value="all" 
                  checked={sendTarget === 'all'} 
                  onChange={() => setSendTarget('all')}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="text-gray-800 dark:text-gray-200">All Users</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="sendTarget" 
                  value="selected" 
                  checked={sendTarget === 'selected'} 
                  onChange={() => setSendTarget('selected')}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="text-gray-800 dark:text-gray-200">Specific Users</span>
              </label>
            </div>
          </div>

          {sendTarget === 'selected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Users ({selectedUserIds.length} selected)
              </label>
              <select
                multiple
                value={selectedUserIds}
                onChange={(e) => setSelectedUserIds(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full h-40 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t dark:border-gray-700">
            <button 
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')} 
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            > 
              {editingNotification ? 'Update Draft' : 'Save as Draft'}
            </button>
            <button 
              type="button"
              onClick={(e) => handleSubmit(e, 'sent')} 
              disabled={isSending}
              className={`flex-1 bg-gradient-to-r text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all ${editingNotification ? 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' : 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {editingNotification ? 'Update & Resend' : 'Send to All Users'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Notifications */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Recent Notifications</h2>
          <button
            onClick={handleClearAllNotifications}
            disabled={isSending}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Deletes all notifications for all users"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 10).map(n => {
              const template = NOTIFICATION_TEMPLATES[n.type];
              const Icon = template?.icon || Bell;
              return (
                <div key={n.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700 flex justify-between items-start gap-4">
                  <div className="flex gap-3 flex-1 min-w-0"> {/* Added min-w-0 for flexbox truncation */}
                    <div className={`w-10 h-10 ${COLOR_MAP.background[template?.color as keyof typeof COLOR_MAP.background || 'gray']} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white">{n.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                        {n.priority && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            PRIORITY_BADGE_MAP[n.priority] || PRIORITY_BADGE_MAP.low
                          }`}>
                            {n.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      n.status === 'sent' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                    }`}>
                      {n.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(n)} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(n.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}