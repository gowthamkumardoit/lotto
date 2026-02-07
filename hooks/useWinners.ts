/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Winner } from "@/types/winners";

type UseWinnersResult = {
  winners: Winner[];
  loading: boolean;
  error: string | null;
};

export function useWinners(): UseWinnersResult {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const q = query(collection(db, "winners"));
        const snap = await getDocs(q);

        if (!active) return;

        const data: Winner[] = snap.docs.map((d) => {
          const raw = d.data() as any;

          return {
            id: d.id,
            userId: raw.userId,
            number: raw.number,
            type: raw.type,
            betAmount: raw.betAmount,
            winAmount: raw.winAmount,
            multiplier: raw.multiplier,
            drawId: raw.drawId,
            drawRunId: raw.drawRunId,

            // ✅ normalize settledAt safely
            settledAt:
              typeof raw.settledAt === "string"
                ? raw.settledAt
                : raw.settledAt?.toDate?.().toISOString() ?? "",
          };
        });

        setWinners(data);
      } catch (err: any) {
        if (!active) return;
        setError(err.message ?? "Failed to load winners");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return { winners, loading, error };
}
