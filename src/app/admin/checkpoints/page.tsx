// 'use client';

// import { useEffect, useState } from 'react';
// import { db } from '@/lib/firebase';
// import {
//   collection,
//   getDocs,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
// } from 'firebase/firestore';

// interface Checkpoint {
//   id?: string;
//   title: string;
//   category: string;
//   selection_count: number;
// }

// export default function AdminCheckpoints() {
//   const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   const [formData, setFormData] = useState({
//     title: '',
//     category: '',
//   });

//   // ✅ Fetch all checkpoints
//   const fetchCheckpoints = async () => {
//     try {
//       setLoading(true);
//       const querySnapshot = await getDocs(collection(db, 'Checkpoints'));
//       const list: Checkpoint[] = querySnapshot.docs.map((docSnap) => ({
//         id: docSnap.id,
//         title: docSnap.data().title,
//         category: docSnap.data().category,
//         selection_count: docSnap.data().selection_count || 0,
//       }));
//       setCheckpoints(list);
//     } catch (err) {
//       console.error('Error fetching checkpoints:', err);
//       alert('❌ Failed to load checkpoints.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCheckpoints();
//   }, []);

//   // ✅ Add or update checkpoint
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!formData.title.trim() || !formData.category.trim())
//       return alert('Title and category are required');

//     try {
//       if (editingId) {
//         await updateDoc(doc(db, 'Checkpoints', editingId), {
//           title: formData.title,
//           category: formData.category,
//         });
//         alert('✅ Checkpoint updated successfully!');
//       } else {
//         await addDoc(collection(db, 'Checkpoints'), {
//           title: formData.title,
//           category: formData.category,
//           selection_count: 0,
//           created_at: serverTimestamp(),
//         });
//         alert('✅ Checkpoint added successfully!');
//       }

//       setFormData({ title: '', category: '' });
//       setEditingId(null);
//       fetchCheckpoints();
//     } catch (err) {
//       console.error('Error saving checkpoint:', err);
//       alert('❌ Failed to save checkpoint.');
//     }
//   };

//   // ✅ Delete checkpoint
//   const handleDelete = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this checkpoint?')) return;
//     try {
//       await deleteDoc(doc(db, 'Checkpoints', id));
//       setCheckpoints(checkpoints.filter((c) => c.id !== id));
//     } catch (err) {
//       console.error('Error deleting checkpoint:', err);
//       alert('❌ Failed to delete checkpoint.');
//     }
//   };

//   // ✅ Edit mode
//   const handleEdit = (checkpoint: Checkpoint) => {
//     setEditingId(checkpoint.id!);
//     setFormData({
//       title: checkpoint.title,
//       category: checkpoint.category,
//     });
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 py-12 px-6 text-gray-800">
//       <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
//         🧩 Manage Checkpoints
//       </h1>

//       {/* ✅ Form Section */}
//       <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-10">
//         <h2 className="text-xl font-semibold mb-4 text-gray-800">
//           {editingId ? '✏️ Edit Checkpoint' : '➕ Add New Checkpoint'}
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block font-semibold mb-1 text-gray-700">
//               Title
//             </label>
//             <input
//               type="text"
//               placeholder="Enter checkpoint title"
//               value={formData.title}
//               onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//               className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
//             />
//           </div>

//           <div>
//             <label className="block font-semibold mb-1 text-gray-700">
//               Category
//             </label>
//             <input
//               type="text"
//               placeholder="Enter category (e.g., Career Growth)"
//               value={formData.category}
//               onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//               className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
//             />
//           </div>

//           <button
//             type="submit"
//             className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
//           >
//             {editingId ? 'Update Checkpoint' : 'Add Checkpoint'}
//           </button>
//         </form>
//       </div>

//       {/* ✅ Display All Checkpoints */}
//       {loading ? (
//         <p className="text-center text-gray-600">Loading checkpoints...</p>
//       ) : checkpoints.length === 0 ? (
//         <p className="text-center text-gray-600">No checkpoints found.</p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {checkpoints.map((chk) => (
//             <div
//               key={chk.id}
//               className="bg-white p-5 rounded-xl shadow-md border border-gray-200 flex flex-col justify-between"
//             >
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900 mb-1">
//                   {chk.title}
//                 </h3>
//                 <p className="text-sm text-gray-600 mb-2">
//                   📂 Category: <span className="font-medium">{chk.category}</span>
//                 </p>
//                 <p className="text-sm text-gray-800 font-medium">
//                   👥 Selected by {chk.selection_count} users
//                 </p>
//               </div>

//               <div className="flex justify-between mt-4">
//                 <button
//                   onClick={() => handleEdit(chk)}
//                   className="text-blue-600 hover:underline font-semibold"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(chk.id!)}
//                   className="text-red-600 hover:underline font-semibold"
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

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  DocumentReference,
} from 'firebase/firestore';
import { UserProfile } from '@/types/masterclass';

interface CheckpointDocument {
  id?: string;
  title: string;
  category: string;
  selection_count: number;
  created_at?: any; // Using `any` for Firebase ServerTimestamp
}

interface AdminUser extends Pick<UserProfile, 'id' | 'email'> {
  id: string;
  email: string;
  selectedCheckpoints: string[];
}

export default function AdminCheckpoints() {
  const [view, setView] = useState<'manage' | 'analytics'>('manage');
  const [checkpoints, setCheckpoints] = useState<CheckpointDocument[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
  });

  // Fetch all checkpoints
  const fetchCheckpoints = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'Checkpoints'));
      const list: CheckpointDocument[] = querySnapshot.docs.map((docSnap) => ({
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

  // Fetch all users with their selected checkpoint
  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'user_profiles'));
      const usersList: AdminUser[] = usersSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        email: docSnap.data().email,
        selectedCheckpoints: docSnap.data().selectedCheckpoints || [],
      }));
      setUsers(usersList);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchCheckpoints();
    fetchUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category.trim())
      return alert('Title and category are required');

    const saveCheckpoint = async () => {
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

    saveCheckpoint();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this checkpoint?')) return;
    try {
      await deleteDoc(doc(db, 'Checkpoints', id));
      setCheckpoints(checkpoints.filter((c) => c.id !== id));
      alert('✅ Checkpoint deleted successfully!');
    } catch (err) {
      console.error('Error deleting checkpoint:', err);
      alert('❌ Failed to delete checkpoint.');
    }
  };

  const handleEdit = (checkpoint: CheckpointDocument) => {
    setEditingId(checkpoint.id!);
    setFormData({
      title: checkpoint.title,
      category: checkpoint.category,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Prepare chart data
  const chartData = checkpoints.map(chk => ({
    name: chk.title.length > 20 ? chk.title.substring(0, 20) + '...' : chk.title,
    selections: chk.selection_count
  }));

  // Get users for each checkpoint
  const getUsersForCheckpoint = (checkpointId: string) => {
    return users.filter(user => user.selectedCheckpoints.includes(checkpointId));
  };

  if (view === 'analytics') {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-6 text-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              📊 Checkpoint Analytics
            </h1>
            <button
              onClick={() => setView('manage')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              ← Back to Management
            </button>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-10">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              Selection Statistics
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="selections" fill="#3b82f6" name="Number of Selections" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* User Table Section - Columns for each checkpoint */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <h2 className="text-xl font-semibold p-6 text-gray-800 border-b border-gray-200">
              Users by Selected Checkpoint
            </h2>
            <div className="overflow-x-auto">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {checkpoints.map(checkpoint => {
                    const checkpointUsers = getUsersForCheckpoint(checkpoint.id!);
                    return (
                      <div key={checkpoint.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-lg text-gray-900 mb-3 pb-2 border-b border-gray-300">
                          {checkpoint.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Category: <span className="font-medium">{checkpoint.category}</span>
                        </p>
                        <p className="text-sm font-semibold text-blue-600 mb-3">
                          Total Users: {checkpointUsers.length}
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {checkpointUsers.length > 0 ? (
                            checkpointUsers.map(user => (
                              <div key={user.id} className="bg-white px-3 py-2 rounded border border-gray-200 text-sm">
                                📧 {user.email}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm italic">No users selected this checkpoint</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Checkpoints</h3>
              <p className="text-3xl font-bold text-blue-600">{checkpoints.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-green-600">{users.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Selections</h3>
              <p className="text-3xl font-bold text-purple-600">
                {users.reduce((acc, user) => acc + user.selectedCheckpoints.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6 text-gray-800">
      <div className="flex justify-between items-center max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          🧩 Manage Checkpoints
        </h1>
        <button
          onClick={() => setView('analytics')}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
        >
          📊 View Analytics
        </button>
      </div>

      {/* Form Section */}
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

      {/* Display All Checkpoints */}
      {loading ? (
        <p className="text-center text-gray-600">Loading checkpoints...</p>
      ) : checkpoints.length === 0 ? (
        <p className="text-center text-gray-600">No checkpoints found.</p>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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