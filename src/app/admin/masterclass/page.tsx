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
import { Masterclass, MasterclassContent } from '@/types/masterclass';
import { Plus, Trash2, Edit2, Video, X, AlertCircle } from 'lucide-react';

export default function AdminMasterclasses() {
  const router = useRouter();
  const [classes, setClasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);

  // State for the main Masterclass form
  const [formData, setFormData] = useState<any>({
    title: '',
    speaker_name: '',
    speaker_designation: '',
    description: '',
    price: 0,
    type: 'free' as 'free' | 'paid',
    thumbnail_url: '',
    demo_video_url: '', // ✅ NEW: State for the demo video URL
  });

  // State for the MasterclassContent modal (for YouTube/Zoom)
  const [contentFormData, setContentFormData] = useState<Partial<MasterclassContent>>({
    id: '',
    title: '',
    order: 0,
    description: '',
    source: 'youtube' as 'youtube' | 'zoom',
    youtube_url: '',
    zoom_meeting_id: '',
    zoom_passcode: '',
    zoom_link: '',
    scheduled_date: '',
  });

  const [currentContent, setCurrentContent] = useState<MasterclassContent[]>([]);
  const [editingContentIndex, setEditingContentIndex] = useState<number | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'MasterClasses'));
      const masterclassList: Masterclass[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const purchasedByUsers: string[] = Array.isArray(data.purchased_by_users)
          ? data.purchased_by_users.filter((id) => typeof id === 'string')
          : [];

        masterclassList.push({
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          speaker_name: data.speaker_name || '',
          speaker_designation: data.speaker_designation || '',
          thumbnail_url: data.thumbnail_url || '',
          price: data.price || 0,
          type: data.type || 'free',
          created_at: data.created_at?.toDate()?.toISOString() || new Date().toISOString(),
          content: data.content || [],
          purchased_by_users: purchasedByUsers,
          demo_video_url: data.demo_video_url || '', // ✅ NEW: Fetch the demo video URL
        } as Masterclass);
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

  const handleAddContent = () => {
    // Validation for content form
    if (!contentFormData.title || !contentFormData.title.trim()) {
      return alert('Content title is required');
    }

    if (contentFormData.source === 'youtube' && (!contentFormData.youtube_url || !contentFormData.youtube_url.trim())) {
      return alert('YouTube URL is required for YouTube content.');
    }

    if (contentFormData.source === 'zoom' && (!contentFormData.zoom_meeting_id || !contentFormData.zoom_meeting_id.trim())) {
      return alert('Zoom Meeting ID is required for Zoom content.');
    }

    const newContent: MasterclassContent = {
      id: `video_${Date.now()}`,
      ...contentFormData,
      order: currentContent.length,
    } as MasterclassContent;

    if (editingContentIndex !== null) {
      const updated = [...currentContent];
      updated[editingContentIndex] = newContent;
      setCurrentContent(updated);
      setEditingContentIndex(null);
    } else {
      setCurrentContent([...currentContent, newContent]);
    }

    // Reset modal form
    setContentFormData({
      id: '',
      title: '',
      order: 0,
      description: '',
      source: 'youtube',
      youtube_url: '',
      zoom_meeting_id: '',
      zoom_passcode: '',
      zoom_link: '',
      scheduled_date: '',
    });
    setShowContentModal(false);
  };

  const handleEditContent = (index: number) => {
    const contentItem = currentContent[index];
    setContentFormData({
      ...contentItem,
    });
    setEditingContentIndex(index);
    setShowContentModal(true);
  };

  const handleDeleteContent = (index: number) => {
    if (confirm('Are you sure you want to delete this content item?')) {
      const updatedContent = currentContent.filter((_, i) => i !== index);
      // Re-order the remaining items
      setCurrentContent(updatedContent.map((item, idx) => ({ ...item, order: idx })));
    }
  };

  const validateForm = () => {
    if (!formData.title || !formData.title.trim()) {
      alert('Title is required');
      return false;
    }
    if (!formData.speaker_name || !formData.speaker_name.trim()) {
      alert('Speaker name is required');
      return false;
    }

    if (currentContent.length === 0) {
      alert('A masterclass must have at least one piece of content (a video or a zoom session).');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const dataToSave: any = {
        title: formData.title,
        speaker_name: formData.speaker_name,
        speaker_designation: formData.speaker_designation,
        description: formData.description,
        price: Number(formData.price) || 0,
        type: formData.type,
        thumbnail_url: formData.thumbnail_url,
        demo_video_url: formData.demo_video_url, // ✅ NEW: Save the demo video URL
        content: currentContent,
      };

      if (editingId) {
        await updateDoc(doc(db, 'MasterClasses', editingId), dataToSave);
        alert('✅ Masterclass updated successfully!');
      } else {
        await addDoc(collection(db, 'MasterClasses'), {
          ...dataToSave,
          purchased_by_users: [],
          created_at: serverTimestamp(),
        });
        alert('✅ Masterclass added successfully!');
      }

      // reset
      setFormData({
        title: '',
        speaker_name: '',
        speaker_designation: '',
        description: '',
        price: 0,
        type: 'free',
        thumbnail_url: '',
        demo_video_url: '',
      });
      setCurrentContent([]);
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
      description: cls.description || '',
      price: cls.price || 0,
      type: cls.type || 'free',
      thumbnail_url: cls.thumbnail_url || '',
      demo_video_url: cls.demo_video_url || '', // ✅ NEW: Populate form on edit
    });

    setCurrentContent(cls.content || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      speaker_name: '',
      speaker_designation: '',
      description: '',
      price: 0,
      type: 'free',
      thumbnail_url: '',
      demo_video_url: '',
    });
    setCurrentContent([]);
  };

  // Calculate pricing info from content
  const calculatePricingInfo = () => {
    return { isFree: formData.type === 'free', price: formData.price };
  };

  const pricingInfo = calculatePricingInfo();

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

          <select
            value={formData.type}
            onChange={(e) => {
              const newType = e.target.value as 'free' | 'paid';
              setFormData({
                ...formData,
                type: newType,
                price: newType === 'free' ? 0 : formData.price,
              });
            }}
            className="border p-3 rounded-lg text-gray-900"
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>

          {formData.type === 'paid' && (
            <input
              type="number"
              placeholder="Price (₹) *"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="border p-3 rounded-lg text-gray-900"
            />
          )}
          <input type="text" placeholder="Thumbnail URL"
            value={formData.thumbnail_url}
            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
            className="border p-3 rounded-lg text-gray-900" />
            
          {/* ✅ NEW: Demo Video URL Input */}
          <input type="text" placeholder="Demo Video URL (Optional, YouTube)"
            value={formData.demo_video_url}
            onChange={(e) => setFormData({ ...formData, demo_video_url: e.target.value })}
            className="border p-3 rounded-lg text-gray-900" />
        </div>

        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="border p-3 rounded-lg text-gray-900 w-full mt-4"
          rows={3}
        />

        {/* Pricing Info Banner */}
        {formData.type === 'paid' && (
          <div className={`mt-4 p-4 rounded-lg ${pricingInfo.isFree ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${pricingInfo.isFree ? 'text-green-600' : 'text-orange-600'}`} />
              <div>
                <p className="font-semibold text-gray-900">Pricing Summary</p>
                <p className="text-sm text-gray-700">This masterclass is set to 'Paid' with a price of ₹{pricingInfo.price || 0}.</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Section (Videos and Zoom sessions) */}
        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Content ({currentContent.length})</h3>
            <button
              type="button"
              onClick={() => setShowContentModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Content
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentContent.map((item, index) => (
              <div key={item.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold">{index + 1}. {item.title} <span className="text-xs font-normal capitalize bg-gray-200 px-2 py-0.5 rounded-full">{item.source}</span></p>
                  <p className="text-sm text-gray-600 truncate">{item.source === 'youtube' ? item.youtube_url : `Zoom ID: ${item.zoom_meeting_id}`}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEditContent(index)} className="text-blue-600 hover:text-blue-800">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDeleteContent(index)} className="text-red-600 hover:text-red-800">
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

      {/* Content Modal */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingContentIndex !== null ? 'Edit Content' : 'Add New Content'}</h3>
              <button onClick={() => {
                setShowContentModal(false);
                setEditingContentIndex(null);
                setContentFormData({
                  id: '',
                  title: '',
                  order: 0,
                  description: '',
                  source: 'youtube',
                  zoom_link: '',
                });
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <select
                value={contentFormData.source}
                onChange={(e) => setContentFormData({ ...contentFormData, source: e.target.value as 'youtube' | 'zoom' })}
                className="w-full border p-3 rounded-lg"
              >
                <option value="youtube">YouTube Video</option>
                <option value="zoom">Zoom Session</option>
              </select>

              <input
                type="text"
                placeholder="Content Title *"
                value={contentFormData.title}
                onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })}
                className="w-full border p-3 rounded-lg"
              />

              {contentFormData.source === 'youtube' && (
                <input
                  type="text"
                  placeholder="YouTube URL *"
                  value={contentFormData.youtube_url}
                  onChange={(e) => setContentFormData({ ...contentFormData, youtube_url: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              )}

              {contentFormData.source === 'zoom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Zoom Join Link"
                    value={contentFormData.zoom_link}
                    onChange={(e) => setContentFormData({ ...contentFormData, zoom_link: e.target.value })}
                    className="w-full border p-3 rounded-lg col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Zoom Meeting ID *"
                    value={contentFormData.zoom_meeting_id}
                    onChange={(e) => setContentFormData({ ...contentFormData, zoom_meeting_id: e.target.value })}
                    className="w-full border p-3 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Zoom Passcode"
                    value={contentFormData.zoom_passcode}
                    onChange={(e) => setContentFormData({ ...contentFormData, zoom_passcode: e.target.value })}
                    className="w-full border p-3 rounded-lg"
                  />
                  <input
                    type="datetime-local"
                    value={contentFormData.scheduled_date}
                    onChange={(e) => setContentFormData({ ...contentFormData, scheduled_date: e.target.value })}
                    className="w-full border p-3 rounded-lg col-span-2"
                  />
                </div>
              )}

              <input
                type="text"
                placeholder="Duration (e.g., 45 min)"
                value={contentFormData.duration}
                onChange={(e) => setContentFormData({ ...contentFormData, duration: e.target.value })}
                className="w-full border p-3 rounded-lg"
              />

              <textarea
                placeholder="Content Description"
                value={contentFormData.description}
                onChange={(e) => setContentFormData({ ...contentFormData, description: e.target.value })}
                className="w-full border p-3 rounded-lg"
                rows={3}
              />

              <button
                onClick={handleAddContent}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
              >
                {editingContentIndex !== null ? 'Update Content' : 'Add Content'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Masterclasses */}
      {loading ? (
        <p className="text-center text-gray-700 font-medium">Loading...</p>
      ) : classes.length === 0 ? (
        <p className="text-center text-gray-700 font-medium">No masterclasses found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-900">{cls.title}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase text-white ${cls.type === 'paid' ? 'bg-purple-500' : 'bg-green-500'}`}>
                  {cls.type === 'paid' ? `₹${cls.price}` : 'FREE'}
                </span>
              </div>

              <p className="text-sm text-gray-800">
                {cls.speaker_name} • {cls.speaker_designation || '—'}
              </p>
              <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                <Video className="w-4 h-4" /> {cls.content?.length || 0} content items
              </p>

              <p className="text-xs text-gray-600 mt-1">Created: {new Date(cls.created_at).toLocaleDateString()}</p>

              <div className="mt-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-sm mb-1 text-gray-800">
                  👥 Enrolled Users ({cls.purchased_by_users?.length || 0})
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
