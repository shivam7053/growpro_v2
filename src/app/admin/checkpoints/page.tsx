'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

interface Checkpoint {
  id?: string;
  title: string;
  category: string;
  selection_count: number;
}

export default function AdminCheckpoints() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
  });

  // ✅ Fetch all checkpoints
  const fetchCheckpoints = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'Checkpoints'));
      const list: Checkpoint[] = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        title: docSnap.data().title,
        category: docSnap.data().category,
        selection_count: docSnap.data().selection_count || 0,
      }));
      setCheckpoints(list);
    } catch (err) {
      console.error('Error fetching checkpoints:', err);
      alert('❌ Failed to load checkpoints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckpoints();
  }, []);

  // ✅ Add or update checkpoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category.trim())
      return alert('Title and category are required');

    try {
      if (editingId) {
        await updateDoc(doc(db, 'Checkpoints', editingId), {
          title: formData.title,
          category: formData.category,
        });
        alert('✅ Checkpoint updated successfully!');
      } else {
        await addDoc(collection(db, 'Checkpoints'), {
          title: formData.title,
          category: formData.category,
          selection_count: 0,
          created_at: serverTimestamp(),
        });
        alert('✅ Checkpoint added successfully!');
      }

      setFormData({ title: '', category: '' });
      setEditingId(null);
      fetchCheckpoints();
    } catch (err) {
      console.error('Error saving checkpoint:', err);
      alert('❌ Failed to save checkpoint.');
    }
  };

  // ✅ Delete checkpoint
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this checkpoint?')) return;
    try {
      await deleteDoc(doc(db, 'Checkpoints', id));
      setCheckpoints(checkpoints.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting checkpoint:', err);
      alert('❌ Failed to delete checkpoint.');
    }
  };

  // ✅ Edit mode
  const handleEdit = (checkpoint: Checkpoint) => {
    setEditingId(checkpoint.id!);
    setFormData({
      title: checkpoint.title,
      category: checkpoint.category,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6 text-gray-800">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
        🧩 Manage Checkpoints
      </h1>

      {/* ✅ Form Section */}
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {editingId ? '✏️ Edit Checkpoint' : '➕ Add New Checkpoint'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter checkpoint title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Category
            </label>
            <input
              type="text"
              placeholder="Enter category (e.g., Career Growth)"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {editingId ? 'Update Checkpoint' : 'Add Checkpoint'}
          </button>
        </form>
      </div>

      {/* ✅ Display All Checkpoints */}
      {loading ? (
        <p className="text-center text-gray-600">Loading checkpoints...</p>
      ) : checkpoints.length === 0 ? (
        <p className="text-center text-gray-600">No checkpoints found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checkpoints.map((chk) => (
            <div
              key={chk.id}
              className="bg-white p-5 rounded-xl shadow-md border border-gray-200 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {chk.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  📂 Category: <span className="font-medium">{chk.category}</span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  👥 Selected by {chk.selection_count} users
                </p>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => handleEdit(chk)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(chk.id!)}
                  className="text-red-600 hover:underline font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
