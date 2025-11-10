'use client';

import { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContexts';

// Animation Variants
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerChildren: Variants = {
  animate: { transition: { staggerChildren: 0.15 } },
};

// Interface for Checkpoints
interface Checkpoint {
  id: string;
  title: string;
  category: string;
  selection_count: number;
}

export default function AchievementGoals() {
  const { user } = useAuth();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch checkpoints
  const fetchCheckpoints = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'Checkpoints'));
      const list: Checkpoint[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title || '',
          category: data.category || 'General',
          selection_count: data.selection_count || 0,
        });
      });
      setCheckpoints(list);
    } catch (err) {
      console.error('Error fetching checkpoints:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's selected checkpoints
  const fetchUserSelections = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'user_profiles', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const selectedIds = data.selectedCheckpoints || [];
        setSelected(selectedIds);
      } else {
        await setDoc(userRef, { selectedCheckpoints: [] });
      }
    } catch (err) {
      console.error('Error fetching user selections:', err);
    }
  };

  useEffect(() => {
    fetchCheckpoints();
  }, []);

  useEffect(() => {
    fetchUserSelections();
  }, [user]);

  // Handle selection of checkpoint
  const handleSelect = async (checkpoint: Checkpoint) => {
    if (!user) return alert('Please log in first');

    const userRef = doc(db, 'user_profiles', user.uid);
    const checkpointRef = doc(db, 'Checkpoints', checkpoint.id);
    const isSelected = selected.includes(checkpoint.id);

    try {
      let newSelected;
      if (isSelected) {
        newSelected = selected.filter((id) => id !== checkpoint.id);
        setSelected(newSelected);
        await Promise.all([
          updateDoc(userRef, { selectedCheckpoints: newSelected }),
          updateDoc(checkpointRef, { selection_count: increment(-1) }),
        ]);
      } else {
        newSelected = [...selected, checkpoint.id];
        setSelected(newSelected);
        await Promise.all([
          updateDoc(userRef, { selectedCheckpoints: newSelected }),
          updateDoc(checkpointRef, { selection_count: increment(1) }),
        ]);
      }
    } catch (err) {
      console.error('Error updating selection:', err);
    }
  };

  return (
    <motion.div
      className="relative min-h-screen flex flex-col lg:flex-row gap-6 p-6 bg-gray-100 dark:bg-gray-900 overflow-hidden"
      initial="initial"
      animate="animate"
      variants={staggerChildren}
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-25"
      >
        <source src="/checkmark_vd.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-6 w-full">
        {/* Left Side Info */}
        <motion.div
          variants={fadeInUp}
          className="lg:w-1/2 w-full flex flex-col justify-center items-center text-center text-gray-800 dark:text-gray-100"
        >
          <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">
            Set Your Goals 🎯
          </h1>
          <p className="text-lg max-w-md opacity-90">
            Choose your personal development checkpoints and track your progress.
          </p>
        </motion.div>

        {/* Right: Checkpoint List */}
        <motion.div
          variants={fadeInUp}
          className="lg:w-1/2 w-full bg-white dark:bg-gray-800 bg-opacity-90 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            🎯 What do you want to achieve?
          </h2>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading checkpoints...</p>
          ) : (
            <motion.div
              variants={staggerChildren}
              className="flex flex-col gap-3"
            >
              {checkpoints.map((chk, i) => (
                <motion.label
                  key={chk.id}
                  variants={fadeInUp}
                  className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer transition-all duration-300 ${
                    selected.includes(chk.id)
                      ? 'bg-blue-50 dark:bg-blue-900 border-blue-400'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <motion.input
                      whileTap={{ scale: 0.9 }}
                      type="checkbox"
                      checked={selected.includes(chk.id)}
                      onChange={() => handleSelect(chk)}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-gray-800 dark:text-gray-100 font-medium">
                      {chk.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Selected by {chk.selection_count} users
                  </span>
                </motion.label>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
