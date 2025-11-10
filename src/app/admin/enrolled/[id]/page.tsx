'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '@/types/masterclass';

export default function EnrolledUsersPage() {
  const params = useParams();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [classType, setClassType] = useState<string>('');

  const classId = params.id as string;

  useEffect(() => {
    const fetchEnrolledUsers = async () => {
      try {
        const classRef = doc(db, 'MasterClasses', classId);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) {
          alert('Class not found');
          router.push('/admin');
          return;
        }

        const classData = classSnap.data();
        setClassType(classData.type);

        const joinedIds = classData.joined_users || [];
        const usersData: UserProfile[] = [];

        for (const userId of joinedIds) {
          const userRef = doc(db, 'user_profiles', userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            usersData.push(userSnap.data() as UserProfile);
          }
        }

        setUsers(usersData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledUsers();
  }, [classId, router]);

  const handleDisallow = async (userId: string) => {
    if (!confirm('Remove this user from the enrolled list?')) return;

    try {
      const classRef = doc(db, 'MasterClasses', classId);
      const classSnap = await getDoc(classRef);
      if (!classSnap.exists()) return;

      const currentUsers = classSnap.data().joined_users || [];
      const updatedUsers = currentUsers.filter((id: string) => id !== userId);

      await updateDoc(classRef, { joined_users: updatedUsers });
      setUsers(users.filter((u) => u.id !== userId));

      alert('✅ User removed successfully');
    } catch (error) {
      console.error('Error removing user:', error);
      alert('❌ Failed to remove user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <button
        onClick={() => router.back()}
        className="mb-6 text-blue-600 font-semibold hover:underline"
      >
        ← Back to Admin
      </button>

      <h1 className="text-3xl font-bold mb-6 text-center">👥 Enrolled Users</h1>

      {loading ? (
        <p className="text-center text-gray-700">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-600">No users enrolled yet.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md p-6">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Email</th>
                <th className="border p-3 text-left">Contact No</th>
                {classType === 'upcoming' && <th className="border p-3">Action</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border p-3">{user.full_name || '—'}</td>
                  <td className="border p-3">{user.email}</td>
                  <td className="border p-3">{user.phone || '—'}</td>
                  {classType === 'upcoming' && (
                    <td className="border p-3 text-center">
                      <button
                        onClick={() => handleDisallow(user.id!)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Disallow
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
