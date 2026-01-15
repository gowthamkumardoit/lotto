/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

export function usePlatformSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "platformConfig", "global");

    const unsub = onSnapshot(ref, (snap) => {
      setSettings(snap.data());
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { settings, loading };
}
