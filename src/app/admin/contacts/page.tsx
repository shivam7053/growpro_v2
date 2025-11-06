"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Trash2, Mail, User, MessageSquare, Calendar } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch all contact messages
  const fetchContacts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "contacts"));
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "—",
          email: data.email || "—",
          subject: data.subject || "—",
          message: data.message || "—",
          createdAt: data.createdAt
            ? new Date(data.createdAt.seconds * 1000).toLocaleString()
            : "N/A",
        } as Contact;
      });
      setContacts(list);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      alert("❌ Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete message
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteDoc(doc(db, "contacts", id));
      setContacts(contacts.filter((msg) => msg.id !== id));
    } catch (err) {
      console.error("Error deleting contact:", err);
      alert("❌ Failed to delete contact.");
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <motion.h1
        className="text-3xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        📬 Contact Us Messages
      </motion.h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading messages...</p>
      ) : contacts.length === 0 ? (
        <p className="text-center text-gray-600">No contact messages found.</p>
      ) : (
        <div className="overflow-x-auto max-w-6xl mx-auto">
          <table className="min-w-full bg-white rounded-xl shadow-md">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="py-3 px-4 font-semibold text-gray-700">
                  Subject
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">
                  Message
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">
                  Created At
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((msg) => (
                <tr
                  key={msg.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  {/* CORRECTED: Removed flex from <td>, applied it to an inner div/span */}
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-2"> 
                      <User className="w-4 h-4 text-gray-500" />
                      {msg.name}
                    </span>
                  </td>
                  {/* CORRECTED: Removed flex from <td>, applied it to an inner div/span */}
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {msg.email}
                    </span>
                  </td>
                  <td className="py-3 px-4">{msg.subject}</td>
                  {/* CORRECTED: Removed flex from <td>, applied it to an inner div/span */}
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-500 shrink-0" /> {/* shrink-0 keeps icon from shrinking */}
                      <span className="truncate max-w-xs">{msg.message}</span>
                    </span>
                  </td>
                  {/* CORRECTED: Removed flex from <td>, applied it to an inner div/span */}
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {msg.createdAt}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}