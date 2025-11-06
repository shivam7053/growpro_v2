"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";

// ✅ Unified UserProfile interface used across signup and profile
export interface UserProfile {
  purchasedClasses?: string[];
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  linkedin?: string;
  created_at?: string;
  role?: string; // ✅ Added role field for admin check
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean; // ✅ Added isAdmin property
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Compute isAdmin based on userProfile role
  const isAdmin = userProfile?.role === "admin";

  // ✅ Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Fetch user profile from Firestore
  const fetchUserProfile = async (userId: string) => {
    try {
      const userRef = doc(db, "user_profiles", userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load user profile");
    }
  };

  // ✅ Sign up with email and password
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateFirebaseProfile(firebaseUser, {
        displayName: fullName || "",
      });

      const newUser: UserProfile = {
        id: firebaseUser.uid,
        full_name: fullName || "",
        email,
        avatar_url: "",
        role: "user", // ✅ Default role is 'user'
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, "user_profiles", firebaseUser.uid), newUser);
      await fetchUserProfile(firebaseUser.uid);
      toast.success("Account created successfully!");
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(error.message || "Failed to create account");
      throw error;
    }
  };

  // ✅ Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  // ✅ Google sign-in
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userRef = doc(db, "user_profiles", firebaseUser.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        const newUser: UserProfile = {
          id: firebaseUser.uid,
          full_name: firebaseUser.displayName || "",
          email: firebaseUser.email || "",
          avatar_url: firebaseUser.photoURL || "",
          role: "user", // ✅ Default role is 'user'
          created_at: new Date().toISOString(),
        };

        await setDoc(userRef, newUser);
      }

      await fetchUserProfile(firebaseUser.uid);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      console.error("Google Sign-in error:", error);
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  // ✅ Sign out user
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      toast.success("Signed out successfully!");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
      throw error;
    }
  };

  // ✅ Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    try {
      const userRef = doc(db, "user_profiles", user.uid);
      await updateDoc(userRef, updates);
      await fetchUserProfile(user.uid);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile");
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAdmin, // ✅ Added isAdmin to context value
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};