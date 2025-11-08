import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CompanyLogos from "./CompanyLogos";
import TestimonialCard from "./TestimonialCard";

// Define variants without transition
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.12 } },
};

const testimonials = [
  {
    quote: "I finally understood what my resume was missing.",
    description: "An experienced job seeker kept facing rejection. They:",
    points: [
      "Attended multiple resume workshops via the platform.",
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

export default function WorkshopsTestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const nextTestimonial = () =>
    setCurrentTestimonial((p) => (p + 1) % testimonials.length);

  const prevTestimonial = () =>
    setCurrentTestimonial((p) => (p - 1 + testimonials.length) % testimonials.length);

  return (
    <motion.section
      className="py-20 bg-white dark:bg-gray-900 relative z-10"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      variants={staggerChildren}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.h2
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
          transition={{ duration: 0.7 }}
          className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-12 leading-tight"
        >
          Gain Insider Knowledge – Attend Workshops Led by Recruiters,
          Hiring Managers & Industry Leaders.
        </motion.h2>

        <CompanyLogos />

        <TestimonialCard
          testimonial={testimonials[currentTestimonial]}
          currentIndex={currentTestimonial}
          totalCount={testimonials.length}
          onPrev={prevTestimonial}
          onNext={nextTestimonial}
          onDotClick={setCurrentTestimonial}
        />
      </div>
    </motion.section>
  );
}
