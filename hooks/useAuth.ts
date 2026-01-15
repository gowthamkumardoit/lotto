// /hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type AuthState = {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
};

export function useAuth(): AuthState {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (!firebaseUser) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            try {
                // 🔐 optional: check admin role from Firestore
                const snap = await getDoc(doc(db, "admins", firebaseUser.uid));
                setIsAdmin(snap.exists());
            } catch {
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
    }, []);

    return {
        user,
        isAdmin,
        loading,
    };
}
