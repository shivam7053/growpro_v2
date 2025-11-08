"use client";

import { motion, Variants } from "framer-motion";
import { Star, Quote } from "lucide-react";

const feedbacks = [
  {
    name: "Rahul Verma",
    role: "Software Engineer at Google",
    image:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400",
    feedback:
      "GrowPro's resume workshop completely transformed my job search. I went from getting zero responses to landing interviews at 5 FAANG companies. The personalized feedback was invaluable!",
    rating: 5,
    course: "Resume Mastery Workshop",
  },
  {
    name: "Ananya Singh",
    role: "Product Manager at Amazon",
    image:
      "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400",
    feedback:
      "The interview preparation masterclass gave me the confidence I needed. The mock interviews and real-time feedback helped me ace my Amazon PM interview. Highly recommend!",
    rating: 5,
    course: "Interview Prep Masterclass",
  },
  {
    name: "Vikram Patel",
    role: "Data Scientist at Microsoft",
    image:
      "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400",
    feedback:
      "I was stuck in my career for 3 years. The career transition workshop helped me identify my strengths and pivot into data science. Now I'm working at my dream company!",
    rating: 5,
    course: "Career Transition Program",
  },
  {
    name: "Sneha Reddy",
    role: "UX Designer at Adobe",
    image:
      "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=400",
    feedback:
      "The LinkedIn optimization course was a game-changer. Within 2 weeks of implementing the strategies, I had 10+ recruiters reaching out. Best investment in my career!",
    rating: 5,
    course: "LinkedIn Optimization",
  },
  {
    name: "Arjun Mehta",
    role: "Full Stack Developer at Netflix",
    image:
      "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400",
    feedback:
      "As a fresher, I had no idea how to negotiate salary. This workshop taught me techniques that helped me negotiate 40% higher than the initial offer. Absolutely worth it!",
    rating: 5,
    course: "Salary Negotiation Secrets",
  },
  {
    name: "Priyanka Joshi",
    role: "HR Manager at Deloitte",
    image:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400",
    feedback:
      "The workshops are led by actual industry professionals, not just career coaches. The insider knowledge and real-world examples made all the difference in my job search strategy.",
    rating: 5,
    course: "Job Search Strategy",
  },
];

// ✅ Properly typed motion variants
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7 },
  },
};

const staggerChildren: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function StudentFeedback() {
  return (
    <motion.section
      className="py-20 bg-white dark:bg-gray-900 relative z-10"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      variants={staggerChildren}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
            <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400 fill-current" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-3 text-gray-900 dark:text-white">
            Success Stories from Our Students
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
            Join 10,000+ professionals who transformed their careers with GrowPro
          </p>
        </motion.div>

        <motion.div
          variants={staggerChildren}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {feedbacks.map((feedback, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-850 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-16 h-16 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="p-6 relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={feedback.image}
                      alt={feedback.name}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-white dark:ring-gray-700 shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {feedback.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feedback.role}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {[...Array(feedback.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-500 fill-current"
                    />
                  ))}
                </div>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 line-clamp-5">
                  "{feedback.feedback}"
                </p>

                <div className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {feedback.course}
                  </span>
                </div>
              </div>

              <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { number: "10,000+", label: "Students Enrolled" },
            { number: "95%", label: "Success Rate" },
            { number: "50+", label: "Expert Instructors" },
            { number: "4.9/5", label: "Average Rating" },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="text-3xl lg:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
