"use client";

import { motion } from "framer-motion";
import { Users, Target, Award, Rocket, BookOpen } from "lucide-react";

const team = [
  { name: "Nupur Gaba", role: "Founder & CEO", image: "/nupur.jpg" },
  { name: "Harshit", role: "Curriculum Director", image: "/harshit.jpg" },
];

const features = [
  {
    icon: <BookOpen className="w-8 h-8 text-blue-500" />,
    title: "Expert-Led Courses",
    desc: "Learn directly from top mentors with real-world experience and insights.",
  },
  {
    icon: <Rocket className="w-8 h-8 text-blue-500" />,
    title: "Hands-On Learning",
    desc: "Our courses are project-based — you learn by doing, not just watching.",
  },
  {
    icon: <Award className="w-8 h-8 text-blue-500" />,
    title: "Career Growth",
    desc: "Get certified, build your portfolio, and stand out to top recruiters.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100">
      {/* 🎬 Hero Section */}
      <section className="relative flex flex-col justify-center items-center text-center py-24 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-bold mb-4"
        >
          About <span className="text-blue-500">GrowPro</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg max-w-2xl text-gray-600 dark:text-gray-300"
        >
          Empowering learners to grow, upskill, and achieve their professional dreams
          through interactive, expert-led masterclasses.
        </motion.p>
      </section>

      {/* 🧭 Mission & Vision Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Our Mission & Vision</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="p-8 rounded-2xl shadow-lg bg-white dark:bg-gray-800"
            >
              <Target className="w-12 h-12 text-blue-500 mb-4 mx-auto" />
              <h3 className="text-2xl font-semibold mb-2">Our Mission</h3>
              <p className="text-gray-600 dark:text-gray-300">
                To make world-class learning accessible, affordable, and outcome-driven
                for everyone, everywhere.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="p-8 rounded-2xl shadow-lg bg-white dark:bg-gray-800"
            >
              <Users className="w-12 h-12 text-blue-500 mb-4 mx-auto" />
              <h3 className="text-2xl font-semibold mb-2">Our Vision</h3>
              <p className="text-gray-600 dark:text-gray-300">
                To create the next generation of global professionals by bridging
                the gap between academic learning and real-world application.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 👥 Team Section */}
      <section className="py-20 px-6">
  <div className="max-w-6xl mx-auto text-center">
    <h2 className="text-3xl font-bold mb-12 text-gray-900 dark:text-white">
      Meet Our Team
    </h2>

    {/* ✅ Centered Grid */}
    <div
      className="grid sm:grid-cols-2 md:grid-cols-3 gap-10 justify-center place-items-center"
    >
      {team.map((member, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-72"
        >
          <div className="w-full h-60 bg-gray-200 dark:bg-gray-700">
            <img
              src={member.image}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {member.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {member.role}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</section>


      {/* 🚀 Why Choose Us */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Why Choose GrowPro?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="p-8 rounded-2xl shadow-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                <div className="flex justify-center mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
