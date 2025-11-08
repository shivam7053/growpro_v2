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
import { UserProfile } from "@/types/auth"; // ✅ Shared type import

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
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

  const isAdmin = false;

  // ✅ Watch for auth changes
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

  // ✅ Fetch Firestore profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const userRef = doc(db, "user_profiles", userId);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;

        // ✅ Ensure new fields exist
        setUserProfile({
          ...data,
          purchasedClasses: data.purchasedClasses || [],
          transactions: data.transactions || [],
        });
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load user profile");
    }
  };

  // ✅ Sign Up (Email & Password)
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      await updateFirebaseProfile(firebaseUser, { displayName: fullName || "" });

      const newUser: UserProfile = {
        id: firebaseUser.uid,
        email,
        full_name: fullName || "",
        phone: "",
        avatar_url: "",
        bio: "",
        linkedin: "",
        created_at: new Date().toISOString(),
        purchasedClasses: [],
        transactions: [],
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

  // ✅ Sign In
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

  // ✅ Google Sign In
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
          email: firebaseUser.email || "",
          full_name: firebaseUser.displayName || "",
          avatar_url: firebaseUser.photoURL || "",
          created_at: new Date().toISOString(),
          purchasedClasses: [],
          transactions: [],
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

  // ✅ Sign Out
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

  // ✅ Update Firestore profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    try {
      const userRef = doc(db, "user_profiles", user.uid);
      await updateDoc(userRef, updates);
      await fetchUserProfile(user.uid);
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
    isAdmin,
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
