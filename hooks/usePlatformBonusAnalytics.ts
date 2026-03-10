"use client";

import { useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type BonusAnalytics = {
  totalIssued: number;
  totalUsed: number;
  totalRemaining: number;
  totalExpiredUnused: number;
  totalBonuses: number;
};

export function usePlatformBonusAnalytics() {
  const [data, setData] = useState<BonusAnalytics>({
    totalIssued: 0,
    totalUsed: 0,
    totalRemaining: 0,
    totalExpiredUnused: 0,
    totalBonuses: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collectionGroup(db, "bonuses"));

      let issued = 0;
      let used = 0;
      let remaining = 0;
      let expiredUnused = 0;
      let count = 0;

      snap.forEach((doc) => {
        const d: any = doc.data();

        const amount = d.amount ?? 0;
        const rem = d.remaining ?? 0;
        const expired = d.expiredUnused ?? 0;

        issued += amount;
        remaining += rem;
        expiredUnused += expired;

        used += amount - rem - expired;

        count++;
      });

      setData({
        totalIssued: issued,
        totalUsed: used,
        totalRemaining: remaining,
        totalExpiredUnused: expiredUnused,
        totalBonuses: count,
      });

      setLoading(false);
    }

    load();
  }, []);

  return { ...data, loading };
}
