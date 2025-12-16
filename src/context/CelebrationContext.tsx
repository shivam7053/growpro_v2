"use client";

import React, { createContext, useContext, useState } from "react";

interface CelebrationContextType {
  isCelebrating: boolean;
  triggerCelebration: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(
  undefined
);

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error(
      "useCelebration must be used within a CelebrationProvider"
    );
  }
  return context;
};

export const CelebrationProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCelebrating, setIsCelebrating] = useState(false);
  const triggerCelebration = () => {
    setIsCelebrating(true);
    setTimeout(() => setIsCelebrating(false), 5000); // 5 seconds
  };
  return (
    <CelebrationContext.Provider value={{ isCelebrating, triggerCelebration }}>{children}</CelebrationContext.Provider>
  );
};