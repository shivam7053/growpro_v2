'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContexts';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MasterclassCard from '@/components/masterclassCard';

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

export default function HomePage() {
  // ✅ Testimonials
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const testimonials = [
    {
      quote: "I finally understood what my resume was missing.",
      description: "An experienced job seeker kept facing rejection. They:",
      points: [
        "Attended multiple resume workshops via the platform.",
        // "Used the AI resume screening to fix their CV.",
        "Cracked an interview after applying learnings.",
      ],
      image:
        "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      quote: "The workshops changed my entire approach to job hunting.",
      description: "A recent graduate struggled to get interviews. They:",
      points: [
        "Learned industry-specific skills from HR professionals.",
        "Built a network of mentors and peers.",
        "Landed their dream job at a Fortune 500 company.",
      ],
      image:
        "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
  ];

  const nextTestimonial = () =>
    setCurrentTestimonial((p) => (p + 1) % testimonials.length);
  const prevTestimonial = () =>
    setCurrentTestimonial((p) => (p - 1 + testimonials.length) % testimonials.length);

  // ✅ Masterclass Section
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchMasterclasses();
  }, []);

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

  const nextSlide = () => {
    setCurrentSlide((prev) => 
      prev >= Math.min(masterclasses.length - 1, 3) ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => 
      prev <= 0 ? Math.min(masterclasses.length - 1, 3) : prev - 1
    );
  };

  const displayedMasterclasses = masterclasses.slice(0, 4);

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7 },
  };

  const staggerChildren = {
    animate: { transition: { staggerChildren: 0.12 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 overflow-hidden relative">
      {/* Moving Gradient Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-200 via-pink-100 to-purple-200 opacity-30 blur-3xl"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 15,
          ease: 'linear',
          repeat: Infinity,
        }}
      />

      <Header />

      {/* Hero Section */}
      <motion.section
        className="pt-24 pb-20 bg-white relative z-10"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Tagline */}
          <motion.div variants={fadeInUp} className="text-center mb-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              WE HELP YOU CRACK YOUR DREAM JOB!
            </h1>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Link
                href="/global-opportunities"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-full font-medium transition-all duration-300 hover:scale-105"
              >
                Global Remote Opportunities
              </Link>
              <Link
                href="/masterclasses"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-full font-medium transition-all duration-300 hover:scale-105"
              >
                Master Classes
              </Link>
            </div>
          </motion.div>

          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div variants={fadeInUp}>
              <img
                src="/1stpage.png"
                alt="Professional with laptop celebrating success"
                className="w-full h-auto rounded-2xl"
              />
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Your Dream Job Awaits!
              </h2>

              <div className="space-y-6">
                {[
                  {
                    title:
                      'Join 10,000+ job seekers who leveled up their careers',
                    desc: "Join a thriving community that's successfully finding their dream jobs",
                  },
                  {
                    title:
                      'Get your resume screened, find the perfect job, and attend workshops',
                    desc: 'We offer a complete suite of services to help you land your dream job',
                  },
                  {
                    title: 'Personalised career support tailored for you',
                    desc: "Get guidance that's specifically designed to meet your unique career goals",
                  },
                ].map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4"
                  >
                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {step.title}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/signup"
                className="w-full bg-black text-white py-4 rounded-full font-semibold hover:bg-gray-800 transition-all duration-300 hover:scale-105 inline-flex items-center justify-center space-x-2 mt-8"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Masterclass Section */}
      <motion.section
        className="py-20 bg-white relative z-10"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerChildren}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                Featured Masterclasses
              </h2>
              <p className="text-gray-600 text-lg">
                Learn from industry experts and unlock your career potential
              </p>
            </div>
            <Link
              href="/masterclasses"
              className="hidden md:inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
            >
              View All
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          )}

          {!loading && masterclasses.length === 0 && (
            <div className="text-center text-gray-600 py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>No masterclasses available at the moment.</p>
            </div>
          )}

          {!loading && displayedMasterclasses.length > 0 && (
            <motion.div variants={fadeInUp} className="relative">
              {/* Slider Container */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {displayedMasterclasses.map((mc) => (
                    <div key={mc.id} className="w-full flex-shrink-0 px-2">
                      <MasterclassCard
                        masterclass={mc}
                        user={user}
                        onPurchaseComplete={fetchMasterclasses}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              {displayedMasterclasses.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {displayedMasterclasses.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {displayedMasterclasses.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition ${
                        index === currentSlide ? 'bg-black' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Mobile View All Button */}
          <Link
            href="/masterclasses"
            className="md:hidden w-full inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition mt-8"
          >
            View All Masterclasses
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.section>

      {/* Employer Logos and Workshop Promotion */}
      <motion.section
        className="py-20 bg-gray-50 relative z-10"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerChildren}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8 max-w-5xl mx-auto">
              Gain Insider Knowledge – Attend Workshops Led by the Hiring Managers, Recruiters, and Professionals Shaping the Future of Work.
            </h2>
          </motion.div>

          {/* Company Logos */}
          <motion.div variants={fadeInUp} className="flex justify-center items-center space-x-12 mb-16 flex-wrap gap-8">
            <div className="text-3xl font-bold text-red-500">M</div>
            <img src="/l-t.png" alt="L&T" className="h-12 w-auto" />
            <img src="/walmart.png" alt="Walmart" className="h-8 w-auto" />
            <img src="/tata.png" alt="Tata" className="h-12 w-auto" />
            <img src="/amazon.png" alt="Amazon" className="h-8 w-auto" />
            <img src="/samsung.png" alt="Samsung" className="h-8 w-auto" />
            <img src="/itc.png" alt="ITC" className="h-12 w-auto" />
          </motion.div>

          {/* Testimonial Carousel */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <img
                src={testimonials[currentTestimonial].image}
                alt="Success story"
                className="w-full h-64 object-cover rounded-xl"
              />
              <div>
                <blockquote className="text-2xl text-red-500 font-semibold mb-4">
                  "{testimonials[currentTestimonial].quote}"
                </blockquote>
                <p className="text-gray-700 mb-4">
                  {testimonials[currentTestimonial].description}
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  {testimonials[currentTestimonial].points.map((p, i) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>

                <div className="flex items-center gap-4">
                  <button
                    onClick={prevTestimonial}
                    className="p-2 bg-gray-100 rounded-full shadow hover:bg-gray-200"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex gap-2">
                    {testimonials.map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i === currentTestimonial
                            ? 'bg-black'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={nextTestimonial}
                    className="p-2 bg-gray-100 rounded-full shadow hover:bg-gray-200"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer CTA */}
      <motion.section
        className="py-20 bg-black text-white relative z-10"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerChildren}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold mb-6">
            Ready to Transform Your Career?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-gray-300 mb-8">
            Join thousands of professionals who have already accelerated their careers with GrowPro
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link
              href="/signup"
              className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 inline-flex items-center space-x-2"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

  
    </div>
  );
}