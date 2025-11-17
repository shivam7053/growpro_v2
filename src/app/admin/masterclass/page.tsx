// //admin/masterclass/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { db } from '@/lib/firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   deleteDoc,
//   updateDoc,
//   doc,
//   serverTimestamp,
// } from 'firebase/firestore';
// import { Masterclass } from '@/types/masterclass';

// export default function AdminMasterclasses() {
//   const router = useRouter();
//   const [classes, setClasses] = useState<Masterclass[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState<'all' | 'free' | 'paid' | 'featured' | 'upcoming'>('all');
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

//   const filteredClasses =
//     filter === 'all' ? classes : classes.filter((cls) => cls.type === filter);

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

//       {/* Add/Edit Form */}
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white shadow-lg rounded-xl p-6 max-w-4xl mx-auto mb-10 border border-gray-200"
//       >
//         <h2 className="text-xl font-semibold mb-4 text-gray-900">
//           {editingId ? '✏️ Edit Masterclass' : '➕ Add New Masterclass'}
//         </h2>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <input type="text" placeholder="Title *" value={formData.title}
//             onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//             className="border p-3 rounded-lg text-gray-900" />

//           <input type="text" placeholder="Speaker Name *" value={formData.speaker_name}
//             onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
//             className="border p-3 rounded-lg text-gray-900" />

//           <input type="text" placeholder="Speaker Designation" value={formData.speaker_designation}
//             onChange={(e) => setFormData({ ...formData, speaker_designation: e.target.value })}
//             className="border p-3 rounded-lg text-gray-900" />

//           <input type="text" placeholder="YouTube URL" value={formData.youtube_url}
//             onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
//             className="border p-3 rounded-lg text-gray-900" />

//           <input type="number" placeholder="Price *" value={formData.price}
//             onChange={(e) => setFormData({ ...formData, price: e.target.value })}
//             className="border p-3 rounded-lg text-gray-900" />

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

//           <input type="text" placeholder="Duration (e.g., 2 hours)"
//             value={formData.duration}
//             onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
//             className="border p-3 rounded-lg text-gray-900" />

//           <input type="text" placeholder="Thumbnail URL"
//             value={formData.thumbnail_url}
//             onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
//             className="border p-3 rounded-lg text-gray-900" />

//           {formData.type === 'upcoming' && (
//             <input type="datetime-local" value={formData.scheduled_date}
//               onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
//               className="border p-3 rounded-lg text-gray-900" />
//           )}
//         </div>

//         <textarea
//           placeholder="Description"
//           value={formData.description}
//           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//           className="border p-3 rounded-lg text-gray-900 w-full mt-4"
//           rows={3}
//         />

//         <div className="flex gap-4 mt-6">
//           <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
//             {editingId ? 'Update Masterclass' : 'Add Masterclass'}
//           </button>
//           {editingId && (
//             <button
//               type="button"
//               onClick={cancelEdit}
//               className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 font-semibold"
//             >
//               Cancel
//             </button>
//           )}
//         </div>
//       </form>

//       {/* Filter Buttons */}
//       <div className="flex justify-center mb-6 gap-3 flex-wrap">
//         {['all', 'free', 'paid', 'featured', 'upcoming'].map((f) => (
//           <button
//             key={f}
//             onClick={() => setFilter(f as any)}
//             className={`px-4 py-2 rounded-lg font-semibold ${
//               filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
//             }`}
//           >
//             {f.charAt(0).toUpperCase() + f.slice(1)}
//           </button>
//         ))}
//       </div>

//       {/* Display Masterclasses */}
//       {loading ? (
//         <p className="text-center text-gray-700 font-medium">Loading...</p>
//       ) : filteredClasses.length === 0 ? (
//         <p className="text-center text-gray-700 font-medium">No masterclasses found.</p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredClasses.map((cls) => (
//             <div key={cls.id} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
//               <div className="flex items-start justify-between mb-3">
//                 <h2 className="text-xl font-semibold text-gray-900">{cls.title}</h2>
//                 <span
//                   className={`px-2 py-1 rounded-full text-xs font-bold uppercase text-white ${getTypeBadgeColor(cls.type)}`}
//                 >
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
//                 <button
//                   onClick={() => router.push(`/admin/enrolled/${cls.id}`)}
//                   className="text-blue-600 hover:underline text-sm font-semibold"
//                 >
//                   View Enrolled Users →
//                 </button>
//               </div>

//               <div className="flex justify-between mt-4">
//                 <button onClick={() => handleEdit(cls)} className="text-blue-700 font-semibold hover:underline">
//                   Edit
//                 </button>
//                 <button onClick={() => handleDelete(cls.id!)} className="text-red-700 font-semibold hover:underline">
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


// app/admin/masterclass/page.tsx
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
import { Masterclass, MasterclassVideo } from '@/types/masterclass';
import { Plus, Trash2, Edit2, Video, X } from 'lucide-react';

export default function AdminMasterclasses() {
  const router = useRouter();
  const [classes, setClasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'free' | 'paid' | 'featured' | 'upcoming'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    speaker_name: '',
    speaker_designation: '',
    starting_price: '',
    type: 'free' as 'free' | 'paid' | 'featured' | 'upcoming',
    description: '',
    total_duration: '',
    thumbnail_url: '',
    scheduled_date: '',
  });

  const [videoFormData, setVideoFormData] = useState<MasterclassVideo>({
    id: '',
    title: '',
    youtube_url: '',
    duration: '',
    order: 0,
    type: 'free',
    price: 0,
    description: '',
  });

  const [currentVideos, setCurrentVideos] = useState<MasterclassVideo[]>([]);
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);

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
          created_at: data.created_at
            ? new Date(data.created_at.seconds * 1000).toISOString()
            : new Date().toISOString(),
          joined_users: joinedUsers,
          type: data.type || 'free',
          description: data.description || '',
          total_duration: data.total_duration || '',
          thumbnail_url: data.thumbnail_url || '',
          scheduled_date: data.scheduled_date || '',
          videos: data.videos || [],
          starting_price: data.starting_price || 0,
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

  const handleAddVideo = () => {
    if (!videoFormData.title.trim() || !videoFormData.youtube_url.trim()) {
      return alert('Video title and URL are required');
    }

    const newVideo: MasterclassVideo = {
      ...videoFormData,
      id: `video_${Date.now()}`,
      order: currentVideos.length,
    };

    if (editingVideoIndex !== null) {
      const updated = [...currentVideos];
      updated[editingVideoIndex] = newVideo;
      setCurrentVideos(updated);
      setEditingVideoIndex(null);
    } else {
      setCurrentVideos([...currentVideos, newVideo]);
    }

    setVideoFormData({
      id: '',
      title: '',
      youtube_url: '',
      duration: '',
      order: 0,
      type: 'free',
      price: 0,
      description: '',
    });
    setShowVideoModal(false);
  };

  const handleEditVideo = (index: number) => {
    setVideoFormData(currentVideos[index]);
    setEditingVideoIndex(index);
    setShowVideoModal(true);
  };

  const handleDeleteVideo = (index: number) => {
    if (confirm('Delete this video?')) {
      setCurrentVideos(currentVideos.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) return alert('Title is required');
    if (!formData.speaker_name.trim()) return alert('Speaker name is required');
    if (currentVideos.length === 0) return alert('Add at least one video');

    try {
      const dataToSave = {
        title: formData.title,
        speaker_name: formData.speaker_name,
        speaker_designation: formData.speaker_designation,
        starting_price: Number(formData.starting_price),
        type: formData.type,
        description: formData.description,
        total_duration: formData.total_duration,
        thumbnail_url: formData.thumbnail_url,
        scheduled_date: formData.scheduled_date,
        videos: currentVideos,
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
        starting_price: '',
        type: 'free',
        description: '',
        total_duration: '',
        thumbnail_url: '',
        scheduled_date: '',
      });
      setCurrentVideos([]);
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
      starting_price: String(cls.starting_price),
      type: cls.type,
      description: cls.description || '',
      total_duration: cls.total_duration || '',
      thumbnail_url: cls.thumbnail_url || '',
      scheduled_date: cls.scheduled_date || '',
    });
    setCurrentVideos(cls.videos || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      speaker_name: '',
      speaker_designation: '',
      starting_price: '',
      type: 'free',
      description: '',
      total_duration: '',
      thumbnail_url: '',
      scheduled_date: '',
    });
    setCurrentVideos([]);
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

      {/* Add/Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-6 max-w-6xl mx-auto mb-10 border border-gray-200"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          {editingId ? '✏️ Edit Masterclass' : '➕ Add New Masterclass'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Title *" value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="border p-3 rounded-lg text-gray-900" />

          <input type="text" placeholder="Speaker Name *" value={formData.speaker_name}
            onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
            className="border p-3 rounded-lg text-gray-900" />

          <input type="text" placeholder="Speaker Designation" value={formData.speaker_designation}
            onChange={(e) => setFormData({ ...formData, speaker_designation: e.target.value })}
            className="border p-3 rounded-lg text-gray-900" />

          <input type="number" placeholder="Starting Price" value={formData.starting_price}
            onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
            className="border p-3 rounded-lg text-gray-900" />

          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as 'free' | 'paid' | 'featured' | 'upcoming',
              })
            }
            className="border p-3 rounded-lg text-gray-900"
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="featured">Featured</option>
            <option value="upcoming">Upcoming</option>
          </select>

          <input type="text" placeholder="Total Duration (e.g., 5 hours)"
            value={formData.total_duration}
            onChange={(e) => setFormData({ ...formData, total_duration: e.target.value })}
            className="border p-3 rounded-lg text-gray-900" />

          <input type="text" placeholder="Thumbnail URL"
            value={formData.thumbnail_url}
            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
            className="border p-3 rounded-lg text-gray-900" />

          {formData.type === 'upcoming' && (
            <input type="datetime-local" value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="border p-3 rounded-lg text-gray-900" />
          )}
        </div>

        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="border p-3 rounded-lg text-gray-900 w-full mt-4"
          rows={3}
        />

        {/* Videos Section */}
        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Videos ({currentVideos.length})</h3>
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Video
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentVideos.map((video, index) => (
              <div key={video.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold">{index + 1}. {video.title}</p>
                  <p className="text-sm text-gray-600">{video.youtube_url}</p>
                  <div className="flex gap-2 mt-1">
                    {video.duration && <span className="text-xs bg-gray-200 px-2 py-1 rounded">{video.duration}</span>}
                    <span className={`text-xs px-2 py-1 rounded ${video.type === 'free' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {video.type === 'free' ? 'FREE' : `₹${video.price}`}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEditVideo(index)} className="text-blue-600 hover:text-blue-800">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDeleteVideo(index)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
            {editingId ? 'Update Masterclass' : 'Add Masterclass'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingVideoIndex !== null ? 'Edit Video' : 'Add Video'}</h3>
              <button onClick={() => {
                setShowVideoModal(false);
                setEditingVideoIndex(null);
                setVideoFormData({
                  id: '',
                  title: '',
                  youtube_url: '',
                  duration: '',
                  order: 0,
                  type: 'free',
                  price: 0,
                  description: '',
                });
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Video Title *"
                value={videoFormData.title}
                onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                className="w-full border p-3 rounded-lg"
              />

              <input
                type="text"
                placeholder="YouTube URL *"
                value={videoFormData.youtube_url}
                onChange={(e) => setVideoFormData({ ...videoFormData, youtube_url: e.target.value })}
                className="w-full border p-3 rounded-lg"
              />

              <input
                type="text"
                placeholder="Duration (e.g., 45 min)"
                value={videoFormData.duration}
                onChange={(e) => setVideoFormData({ ...videoFormData, duration: e.target.value })}
                className="w-full border p-3 rounded-lg"
              />

              <textarea
                placeholder="Video Description"
                value={videoFormData.description}
                onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                className="w-full border p-3 rounded-lg"
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={videoFormData.type}
                  onChange={(e) => setVideoFormData({ ...videoFormData, type: e.target.value as 'free' | 'paid' })}
                  className="border p-3 rounded-lg"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>

                {videoFormData.type === 'paid' && (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Price *"
                    value={videoFormData.price}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setVideoFormData({ ...videoFormData, price: Number(val) });
                    }}
                    className="border p-3 rounded-lg"
                  />

                )}
              </div>

              <button
                onClick={handleAddVideo}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
              >
                {editingVideoIndex !== null ? 'Update Video' : 'Add Video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
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

      {/* Display Masterclasses */}
      {loading ? (
        <p className="text-center text-gray-700 font-medium">Loading...</p>
      ) : filteredClasses.length === 0 ? (
        <p className="text-center text-gray-700 font-medium">No masterclasses found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-900">{cls.title}</h2>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold uppercase text-white ${getTypeBadgeColor(cls.type)}`}
                >
                  {cls.type}
                </span>
              </div>

              <p className="text-sm text-gray-800">
                {cls.speaker_name} • {cls.speaker_designation || '—'}
              </p>
              <p className="text-gray-900 mt-2 font-medium">💰 Starting from ₹{cls.starting_price}</p>
              <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                <Video className="w-4 h-4" /> {cls.videos?.length || 0} videos
              </p>
              {cls.total_duration && <p className="text-sm text-gray-700 mt-1">⏱️ {cls.total_duration}</p>}
              {cls.scheduled_date && (
                <p className="text-sm text-gray-700 mt-1">
                  📅 {new Date(cls.scheduled_date).toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1">Created: {new Date(cls.created_at).toLocaleDateString()}</p>

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
                <button onClick={() => handleEdit(cls)} className="text-blue-700 font-semibold hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(cls.id!)} className="text-red-700 font-semibold hover:underline">
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