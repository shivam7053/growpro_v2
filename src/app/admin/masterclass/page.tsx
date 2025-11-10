// 'use client';

// import { useState, useEffect } from 'react';
// import { db } from '@/lib/firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   deleteDoc,
//   updateDoc,
//   doc,
//   serverTimestamp,
//   getDoc,
// } from 'firebase/firestore';
// import { Masterclass } from '@/types/masterclass';

// export default function AdminMasterclasses() {
//   const [classes, setClasses] = useState<Masterclass[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   const [formData, setFormData] = useState({
//     title: '',
//     speaker_name: '',
//     speaker_designation: '',
//     youtube_url: '',
//     price: '',
//     type: 'free' as 'free' | 'paid' | 'featured' | 'upcoming',
//     description: '',
//     duration: '',
//     thumbnail_url: '',
//     scheduled_date: '',
//   });

//   const fetchClasses = async () => {
//     try {
//       setLoading(true);
//       const querySnapshot = await getDocs(collection(db, 'MasterClasses'));
//       const masterclassList: Masterclass[] = [];

//       for (const docSnap of querySnapshot.docs) {
//         const data = docSnap.data();
//         const joinedUsers: string[] = Array.isArray(data.joined_users)
//           ? data.joined_users.filter((id) => typeof id === 'string')
//           : [];

//         masterclassList.push({
//           id: docSnap.id,
//           title: data.title || '',
//           speaker_name: data.speaker_name || '',
//           speaker_designation: data.speaker_designation || '',
//           youtube_url: data.youtube_url || '',
//           created_at: data.created_at
//             ? new Date(data.created_at.seconds * 1000).toLocaleString()
//             : 'N/A',
//           price: data.price || 0,
//           joined_users: joinedUsers,
//           type: data.type || 'free',
//           description: data.description || '',
//           duration: data.duration || '',
//           thumbnail_url: data.thumbnail_url || '',
//           scheduled_date: data.scheduled_date || '',
//         });
//       }

//       setClasses(masterclassList);
//     } catch (err) {
//       console.error('Error fetching masterclasses:', err);
//       alert('❌ Failed to load masterclasses.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchClasses();
//   }, []);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!formData.title.trim()) return alert('Title is required');
//     if (!formData.speaker_name.trim()) return alert('Speaker name is required');
//     if (!formData.price) return alert('Price is required');

//     try {
//       const dataToSave = {
//         title: formData.title,
//         speaker_name: formData.speaker_name,
//         speaker_designation: formData.speaker_designation,
//         youtube_url: formData.youtube_url,
//         price: Number(formData.price),
//         type: formData.type,
//         description: formData.description,
//         duration: formData.duration,
//         thumbnail_url: formData.thumbnail_url,
//         scheduled_date: formData.scheduled_date,
//       };

//       if (editingId) {
//         await updateDoc(doc(db, 'MasterClasses', editingId), dataToSave);
//         alert('✅ Masterclass updated successfully!');
//       } else {
//         await addDoc(collection(db, 'MasterClasses'), {
//           ...dataToSave,
//           joined_users: [],
//           created_at: serverTimestamp(),
//         });
//         alert('✅ Masterclass added successfully!');
//       }

//       setFormData({
//         title: '',
//         speaker_name: '',
//         speaker_designation: '',
//         youtube_url: '',
//         price: '',
//         type: 'free',
//         description: '',
//         duration: '',
//         thumbnail_url: '',
//         scheduled_date: '',
//       });
//       setEditingId(null);
//       fetchClasses();
//     } catch (err) {
//       console.error('Error saving masterclass:', err);
//       alert('❌ Failed to save masterclass.');
//     }
//   };

//   const handleDelete = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this class?')) return;
//     try {
//       await deleteDoc(doc(db, 'MasterClasses', id));
//       setClasses(classes.filter((c) => c.id !== id));
//     } catch (err) {
//       console.error('Error deleting class:', err);
//       alert('❌ Failed to delete masterclass.');
//     }
//   };

//   const handleEdit = (cls: Masterclass) => {
//     setEditingId(cls.id);
//     setFormData({
//       title: cls.title,
//       speaker_name: cls.speaker_name,
//       speaker_designation: cls.speaker_designation,
//       youtube_url: cls.youtube_url,
//       price: String(cls.price),
//       type: cls.type,
//       description: cls.description || '',
//       duration: cls.duration || '',
//       thumbnail_url: cls.thumbnail_url || '',
//       scheduled_date: cls.scheduled_date || '',
//     });
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const cancelEdit = () => {
//     setEditingId(null);
//     setFormData({
//       title: '',
//       speaker_name: '',
//       speaker_designation: '',
//       youtube_url: '',
//       price: '',
//       type: 'free',
//       description: '',
//       duration: '',
//       thumbnail_url: '',
//       scheduled_date: '',
//     });
//   };

//   const getTypeBadgeColor = (type: string) => {
//     switch (type) {
//       case 'upcoming': return 'bg-blue-500';
//       case 'featured': return 'bg-yellow-500';
//       case 'paid': return 'bg-purple-500';
//       default: return 'bg-green-500';
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 py-12 px-6 text-gray-800">
//       <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
//         🎓 Manage Masterclasses
//       </h1>

//       {/* Add / Edit Masterclass Form */}
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white shadow-lg rounded-xl p-6 max-w-4xl mx-auto mb-10 border border-gray-200"
//       >
//         <h2 className="text-xl font-semibold mb-4 text-gray-900">
//           {editingId ? '✏️ Edit Masterclass' : '➕ Add New Masterclass'}
//         </h2>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <input
//             type="text"
//             placeholder="Title *"
//             value={formData.title}
//             onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//             className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
//           />

//           <input
//             type="text"
//             placeholder="Speaker Name *"
//             value={formData.speaker_name}
//             onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
//             className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
//           />

//           <input
//             type="text"
//             placeholder="Speaker Designation"
//             value={formData.speaker_designation}
//             onChange={(e) =>
//               setFormData({ ...formData, speaker_designation: e.target.value })
//             }
//             className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
//           />

//           <input
//             type="text"
//             placeholder="YouTube URL"
//             value={formData.youtube_url}
//             onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
//             className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
//           />

//           <input
//             type="number"
//             placeholder="Price *"
//             value={formData.price}
//             onChange={(e) => setFormData({ ...formData, price: e.target.value })}
//             className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
//           />

//           <select
//             value={formData.type}
//             onChange={(e) =>
//               setFormData({
//                 ...formData,
//                 type: e.target.value as 'free' | 'paid' | 'featured' | 'upcoming',
//               })
//             }
//             className="border p-3 rounded-lg text-gray-900"
//           >
//             <option value="free">Free</option>
//             <option value="paid">Paid</option>
//             <option value="featured">Featured</option>
//             <option value="upcoming">Upcoming</option>
//           </select>

//           <input
//             type="text"
//             placeholder="Duration (e.g., 2 hours)"
//             value={formData.duration}
//             onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
//             className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
//           />

//           <input
//             type="text"
//             placeholder="Thumbnail URL"
//             value={formData.thumbnail_url}
//             onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
//             className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
//           />

//           {formData.type === 'upcoming' && (
//             <input
//               type="datetime-local"
//               placeholder="Scheduled Date"
//               value={formData.scheduled_date}
//               onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
//               className="border p-3 rounded-lg placeholder-gray-600 text-gray-900"
//             />
//           )}
//         </div>

//         <textarea
//           placeholder="Description"
//           value={formData.description}
//           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//           className="border p-3 rounded-lg placeholder-gray-600 text-gray-900 w-full mt-4"
//           rows={3}
//         />

//         <div className="flex gap-4 mt-6">
//           <button
//             type="submit"
//             className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
//           >
//             {editingId ? 'Update Masterclass' : 'Add Masterclass'}
//           </button>
//           {editingId && (
//             <button
//               type="button"
//               onClick={cancelEdit}
//               className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition font-semibold"
//             >
//               Cancel
//             </button>
//           )}
//         </div>
//       </form>

//       {/* Show All Masterclasses */}
//       {loading ? (
//         <p className="text-center text-gray-700 font-medium">Loading...</p>
//       ) : classes.length === 0 ? (
//         <p className="text-center text-gray-700 font-medium">No masterclasses found.</p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {classes.map((cls) => (
//             <div
//               key={cls.id}
//               className="bg-white p-6 rounded-lg shadow-lg border border-gray-200"
//             >
//               <div className="flex items-start justify-between mb-3">
//                 <h2 className="text-xl font-semibold text-gray-900">{cls.title}</h2>
//                 <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase text-white ${getTypeBadgeColor(cls.type)}`}>
//                   {cls.type}
//                 </span>
//               </div>
              
//               <p className="text-sm text-gray-800">
//                 {cls.speaker_name} • {cls.speaker_designation || '—'}
//               </p>
//               <p className="text-gray-900 mt-2 font-medium">💰 {cls.price} INR</p>
//               {cls.duration && <p className="text-sm text-gray-700 mt-1">⏱️ {cls.duration}</p>}
//               {cls.scheduled_date && (
//                 <p className="text-sm text-gray-700 mt-1">
//                   📅 {new Date(cls.scheduled_date).toLocaleString()}
//                 </p>
//               )}
//               <p className="text-xs text-gray-600 mt-1">Created: {cls.created_at}</p>

//               <div className="mt-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
//                 <h3 className="font-semibold text-sm mb-1 text-gray-800">
//                   👥 Enrolled Users ({cls.joined_users?.length || 0})
//                 </h3>
//               </div>

//               <div className="flex justify-between mt-4">
//                 <button
//                   onClick={() => handleEdit(cls)}
//                   className="text-blue-700 font-semibold hover:underline"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(cls.id)}
//                   className="text-red-700 font-semibold hover:underline"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { Masterclass } from '@/types/masterclass';

export default function AdminMasterclasses() {
  const router = useRouter();
  const [classes, setClasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'free' | 'paid' | 'featured' | 'upcoming'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    speaker_name: '',
    speaker_designation: '',
    youtube_url: '',
    price: '',
    type: 'free' as 'free' | 'paid' | 'featured' | 'upcoming',
    description: '',
    duration: '',
    thumbnail_url: '',
    scheduled_date: '',
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
          type: data.type || 'free',
          description: data.description || '',
          duration: data.duration || '',
          thumbnail_url: data.thumbnail_url || '',
          scheduled_date: data.scheduled_date || '',
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
      const dataToSave = {
        title: formData.title,
        speaker_name: formData.speaker_name,
        speaker_designation: formData.speaker_designation,
        youtube_url: formData.youtube_url,
        price: Number(formData.price),
        type: formData.type,
        description: formData.description,
        duration: formData.duration,
        thumbnail_url: formData.thumbnail_url,
        scheduled_date: formData.scheduled_date,
      };

      if (editingId) {
        await updateDoc(doc(db, 'MasterClasses', editingId), dataToSave);
        alert('✅ Masterclass updated successfully!');
      } else {
        await addDoc(collection(db, 'MasterClasses'), {
          ...dataToSave,
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
        description: '',
        duration: '',
        thumbnail_url: '',
        scheduled_date: '',
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
      description: cls.description || '',
      duration: cls.duration || '',
      thumbnail_url: cls.thumbnail_url || '',
      scheduled_date: cls.scheduled_date || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredClasses =
    filter === 'all' ? classes : classes.filter((cls) => cls.type === filter);

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'upcoming': return 'bg-blue-500';
      case 'featured': return 'bg-yellow-500';
      case 'paid': return 'bg-purple-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6 text-gray-800">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
        🎓 Manage Masterclasses
      </h1>

      {/* Filter Section */}
      <div className="flex justify-center mb-6 gap-3 flex-wrap">
        {['all', 'free', 'paid', 'featured', 'upcoming'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Show All Masterclasses */}
      {loading ? (
        <p className="text-center text-gray-700 font-medium">Loading...</p>
      ) : filteredClasses.length === 0 ? (
        <p className="text-center text-gray-700 font-medium">No masterclasses found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white p-6 rounded-lg shadow-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-900">{cls.title}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase text-white ${getTypeBadgeColor(cls.type)}`}>
                  {cls.type}
                </span>
              </div>

              <p className="text-sm text-gray-800">
                {cls.speaker_name} • {cls.speaker_designation || '—'}
              </p>
              <p className="text-gray-900 mt-2 font-medium">💰 {cls.price} INR</p>
              {cls.duration && <p className="text-sm text-gray-700 mt-1">⏱️ {cls.duration}</p>}
              {cls.scheduled_date && (
                <p className="text-sm text-gray-700 mt-1">
                  📅 {new Date(cls.scheduled_date).toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1">Created: {cls.created_at}</p>

              <div className="mt-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-sm mb-1 text-gray-800">
                  👥 Enrolled Users ({cls.joined_users?.length || 0})
                </h3>
                <button
                  onClick={() => router.push(`/admin/enrolled/${cls.id}`)}
                  className="text-blue-600 hover:underline text-sm font-semibold"
                >
                  View Enrolled Users →
                </button>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => handleEdit(cls)}
                  className="text-blue-700 font-semibold hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cls.id!)}
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
