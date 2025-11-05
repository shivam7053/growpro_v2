'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Play,
  User,
  Briefcase,
  Calendar,
  AlertTriangle,
  Lock,
  Users,
  IndianRupee,
  ArrowLeft,
  Search,
  Filter,
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContexts';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Masterclass {
  id: string;
  title: string;
  speaker_name: string;
  speaker_designation: string;
  youtube_url: string;
  created_at?: string;
  price: number;
  joined_users: string[];
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function MasterclassesPage() {
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [filteredMasterclasses, setFilteredMasterclasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'paid' | 'enrolled'>('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchMasterclasses();
    loadRazorpayScript();
  }, []);

  useEffect(() => {
    filterMasterclasses();
  }, [masterclasses, searchQuery, filterType, user]);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchMasterclasses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'MasterClasses'));
      const list = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        joined_users: d.data().joined_users || [],
        price: d.data().price || 0,
      })) as Masterclass[];
      setMasterclasses(list);
    } catch (error: any) {
      toast.error('Error loading masterclasses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterMasterclasses = () => {
    let filtered = [...masterclasses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (mc) =>
          mc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mc.speaker_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mc.speaker_designation.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType === 'free') {
      filtered = filtered.filter((mc) => mc.price === 0);
    } else if (filterType === 'paid') {
      filtered = filtered.filter((mc) => mc.price > 0);
    } else if (filterType === 'enrolled' && user) {
      filtered = filtered.filter((mc) => mc.joined_users.includes(user.uid));
    }

    setFilteredMasterclasses(filtered);
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? match[1] : null;
  };

  const hasUserJoined = (masterclass: Masterclass) => {
    if (!user) return false;
    return masterclass.joined_users.includes(user.uid);
  };

  const handleBuyMasterclass = async (masterclass: Masterclass) => {
    if (!user) {
      toast.error('Please login to purchase this masterclass');
      return;
    }

    if (hasUserJoined(masterclass)) {
      toast.info('You have already purchased this masterclass');
      return;
    }

    setProcessingPayment(masterclass.id);

    try {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
        amount: masterclass.price * 100,
        currency: 'INR',
        name: 'GrowPro',
        description: masterclass.title,
        image: '/logo_growpro.png',
        handler: async function (response: any) {
          try {
            // Directly update Firestore with the user ID
            const masterclassRef = doc(db, 'MasterClasses', masterclass.id);
            await updateDoc(masterclassRef, {
              joined_users: arrayUnion(user.uid),
            });

            toast.success('Payment successful! You can now access this masterclass');
            fetchMasterclasses(); // Refresh the list
            setProcessingPayment(null);
          } catch (error) {
            console.error('Error updating enrollment:', error);
            toast.error('Error processing enrollment');
            setProcessingPayment(null);
          }
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(null);
            toast.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Error initiating payment');
      setProcessingPayment(null);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7 },
  };

  const staggerChildren = {
    animate: { transition: { staggerChildren: 0.12 } },
  };

  const renderMasterclassCard = (mc: Masterclass) => {
    const videoId = getYouTubeVideoId(mc.youtube_url);
    const userJoined = hasUserJoined(mc);
    const isFree = mc.price === 0;

    return (
      <motion.div
        key={mc.id}
        variants={fadeInUp}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition overflow-hidden flex flex-col h-full"
      >
        {/* Video/Thumbnail Section */}
        <div className="aspect-video relative">
          {userJoined || isFree ? (
            videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={mc.title}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-200">
                <Play className="w-12 h-12 text-gray-400" />
              </div>
            )
          ) : (
            <div className="relative h-full bg-gradient-to-br from-gray-800 to-gray-900">
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={mc.title}
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-70 p-6 rounded-full">
                  <Lock className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Price Badge */}
          {!isFree && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-1">
              <IndianRupee className="w-4 h-4" />
              {mc.price}
            </div>
          )}

          {isFree && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
              FREE
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
            {mc.title}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{mc.speaker_name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Briefcase className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{mc.speaker_designation}</span>
            </div>
            {mc.created_at && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                {new Date(mc.created_at).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>{mc.joined_users.length} students enrolled</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto pt-4">
            {userJoined || isFree ? (
              <a
                href={mc.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold"
              >
                <Play className="w-5 h-5" />
                {isFree ? 'Watch Free' : 'Continue Learning'}
              </a>
            ) : (
              <button
                onClick={() => handleBuyMasterclass(mc)}
                disabled={processingPayment === mc.id}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingPayment === mc.id ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <IndianRupee className="w-5 h-5" />
                    Enroll Now - ₹{mc.price}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Header />

      <motion.section
        className="pt-24 pb-20"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button and Header */}
          <motion.div variants={fadeInUp} className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              All Masterclasses
            </h1>
            <p className="text-gray-600 text-lg">
              Explore our complete collection of expert-led masterclasses
            </p>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div variants={fadeInUp} className="mb-8 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, speaker, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  filterType === 'all'
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('free')}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  filterType === 'free'
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setFilterType('paid')}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  filterType === 'paid'
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Paid
              </button>
              {user && (
                <button
                  onClick={() => setFilterType('enrolled')}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    filterType === 'enrolled'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  My Courses
                </button>
              )}
            </div>
          </motion.div>

          {/* Results Count */}
          <motion.div variants={fadeInUp} className="mb-6">
            <p className="text-gray-600">
              Showing <span className="font-semibold">{filteredMasterclasses.length}</span>{' '}
              {filteredMasterclasses.length === 1 ? 'masterclass' : 'masterclasses'}
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredMasterclasses.length === 0 && (
            <motion.div variants={fadeInUp} className="text-center py-20">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No masterclasses found
              </h3>
              <p className="text-gray-600">
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No masterclasses available at the moment'}
              </p>
            </motion.div>
          )}

          {/* Masterclasses Grid */}
          {!loading && filteredMasterclasses.length > 0 && (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerChildren}
            >
              {filteredMasterclasses.map((mc) => renderMasterclassCard(mc))}
            </motion.div>
          )}
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}