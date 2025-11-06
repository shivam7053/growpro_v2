'use client';

import React, { useState } from 'react';
import {
  Play,
  User,
  Briefcase,
  Calendar,
  Lock,
  Users,
  IndianRupee,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface Masterclass {
  id: string;
  title: string;
  speaker_name: string;
  speaker_designation: string;
  youtube_url: string;
  created_at: string;
  price: number;
  joined_users: string[];
  type: 'free' | 'paid' | 'featured';
}

interface MasterclassCardProps {
  masterclass: Masterclass;
  user: any;
  onPurchaseComplete?: () => void;
}

export default function MasterclassCard({
  masterclass: mc,
  user,
  onPurchaseComplete,
}: MasterclassCardProps) {
  const [processingPayment, setProcessingPayment] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!mc || !mc.id) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center h-full">
        <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
        <p className="text-gray-600 text-center">Invalid masterclass data</p>
      </div>
    );
  }

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(mc.youtube_url);
  const userJoined = user?.uid && mc.joined_users?.includes(user.uid);
  const isFree = mc.price === 0;

  const handleBuyMasterclass = async () => {
    if (!user?.uid) {
      toast.error('Please login to enroll');
      return;
    }

    if (userJoined) {
      toast.info('Already enrolled!');
      return;
    }

    setProcessingPayment(true);
    try {
      await new Promise((res) => setTimeout(res, mc.price > 0 ? 1200 : 400));

      const ref = doc(db, 'MasterClasses', mc.id);
      await updateDoc(ref, {
        joined_users: arrayUnion(user.uid),
      });

      toast.success('Enrolled successfully!');
      onPurchaseComplete?.();
    } catch (err) {
      console.error(err);
      toast.error('Error processing enrollment');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col h-full border border-gray-100">
      {/* Thumbnail / Video Section */}
      <div className="relative aspect-video bg-gray-200 overflow-hidden">
        {/* If joined or free → show video */}
        {userJoined || isFree ? (
          videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={mc.title}
              className="w-full h-full"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Play className="w-10 h-10 mb-1" />
              <p>Video not available</p>
            </div>
          )
        ) : (
          <>
            {videoId && !imageError ? (
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={mc.title}
                className="w-full h-full object-cover brightness-75"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-300">
                <Play className="w-12 h-12 text-gray-600 opacity-60" />
              </div>
            )}

            {/* Overlay Lock */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
              <Lock className="w-10 h-10 text-white mb-2" />
              <p className="text-white font-semibold">Locked</p>
            </div>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {userJoined && (
            <div className="bg-blue-600 text-white px-3 py-1 text-sm rounded-full font-medium shadow">
              Enrolled
            </div>
          )}
          {mc.type && (
            <div className="bg-indigo-600 text-white px-3 py-1 text-sm rounded-full flex items-center gap-1">
              <Tag className="w-4 h-4" /> {mc.type}
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3">
          {isFree ? (
            <div className="bg-green-500 text-white px-4 py-1 rounded-full font-bold shadow">
              FREE
            </div>
          ) : (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-semibold shadow flex items-center gap-1">
              <IndianRupee className="w-4 h-4" />
              {mc.price}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3
          className="text-lg font-bold text-gray-900 mb-2 line-clamp-2"
          title={mc.title}
        >
          {mc.title}
        </h3>

        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" /> {mc.speaker_name}
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> {mc.speaker_designation}
          </div>
          {mc.created_at && (
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              {new Date(mc.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="w-4 h-4" /> {mc.joined_users?.length || 0} enrolled
          </div>
        </div>

        {/* Action */}
        <div className="mt-auto">
          {userJoined || isFree ? (
            mc.youtube_url ? (
              <a
                href={mc.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold"
              >
                <Play className="w-5 h-5" /> Watch Now
              </a>
            ) : (
              <button
                disabled
                className="w-full bg-gray-300 text-gray-600 px-5 py-3 rounded-lg font-semibold cursor-not-allowed"
              >
                Video Not Available
              </button>
            )
          ) : (
            <button
              onClick={handleBuyMasterclass}
              disabled={processingPayment || !user}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold disabled:opacity-60"
            >
              {processingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <IndianRupee className="w-5 h-5" /> Enroll Now - ₹{mc.price}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
