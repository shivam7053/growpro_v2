"use client";

import { motion, Variants } from "framer-motion";

const teachers = [
  {
    name: "Dr. Sarah Chen",
    designation: "Ex-Google Tech Lead",
    image:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "Michael Rodriguez",
    designation: "Amazon Senior Manager",
    image:
      "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "Priya Sharma",
    designation: "Microsoft HR Director",
    image:
      "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "James Anderson",
    designation: "Meta Product Manager",
    image:
      "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "Aisha Patel",
    designation: "Netflix Engineering Lead",
    image:
      "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "David Kim",
    designation: "Apple Design Director",
    image:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "Emma Thompson",
    designation: "Tesla Talent Acquisition",
    image:
      "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

// ✅ Properly typed variant for motion
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7 },
  },
};

export default function TeachersCarousel() {
  // Double the array for seamless infinite scroll
  const doubledTeachers = [...teachers, ...teachers];

  return (
    <motion.section
      className="py-20 bg-white dark:bg-gray-900 relative z-10 overflow-hidden"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-12">
        <motion.div variants={fadeInUp} className="text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-3 text-gray-900 dark:text-white">
            Learn from Industry Experts
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
            Our instructors are leaders from top tech companies worldwide
          </p>
        </motion.div>
      </div>

      {/* Infinite Scrolling Container */}
      <div className="relative">
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-8"
            animate={{
              x: [0, -1920], // Adjust based on card width * number of original items
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
          >
            {doubledTeachers.map((teacher, index) => (
              <div key={index} className="flex-shrink-0 w-64 group">
                <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105">
                  <img
                    src={teacher.image}
                    alt={teacher.name}
                    className="w-64 h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-1">{teacher.name}</h3>
                    <p className="text-sm text-gray-200 font-medium">
                      {teacher.designation}
                    </p>
                  </div>
                  {/* Hover Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Gradient Overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
      </div>
    </motion.section>
  );
}
