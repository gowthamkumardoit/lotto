import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Winner {
  winAmount?: number;
  drawRunId?: string;
}

export function usePayoutAnalytics() {
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, "winners"), (snap) => {
      setWinners(snap.docs.map((d) => d.data() as Winner));
    });
  }, []);

  const totalPayout = useMemo(() => {
    return winners.reduce(
      (sum, w) => sum + (w.winAmount ?? 0),
      0,
    );
  }, [winners]);

  return {
    totalPayout,
    winners, // ✅ expose raw data
  };
}
