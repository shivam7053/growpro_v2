'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContexts';

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

  useEffect(() => {
    fetchCheckpoints();
  }, []);

  // Handle selection of checkpoint
  const handleSelect = async (checkpoint: Checkpoint) => {
    if (!user) return alert('Please log in first');

    const userRef = doc(db, 'user_profiles', user.uid);
    const checkpointRef = doc(db, 'Checkpoints', checkpoint.id);
    const isSelected = selected.includes(checkpoint.id);

    try {
      // Update UI
      setSelected((prev) =>
        isSelected ? prev.filter((id) => id !== checkpoint.id) : [...prev, checkpoint.id]
      );

      // Update Firestore
      if (!isSelected) {
        await Promise.all([
          updateDoc(userRef, {
            selectedCheckpoints: arrayUnion({
              category: checkpoint.category,
              checkpoints: [checkpoint.id],
            }),
          }),
          updateDoc(checkpointRef, {
            selection_count: increment(1),
          }),
        ]);
      } else {
        await Promise.all([
          updateDoc(userRef, {
            selectedCheckpoints: arrayRemove({
              category: checkpoint.category,
              checkpoints: [checkpoint.id],
            }),
          }),
          updateDoc(checkpointRef, {
            selection_count: increment(-1),
          }),
        ]);
      }
    } catch (err) {
      console.error('Error updating selection:', err);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row gap-6 p-6 bg-gray-100 overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-30"
      >
        <source src="/checkmark_vd.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-6 w-full">
        {/* Left Side (optional heading/info) */}
        <div className="lg:w-1/2 w-full flex flex-col justify-center items-center text-center text-gray-800">
          <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">Set Your Goals 🎯</h1>
          <p className="text-lg max-w-md">
            Choose your personal development checkpoints and see what others are achieving.
          </p>
        </div>

        {/* Right: Checkpoint List */}
        <div className="lg:w-1/2 w-full bg-white bg-opacity-90 rounded-xl p-6 shadow-lg border border-gray-200 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            🎯 What do you want to achieve?
          </h2>

          {loading ? (
            <p className="text-gray-600">Loading checkpoints...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {checkpoints.map((chk) => (
                <label
                  key={chk.id}
                  className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer transition ${
                    selected.includes(chk.id)
                      ? 'bg-blue-50 border-blue-400'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(chk.id)}
                      onChange={() => handleSelect(chk)}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-gray-800 font-medium">{chk.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Selected by {chk.selection_count} users
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
