//chatbot

"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Minimize2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getChatbotResponse } from "./actions";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi! I'm the GrowPro assistant. How can I help you today?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const responseText = await getChatbotResponse(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to get response", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <>
      {/* Toggle Button - Dark Theme */}
      <motion.button
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 999999,
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        className="p-4 text-white rounded-full shadow-2xl hover:shadow-white/20 transition-all duration-300"
        whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(255, 255, 255, 0.2)" }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <Minimize2 className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window - Dark Theme */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chatbot-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              bottom: "100px",
              right: "24px",
              zIndex: 999999,
              height: "500px",
              maxHeight: "500px",
            }}
            className="w-80 md:w-96 h-[500px] bg-gray-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header - Dark with subtle gradient */}
            <div className="p-4 bg-gradient-to-r from-gray-900 to-black border-b border-white/10 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">GrowPro Support</h3>
                <p className="text-xs text-gray-400">Ask me anything!</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages - Dark background with proper scrolling */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800" style={{ maxHeight: "calc(500px - 140px)" }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm break-words ${
                      msg.sender === "user"
                        ? "bg-white text-gray-900 rounded-br-none"
                        : "bg-gray-700 text-white rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 p-3 rounded-2xl rounded-bl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input - Dark theme */}
            <div className="p-4 bg-gray-900 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-full border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}