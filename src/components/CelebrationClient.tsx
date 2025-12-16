"use client";

import React from "react";
import { useCelebration } from "@/context/CelebrationContext";

export default function CelebrationClient() {
  const { isCelebrating } = useCelebration();

  if (!isCelebrating) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {[...Array(150)].map((_, i) => {
        const randomX = Math.random() * 100;
        const randomDelay = Math.random() * 0.8;
        const randomDuration = 3 + Math.random() * 2;
        const randomRotation = Math.random() * 360;
        const randomSize = 10 + Math.random() * 10;
        const colors = [
          "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
          "#98D8C8", "#F7DC6F", "#BB8FCE", "#FF1493", "#00CED1",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const shapes = ["●", "★", "■", "▲", "◆"];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

        return (
          <div
            key={i}
            className="absolute animate-confetti font-bold"
            style={{
              left: `${randomX}vw`,
              top: "-50px",
              color: randomColor,
              fontSize: `${randomSize}px`,
              animationDelay: `${randomDelay}s`,
              animationDuration: `${randomDuration}s`,
              transform: `rotate(${randomRotation}deg)`,
            }}
          >
            {randomShape}
          </div>
        );
      })}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(1080deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}