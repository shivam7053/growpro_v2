// components/NotificationCard.tsx

import React from 'react';
import { 
  Bell, Sparkles, Tag, Clock, CheckCircle, Video, 
  PlayCircle, Award, DollarSign, AlertTriangle, User, 
  Zap, MessageSquare, FileText, Gift, ArrowRight, X 
} from 'lucide-react';
import { AppNotification } from '@/types/masterclass';

const ICON_MAP = {
  Bell, Sparkles, Tag, Clock, CheckCircle, Video,
  PlayCircle, Award, DollarSign, AlertTriangle, User,
  Zap, MessageSquare, FileText, Gift
};

const COLOR_CLASSES = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'bg-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: 'bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
    icon: 'bg-pink-500',
    text: 'text-pink-600 dark:text-pink-400',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300'
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    icon: 'bg-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'bg-gray-500',
    text: 'text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
};

const PRIORITY_BADGES = {
  low: { label: 'Info', classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  medium: { label: 'Update', classes: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' },
  high: { label: 'Important', classes: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400' },
  urgent: { label: 'Urgent', classes: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 animate-pulse' }
};

interface NotificationCardProps {
  notification: AppNotification;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onClick?: () => void;
}

export default function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  onDismiss, 
  onClick 
}: NotificationCardProps) {
  const config = {
    new_masterclass: { icon: 'Sparkles', color: 'blue' },
    discount: { icon: 'Tag', color: 'green' },
    general_update: { icon: 'Bell', color: 'gray' },
    masterclass_reminder: { icon: 'Clock', color: 'orange' },
    enrollment_confirmation: { icon: 'CheckCircle', color: 'green' },
    class_started: { icon: 'Video', color: 'red' },
    class_recording: { icon: 'PlayCircle', color: 'purple' },
    achievement: { icon: 'Award', color: 'yellow' },
    payment_success: { icon: 'DollarSign', color: 'green' },
    payment_failed: { icon: 'AlertTriangle', color: 'red' },
    profile_update: { icon: 'User', color: 'blue' },
    new_feature: { icon: 'Zap', color: 'indigo' },
    feedback_request: { icon: 'MessageSquare', color: 'teal' },
    certificate_ready: { icon: 'FileText', color: 'purple' },
    special_offer: { icon: 'Gift', color: 'pink' }
  }[notification.type] || { icon: 'Bell', color: 'gray' };

  const Icon = ICON_MAP[config.icon as keyof typeof ICON_MAP];
  const colors = COLOR_CLASSES[config.color as keyof typeof COLOR_CLASSES];
  const priority = notification.priority || 'medium';
  const priorityBadge = PRIORITY_BADGES[priority];

  // ✅ FIX: Type-safe metadata access
  const metadata = notification.metadata as Record<string, any> | undefined;
  const discountPercent = metadata?.discountPercent as number | undefined;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div 
      className={`relative border-l-4 ${colors.border} transition-all duration-300 hover:shadow-lg group cursor-pointer bg-white dark:bg-gray-800 rounded-r-xl overflow-hidden`}
      onClick={onClick}
    >
      <div className={`p-4 ${!notification.read ? colors.bg : ''}`}>
        <div className="flex gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 ${colors.icon} rounded-full flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                {notification.title}
              </h4>
              {!notification.read && (
                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {notification.message}
            </p>

            {/* Metadata badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityBadge.classes}`}>
                {priorityBadge.label}
              </span>
              
              {notification.expiresAt && (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires {new Date(notification.expiresAt).toLocaleDateString()}
                </span>
              )}

              {/* ✅ FIX: Use type-safe metadata access */}
              {discountPercent && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 font-bold">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatTime(notification.createdAt)}
              </span>

              <div className="flex items-center gap-2">
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead?.(notification.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                  >
                    Mark as read
                  </button>
                )}

                {notification.ctaLink && (
                  <button
                    className={`flex items-center gap-1 text-xs font-semibold ${colors.text} hover:underline`}
                  >
                    {notification.ctaText || 'View'}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notification.id);
              }}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}