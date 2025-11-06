'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';

interface Masterclass {
  id: string;
  title: string;
  speaker_name: string;
  speaker_designation: string;
  youtube_url: string;
  created_at: string;
  price: number;
  joined_users: string[];
  joined_user_details?: { id: string; name?: string; email?: string }[];
  type: 'free' | 'paid' | 'featured';
}

export default function AdminMasterclasses() {
  const [classes, setClasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    speaker_name: '',
    speaker_designation: '',
    youtube_url: '',
    price: '',
    type: 'free' as 'free' | 'paid' | 'featured',
  });

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'MasterClasses'));
      const masterclassList: Masterclass[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const joinedUsers: string[] = Array.isArray(data.joined_users)
          ? data.joined_users.filter((id) => typeof id === 'string')
          : [];

        const joined_user_details: { id: string; name?: string; email?: string }[] = [];
        for (const userId of joinedUsers) {
          try {
            const userRef = doc(db, 'user_profiles', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              joined_user_details.push({
                id: userId,
                name: userData.full_name || 'Unknown User',
                email: userData.email || '',
              });
            }
          } catch (err) {
            console.warn(`Failed to fetch user ${userId}:`, err);
          }
        }

        masterclassList.push({
          id: docSnap.id,
          title: data.title || '',
          speaker_name: data.speaker_name || '',
          speaker_designation: data.speaker_designation || '',
          youtube_url: data.youtube_url || '',
          created_at: data.created_at
            ? new Date(data.created_at.seconds * 1000).toLocaleString()
            : 'N/A',
          price: data.price || 0,
          joined_users: joinedUsers,
          joined_user_details,
          type: data.type || 'free',
        });
      }

      setClasses(masterclassList);
    } catch (err) {
      console.error('Error fetching masterclasses:', err);
      alert('❌ Failed to load masterclasses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) return alert('Title is required');
    if (!formData.speaker_name.trim()) return alert('Speaker name is required');
    if (!formData.price) return alert('Price is required');

    try {
      if (editingId) {
        await updateDoc(doc(db, 'MasterClasses', editingId), {
          ...formData,
          price: Number(formData.price),
        });
        alert('✅ Masterclass updated successfully!');
      } else {
        await addDoc(collection(db, 'MasterClasses'), {
          ...formData,
          price: Number(formData.price),
          joined_users: [],
          created_at: serverTimestamp(),
        });
        alert('✅ Masterclass added successfully!');
      }

      setFormData({
        title: '',
        speaker_name: '',
        speaker_designation: '',
        youtube_url: '',
        price: '',
        type: 'free',
      });
      setEditingId(null);
      fetchClasses();
    } catch (err) {
      console.error('Error saving masterclass:', err);
      alert('❌ Failed to save masterclass.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await deleteDoc(doc(db, 'MasterClasses', id));
      setClasses(classes.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting class:', err);
      alert('❌ Failed to delete masterclass.');
    }
  };

  const handleEdit = (cls: Masterclass) => {
    setEditingId(cls.id);
    setFormData({
      title: cls.title,
      speaker_name: cls.speaker_name,
      speaker_designation: cls.speaker_designation,
      youtube_url: cls.youtube_url,
      price: String(cls.price),
      type: cls.type,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      speaker_name: '',
      speaker_designation: '',
      youtube_url: '',
      price: '',
      type: 'free',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6 text-gray-800">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
        🎓 Manage Masterclasses
      </h1>

      {/* Add / Edit Masterclass Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-6 max-w-2xl mx-auto mb-10 border border-gray-200"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          {editingId ? '✏️ Edit Masterclass' : '➕ Add New Masterclass'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
          />

          <input
            type="text"
            placeholder="Speaker Name *"
            value={formData.speaker_name}
            onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
            className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
          />

          <input
            type="text"
            placeholder="Speaker Designation"
            value={formData.speaker_designation}
            onChange={(e) =>
              setFormData({ ...formData, speaker_designation: e.target.value })
            }
            className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
          />

          <input
            type="text"
            placeholder="YouTube URL"
            value={formData.youtube_url}
            onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
            className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
          />

          <input
            type="number"
            placeholder="Price *"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
          />

          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as 'free' | 'paid' | 'featured',
              })
            }
            className="border p-3 rounded-lg text-gray-900"
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="featured">Featured</option>
          </select>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            {editingId ? 'Update Masterclass' : 'Add Masterclass'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Show All Masterclasses */}
      {loading ? (
        <p className="text-center text-gray-700 font-medium">Loading...</p>
      ) : classes.length === 0 ? (
        <p className="text-center text-gray-700 font-medium">No masterclasses found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white p-6 rounded-lg shadow-lg border border-gray-200"
            >
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{cls.title}</h2>
                <p className="text-sm text-gray-800">
                  {cls.speaker_name} • {cls.speaker_designation || '—'}
                </p>
                <p className="text-gray-900 mt-2 font-medium">💰 {cls.price} INR</p>
                <p className="text-gray-700 text-sm mt-1 capitalize">
                  Type: {cls.type}
                </p>
                <p className="text-xs text-gray-600 mt-1">Created: {cls.created_at}</p>

                <div className="mt-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-sm mb-1 text-gray-800">
                    👥 Joined Users ({cls.joined_user_details?.length || 0})
                  </h3>
                  {cls.joined_user_details?.length ? (
                    <ul className="text-xs text-gray-800 space-y-1 max-h-28 overflow-y-auto">
                      {cls.joined_user_details.map((user) => (
                        <li key={user.id}>
                          • {user.name} {user.email && <span>({user.email})</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-600">No users joined yet.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => handleEdit(cls)}
                  className="text-blue-700 font-semibold hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cls.id)}
                  className="text-red-700 font-semibold hover:underline"
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
