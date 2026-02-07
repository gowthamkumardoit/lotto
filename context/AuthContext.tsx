/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;

  // Google
  loginWithGoogle: () => Promise<void>;

  // Mobile OTP
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;

  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );

  // 🔐 Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  // 🔑 Google Login
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  // 📲 Send OTP
  async function sendOtp(phone: string) {
    if (typeof window === "undefined") return;

    if (!phone.startsWith("+")) {
      throw new Error("Phone number must include country code (+91)");
    }

    // 🔒 Always create a FRESH verifier
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });

    // 🔴 REQUIRED in Next.js
    await verifier.render();

    const confirmation = await signInWithPhoneNumber(auth, phone, verifier);

    setConfirmation(confirmation);
  }

  // ✅ Verify OTP
  async function verifyOtp(code: string) {
    if (!confirmation) {
      throw new Error("OTP session expired");
    }

    const result = await confirmation.confirm(code);

    // 🔴 FORCE token refresh (VERY IMPORTANT)
    await result.user.getIdToken(true);
  }

  // 🚪 Logout
  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        sendOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}

      {/* Required for Firebase Phone Auth */}
      <div id="recaptcha-container" />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
