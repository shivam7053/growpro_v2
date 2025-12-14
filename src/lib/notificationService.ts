// lib/notificationService.ts
// Utility service for automated notifications

import { db } from '@/lib/firebase';
import { collection, addDoc, writeBatch, doc, getDocs, query, where } from 'firebase/firestore';
import { AppNotification, AppNotificationType } from '@/types/masterclass';

interface NotificationPayload {
  type: AppNotificationType;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  targetMasterclassId?: string;
  ctaLink?: string;
  ctaText?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

interface NotificationRecipient {
  userId: string;
  email?: string;
  customData?: Record<string, any>;
}

export class NotificationService {
  /**
   * Send notification to specific users
   */
  static async sendToUsers(
    payload: NotificationPayload,
    recipients: NotificationRecipient[]
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // Create master notification record
      const masterNotification = {
        ...payload,
        status: 'sent' as const,
        createdAt: new Date().toISOString(),
        read: false
      };

      const docRef = await addDoc(collection(db, 'notifications'), masterNotification);

      // Send to individual users
      const batch = writeBatch(db);
      recipients.forEach(recipient => {
        const userNotifRef = doc(
          collection(db, `user_profiles/${recipient.userId}/notifications`)
        );
        batch.set(userNotifRef, {
          ...masterNotification,
          read: false,
          recipientMetadata: recipient.customData
        });
      });

      await batch.commit();

      return { success: true, notificationId: docRef.id };
    } catch (error) {
      console.error('Error sending notifications:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send notification to all users
   */
  static async sendToAllUsers(
    payload: NotificationPayload
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const userProfilesSnapshot = await getDocs(collection(db, 'user_profiles'));
      const recipients = userProfilesSnapshot.docs.map(doc => ({ userId: doc.id }));

      await this.sendToUsers(payload, recipients);

      return { success: true, count: recipients.length };
    } catch (error) {
      console.error('Error sending to all users:', error);
      return { success: false, count: 0, error: String(error) };
    }
  }

  /**
   * Send notification to enrolled users of a specific masterclass
   */
  static async sendToEnrolledUsers(
    masterclassId: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Get users who have enrolled in this masterclass
      const userProfilesSnapshot = await getDocs(collection(db, 'user_profiles'));
      const enrolledUsers: NotificationRecipient[] = [];

      for (const userDoc of userProfilesSnapshot.docs) {
        const userData = userDoc.data();
        // Check if user has purchased this masterclass
        if (userData.transactions?.some((t: any) => 
          t.masterclassId === masterclassId && t.status === 'success'
        )) {
          enrolledUsers.push({
            userId: userDoc.id,
            email: userData.email
          });
        }
      }

      if (enrolledUsers.length === 0) {
        return { success: true, count: 0 };
      }

      await this.sendToUsers(payload, enrolledUsers);

      return { success: true, count: enrolledUsers.length };
    } catch (error) {
      console.error('Error sending to enrolled users:', error);
      return { success: false, count: 0, error: String(error) };
    }
  }

  /**
   * Automated: Send class reminder 24 hours before
   */
  static async sendClassReminder24h(
    masterclassId: string,
    masterclassTitle: string,
    speakerName: string,
    scheduledDate: string
  ) {
    const payload: NotificationPayload = {
      type: 'masterclass_reminder',
      title: '⏰ Class Tomorrow!',
      message: `Your masterclass "${masterclassTitle}" with ${speakerName} starts tomorrow. Don't forget to join!`,
      priority: 'high',
      targetMasterclassId: masterclassId,
      ctaLink: `/masterclasses/${masterclassId}`,
      ctaText: 'View Details',
      metadata: {
        scheduledDate,
        speakerName,
        timeUntilStart: '24 hours'
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    return this.sendToEnrolledUsers(masterclassId, payload);
  }

  /**
   * Automated: Send class reminder 30 minutes before
   */
  static async sendClassReminder30min(
    masterclassId: string,
    masterclassTitle: string,
    speakerName: string
  ) {
    const payload: NotificationPayload = {
      type: 'masterclass_reminder',
      title: '🔔 Starting in 30 Minutes!',
      message: `Your class "${masterclassTitle}" is starting soon. Get ready!`,
      priority: 'urgent',
      targetMasterclassId: masterclassId,
      ctaLink: `/masterclasses/${masterclassId}`,
      ctaText: 'Join Now',
      metadata: {
        speakerName,
        timeUntilStart: '30 minutes'
      },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };

    return this.sendToEnrolledUsers(masterclassId, payload);
  }

  /**
   * Automated: Class has started notification
   */
  static async sendClassStarted(
    masterclassId: string,
    masterclassTitle: string,
    liveUrl: string,
    speakerName: string
  ) {
    const payload: NotificationPayload = {
      type: 'class_started',
      title: '🔴 Your Class is LIVE!',
      message: `"${masterclassTitle}" has started. Join now to not miss out!`,
      priority: 'urgent',
      targetMasterclassId: masterclassId,
      ctaLink: liveUrl,
      ctaText: 'Join Live Session',
      metadata: {
        liveUrl,
        speakerName
      },
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    };

    return this.sendToEnrolledUsers(masterclassId, payload);
  }

  /**
   * Automated: Recording available notification
   */
  static async sendRecordingAvailable(
    masterclassId: string,
    masterclassTitle: string,
    recordingUrl: string,
    duration: string
  ) {
    const payload: NotificationPayload = {
      type: 'class_recording',
      title: '📹 Recording Available',
      message: `The recording of "${masterclassTitle}" is now ready to watch anytime.`,
      priority: 'medium',
      targetMasterclassId: masterclassId,
      ctaLink: recordingUrl,
      ctaText: 'Watch Recording',
      metadata: {
        recordingUrl,
        duration
      }
    };

    return this.sendToEnrolledUsers(masterclassId, payload);
  }

  /**
   * Automated: Enrollment confirmation
   */
  static async sendEnrollmentConfirmation(
    userId: string,
    masterclassId: string,
    masterclassTitle: string,
    price: number
  ) {
    const payload: NotificationPayload = {
      type: 'enrollment_confirmation',
      title: '✅ Enrollment Successful!',
      message: `You're now enrolled in "${masterclassTitle}". Start learning right away!`,
      priority: 'medium',
      targetMasterclassId: masterclassId,
      ctaLink: `/masterclasses/${masterclassId}`,
      ctaText: 'Start Learning',
      metadata: {
        enrollmentDate: new Date().toISOString(),
        price
      }
    };

    return this.sendToUsers(payload, [{ userId }]);
  }

  /**
   * Automated: Payment success notification
   */
  static async sendPaymentSuccess(
    userId: string,
    amount: number,
    transactionId: string,
    masterclassTitle: string,
    masterclassId?: string
  ) {
    const payload: NotificationPayload = {
      type: 'payment_success',
      title: '✅ Payment Successful',
      message: `Your payment of ₹${amount} for "${masterclassTitle}" was successful.`,
      priority: 'medium',
      targetMasterclassId: masterclassId,
      ctaLink: masterclassId ? `/masterclasses/${masterclassId}` : '/profile',
      ctaText: 'View Details',
      metadata: {
        amount,
        transactionId,
        masterclassTitle
      }
    };

    return this.sendToUsers(payload, [{ userId }]);
  }

  /**
   * Automated: Payment failed notification
   */
  static async sendPaymentFailed(
    userId: string,
    amount: number,
    masterclassTitle: string,
    failureReason?: string
  ) {
    const payload: NotificationPayload = {
      type: 'payment_failed',
      title: '⚠️ Payment Failed',
      message: `Your payment of ₹${amount} for "${masterclassTitle}" failed. ${failureReason || 'Please try again.'}`,
      priority: 'high',
      ctaLink: '/profile',
      ctaText: 'Retry Payment',
      metadata: {
        amount,
        masterclassTitle,
        failureReason
      }
    };

    return this.sendToUsers(payload, [{ userId }]);
  }

  /**
   * Automated: Achievement unlocked
   */
  static async sendAchievement(
    userId: string,
    achievementName: string,
    achievementType: 'completion' | 'milestone' | 'certificate' | 'streak',
    description: string,
    badgeUrl?: string
  ) {
    const payload: NotificationPayload = {
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      message: `Congratulations! You've earned: ${achievementName}`,
      priority: 'medium',
      ctaLink: '/profile',
      ctaText: 'View Achievement',
      metadata: {
        achievementType,
        achievementName,
        badgeUrl,
        description
      }
    };

    return this.sendToUsers(payload, [{ userId }]);
  }

  /**
   * Automated: Certificate ready notification
   */
  static async sendCertificateReady(
    userId: string,
    masterclassId: string,
    masterclassTitle: string,
    certificateUrl: string
  ) {
    const payload: NotificationPayload = {
      type: 'certificate_ready',
      title: '🎓 Certificate Ready!',
      message: `Your certificate for "${masterclassTitle}" is ready to download.`,
      priority: 'medium',
      targetMasterclassId: masterclassId,
      ctaLink: certificateUrl,
      ctaText: 'Download Certificate',
      metadata: {
        certificateUrl,
        completionDate: new Date().toISOString()
      }
    };

    return this.sendToUsers(payload, [{ userId }]);
  }

  /**
   * Automated: Feedback request
   */
  static async sendFeedbackRequest(
    masterclassId: string,
    masterclassTitle: string,
    surveyUrl: string,
    incentive?: string
  ) {
    const payload: NotificationPayload = {
      type: 'feedback_request',
      title: '💬 We Value Your Feedback',
      message: `How was "${masterclassTitle}"? Help us improve by sharing your experience.`,
      priority: 'low',
      targetMasterclassId: masterclassId,
      ctaLink: surveyUrl,
      ctaText: 'Give Feedback',
      metadata: {
        attendedDate: new Date().toISOString(),
        surveyUrl,
        incentive
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    return this.sendToEnrolledUsers(masterclassId, payload);
  }

  /**
   * Schedule automated reminders for upcoming masterclasses
   * This should be called by a cron job or cloud function
   */
  static async scheduleClassReminders(
    masterclassId: string,
    masterclassTitle: string,
    speakerName: string,
    scheduledDateTime: Date
  ) {
    const now = new Date();
    const timeUntilClass = scheduledDateTime.getTime() - now.getTime();
    const hoursUntilClass = timeUntilClass / (1000 * 60 * 60);

    // Send 24h reminder if class is more than 24h away
    if (hoursUntilClass > 24 && hoursUntilClass <= 25) {
      await this.sendClassReminder24h(
        masterclassId,
        masterclassTitle,
        speakerName,
        scheduledDateTime.toISOString()
      );
    }

    // Send 30min reminder if class is starting soon
    if (hoursUntilClass > 0.5 && hoursUntilClass <= 0.6) {
      await this.sendClassReminder30min(
        masterclassId,
        masterclassTitle,
        speakerName
      );
    }

    // Send "class started" if it just began
    if (hoursUntilClass >= -0.1 && hoursUntilClass <= 0.1) {
      await this.sendClassStarted(
        masterclassId,
        masterclassTitle,
        `/masterclasses/${masterclassId}`,
        speakerName
      );
    }
  }
}

// Example usage in your payment success handler:
/*
import { NotificationService } from '@/lib/notificationService';

// After successful payment
await NotificationService.sendPaymentSuccess(
  userId,
  amount,
  transactionId,
  masterclassTitle,
  masterclassId
);

await NotificationService.sendEnrollmentConfirmation(
  userId,
  masterclassId,
  masterclassTitle,
  amount
);
*/

// Example usage for scheduled jobs (Cloud Functions or cron):
/*
// Run this every hour to check for upcoming classes
export async function checkUpcomingClasses() {
  const masterclasses = await getDocs(collection(db, 'MasterClasses'));
  
  for (const mc of masterclasses.docs) {
    const data = mc.data();
    if (data.content && Array.isArray(data.content)) {
      for (const content of data.content) {
        if (content.scheduled_date) {
          await NotificationService.scheduleClassReminders(
            mc.id,
            data.title,
            data.speaker_name,
            new Date(content.scheduled_date)
          );
        }
      }
    }
  }
}
*/