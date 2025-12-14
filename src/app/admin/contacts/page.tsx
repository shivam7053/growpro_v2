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
    <div className="min-h-screen bg-gray-100 py-12 px-6 text-gray-900">
      <motion.h1
        className="text-4xl font-bold text-center mb-10 text-gray-900"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        📬 Contact Us Messages
      </motion.h1>

      {loading ? (
        <p className="text-center text-gray-700 font-medium">
          Loading messages...
        </p>
      ) : contacts.length === 0 ? (
        <p className="text-center text-gray-700 font-medium">
          No contact messages found.
        </p>
      ) : (
        <div className="overflow-x-auto max-w-6xl mx-auto">
          <table className="min-w-full bg-white rounded-xl shadow-lg border border-gray-200">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="py-3 px-4 font-semibold text-gray-900">Name</th>
                <th className="py-3 px-4 font-semibold text-gray-900">Email</th>
                <th className="py-3 px-4 font-semibold text-gray-900">Subject</th>
                <th className="py-3 px-4 font-semibold text-gray-900">Message</th>
                <th className="py-3 px-4 font-semibold text-gray-900">
                  Created At
                </th>
                <th className="py-3 px-4 font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((msg) => (
                <tr
                  key={msg.id}
                  className="border-b hover:bg-gray-100 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-800 font-medium">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      {msg.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-800">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      {msg.email}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-800">{msg.subject}</td>
                  <td className="py-3 px-4 text-gray-700">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-600 shrink-0" />
                      <span className="truncate max-w-xs">{msg.message}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      {msg.createdAt}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
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
