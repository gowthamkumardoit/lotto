"use client";

import { useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useBonusAnalytics() {
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    totalIssued: 0,
    totalUsed: 0,
    totalRemaining: 0,
    expired: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collectionGroup(db, "bonuses"));

        let issued = 0;
        let used = 0;
        let remaining = 0;
        let expired = 0;

        snap.docs.forEach((doc) => {
          const d: any = doc.data();

          const amount = d.amount ?? 0;
          const rem = d.remaining ?? 0;

          issued += amount;
          remaining += rem;
          used += amount - rem;

          if (d.status === "EXPIRED") expired += amount;
        });

        setData({
          totalIssued: issued,
          totalUsed: used,
          totalRemaining: remaining,
          expired,
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { ...data, loading };
}
