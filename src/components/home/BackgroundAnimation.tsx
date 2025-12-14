import { motion } from "framer-motion";

export default function BackgroundAnimation() {
  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-blue-300 via-purple-200 to-pink-200 
                 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 opacity-30 blur-3xl"
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 15,
        ease: "linear",
        repeat: Infinity,
      }}
    />
  );
}