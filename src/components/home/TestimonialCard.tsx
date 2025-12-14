import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  quote: string;
  description: string;
  points: string[];
  image: string;
}

interface Props {
  testimonial: Testimonial;
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (index: number) => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
};

export default function TestimonialCard({
  testimonial,
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  onDotClick,
}: Props) {
  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      variants={fadeInUp}
      transition={{ duration: 0.7 }}
      className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-4xl mx-auto border border-gray-200 dark:border-gray-700"
    >
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <img
          src={testimonial.image}
          alt="Success story"
          className="w-full h-64 object-cover rounded-xl shadow-md"
        />
        <div>
          <blockquote className="text-2xl text-blue-600 dark:text-blue-400 font-semibold mb-4 leading-snug">
            "{testimonial.quote}"
          </blockquote>
          <p className="text-gray-800 dark:text-gray-300 mb-3 font-medium">
            {testimonial.description}
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-400 mb-6">
            {testimonial.points.map((point, i) => (
              <li key={i}>• {point}</li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <button
              onClick={onPrev}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800 dark:text-gray-100" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => onDotClick(i)}
                  className={`w-3 h-3 rounded-full transition ${
                    i === currentIndex
                      ? "bg-black dark:bg-white"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={onNext}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronRight className="w-5 h-5 text-gray-800 dark:text-gray-100" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
