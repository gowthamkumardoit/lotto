import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
export type TopupRequest = {
  id: string;
  userId: string;
  amount: number;
  utr: string;
  status: "SUBMITTED" | "APPROVED" | "REJECTED";

  // 📎 PROOF & AUDIT
  proofUrl?: string;
  adminNote?: string;
  approvedAt?: Date;
  approvedBy?: string;

  // 🕓 TIMESTAMPS
  createdAt: Date;
};

export function useTopupRequests(refreshKey?: number) {
  const [data, setData] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "topupRequests"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => {
        const v = d.data();
        return {
          id: d.id,
          userId: v.userId,
          amount: v.amount,
          utr: v.utr,
          status: v.status,

          // ✅ ADD THESE
          proofUrl: v.proofUrl,
          adminNote: v.adminNote,
          approvedAt: v.approvedAt?.toDate?.(),
          approvedBy: v.approvedBy,

          createdAt: v.createdAt?.toDate?.() ?? new Date(),
        };
      });

      setData(rows);
      setLoading(false);
    });

    return () => unsub();
  }, [refreshKey]);

  return { data, loading };
}
