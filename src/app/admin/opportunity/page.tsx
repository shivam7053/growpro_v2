"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  types?: string;
  salary: string;
  description: string;
  skills: string[];
  posted_date: string;
  applied_user?: string[];
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

const TYPE_OPTIONS = [
  { id: "tech", name: "Technology" },
  { id: "marketing", name: "Marketing" },
  { id: "design", name: "Design" },
  { id: "content", name: "Content" },
];

export default function AdminOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [newOpp, setNewOpp] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
    types: "",
    salary: "",
    description: "",
    skills: "",
  });

  // 🔹 Fetch all opportunities
  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "opportunities"));
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Opportunity[];
      setOpportunities(list);
    } catch (err) {
      console.error("Error fetching opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch all users (for showing applied names & emails)
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "user_profiles"));
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchUsers();
  }, []);

  // 🔹 Add / Update opportunity
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = ["title", "company", "location", "type", "types"];
    for (const field of requiredFields) {
      if (!newOpp[field as keyof typeof newOpp]) {
        alert(`Please fill the ${field} field`);
        return;
      }
    }

    try {
      setSaving(true);

      if (editId) {
        const oppRef = doc(db, "opportunities", editId);
        await updateDoc(oppRef, {
          ...newOpp,
          skills: newOpp.skills
            ? newOpp.skills.split(",").map((s) => s.trim())
            : [],
        });
        alert("✅ Opportunity updated successfully!");
      } else {
        await addDoc(collection(db, "opportunities"), {
          ...newOpp,
          skills: newOpp.skills
            ? newOpp.skills.split(",").map((s) => s.trim())
            : [],
          posted_date: new Date().toISOString().split("T")[0],
          created_at: serverTimestamp(),
          applied_user: [],
        });
        alert("✅ Opportunity added successfully!");
      }

      setNewOpp({
        title: "",
        company: "",
        location: "",
        type: "",
        types: "",
        salary: "",
        description: "",
        skills: "",
      });

      setEditId(null);
      fetchOpportunities();
    } catch (err) {
      console.error("Error saving opportunity:", err);
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Delete opportunity
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    try {
      await deleteDoc(doc(db, "opportunities", id));
      setOpportunities(opportunities.filter((o) => o.id !== id));
    } catch (err) {
      console.error("Error deleting opportunity:", err);
    }
  };

  // 🔹 Edit handler
  const handleEdit = (opp: Opportunity) => {
    setEditId(opp.id);
    setNewOpp({
      title: opp.title,
      company: opp.company,
      location: opp.location,
      type: opp.type,
      types: opp.types || "",
      salary: opp.salary,
      description: opp.description,
      skills: opp.skills?.join(", ") || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ Get applied user names & emails
  const getAppliedUsers = (applied_user?: string[]) => {
    if (!applied_user || applied_user.length === 0) return "No applicants yet";
    const details = applied_user
      .map((uid) => {
        const user = users.find((u) => u.id === uid);
        if (user) return `${user.full_name} (${user.email})`;
        return null;
      })
      .filter(Boolean);
    return details.length > 0 ? details.join(", ") : "Unknown users";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        💼 Manage Global Opportunities
      </h1>

      {/* Form */}
      <form
        onSubmit={handleSave}
        className="bg-white shadow-md rounded-xl p-6 max-w-2xl mx-auto mb-10"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editId ? "✏️ Edit Opportunity" : "➕ Add New Opportunity"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Title *"
            value={newOpp.title}
            onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
            className="border p-3 rounded-lg"
          />
          <input
            type="text"
            placeholder="Company *"
            value={newOpp.company}
            onChange={(e) => setNewOpp({ ...newOpp, company: e.target.value })}
            className="border p-3 rounded-lg"
          />
          <input
            type="text"
            placeholder="Location *"
            value={newOpp.location}
            onChange={(e) => setNewOpp({ ...newOpp, location: e.target.value })}
            className="border p-3 rounded-lg"
          />
          <input
            type="text"
            placeholder="Job Type (Internship, Full-Time)"
            value={newOpp.type}
            onChange={(e) => setNewOpp({ ...newOpp, type: e.target.value })}
            className="border p-3 rounded-lg"
          />

          <select
            value={newOpp.types}
            onChange={(e) => setNewOpp({ ...newOpp, types: e.target.value })}
            className="border p-3 rounded-lg bg-white"
          >
            <option value="">Select Category *</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Salary"
            value={newOpp.salary}
            onChange={(e) => setNewOpp({ ...newOpp, salary: e.target.value })}
            className="border p-3 rounded-lg"
          />
          <input
            type="text"
            placeholder="Skills (comma separated)"
            value={newOpp.skills}
            onChange={(e) => setNewOpp({ ...newOpp, skills: e.target.value })}
            className="border p-3 rounded-lg"
          />
        </div>

        <textarea
          placeholder="Description"
          value={newOpp.description}
          onChange={(e) =>
            setNewOpp({ ...newOpp, description: e.target.value })
          }
          className="border p-3 rounded-lg mt-4 w-full"
          rows={4}
        />

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving
              ? editId
                ? "Updating..."
                : "Adding..."
              : editId
              ? "Update Opportunity"
              : "Add Opportunity"}
          </button>

          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setNewOpp({
                  title: "",
                  company: "",
                  location: "",
                  type: "",
                  types: "",
                  salary: "",
                  description: "",
                  skills: "",
                });
              }}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Show Opportunities */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-3"></div>
          <p className="text-gray-600">Loading opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <p className="text-center text-gray-600">No opportunities found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold mb-2">{opp.title}</h2>
                <p className="text-gray-600">
                  {opp.company} • {opp.location}
                </p>
                <p className="mt-2 text-gray-700">💰 {opp.salary}</p>
                <p className="text-sm text-gray-600 mt-1">
                  🏷️ {opp.type} | {opp.types ? opp.types : "N/A"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  🧠 Skills: {opp.skills?.join(", ")}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  📅 Posted: {opp.posted_date}
                </p>

                {/* ✅ Applied user names + emails */}
                <p className="text-sm text-gray-600 mt-4">
                  👥 Applied Users:{" "}
                  <span className="font-medium">
                    {getAppliedUsers(opp.applied_user)}
                  </span>
                </p>
              </div>

              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => handleEdit(opp)}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(opp.id)}
                  className="text-red-600 font-semibold hover:underline"
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
