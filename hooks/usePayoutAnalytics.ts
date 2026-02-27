import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ProductType = "kuberX" | "kuberGold";

interface Winner {
  winAmount?: number;
  drawRunId?: string;
}

export function usePayoutAnalytics(product: ProductType = "kuberX") {
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    const collectionName =
      product === "kuberGold" ? "kuberGoldWinners" : "winners";

    const unsub = onSnapshot(collection(db, collectionName), (snap) => {
      setWinners(snap.docs.map((d) => d.data() as Winner));
    });

    return () => unsub();
  }, [product]);

  const totalPayout = useMemo(() => {
    return winners.reduce((sum, w) => {
      return sum + (w.winAmount ?? 0);
    }, 0);
  }, [winners]);

  return {
    totalPayout,
    winners, // keep raw data for dashboard filtering
  };
}
