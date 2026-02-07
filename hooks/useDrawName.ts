/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type DrawNameState = {
    name: string | null;
    loading: boolean;
    error: string | null;
};

export function useDrawName(drawId?: string | null) {
    const [name, setName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!drawId) {
            setName(null);
            return;
        }

        const id = drawId; // 🔑 hard-narrow for TS

        let active = true;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const ref = doc(db, "draws", id); // ✅ string only
                const snap = await getDoc(ref);

                if (!snap.exists()) {
                    throw new Error("Draw not found");
                }

                if (active) {
                    setName((snap.data() as any).name ?? null);
                }
            } catch (err: any) {
                if (active) {
                    setError(err.message ?? "Failed to load draw");
                    setName(null);
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [drawId]);

    return { name, loading, error };
}

