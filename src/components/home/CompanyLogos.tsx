"use client";

import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7 },
  },
};

const companies = [
  { src: "/l-t.png", alt: "L&T", className: "h-12" },
  { src: "/walmart.png", alt: "Walmart", className: "h-8" },
  { src: "/tata.png", alt: "Tata", className: "h-10" },
  { src: "/amazon.png", alt: "Amazon", className: "h-8" },
  { src: "/samsung.png", alt: "Samsung", className: "h-8" },
  { src: "/itc.png", alt: "ITC", className: "h-10" },
];

export default function CompanyLogos() {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="flex justify-center flex-wrap gap-8 mb-16 opacity-80"
    >
      {companies.map((company, index) => (
        <motion.img
          key={index}
          src={company.src}
          alt={company.alt}
          className={`${company.className} transition-transform duration-300 hover:scale-105 dark:opacity-90`}
          whileHover={{ scale: 1.05 }}
        />
      ))}
    </motion.div>
  );
}
