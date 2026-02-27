import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ProductType = "kuberX" | "kuberGold";

interface AuditLog {
  action: string;
}

interface AuditSummary {
  id: string;
  action: string;
  count: number;
}

export function useAuditAnalytics(
  product: ProductType = "kuberX",
): AuditSummary[] {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const collectionName =
      product === "kuberGold"
        ? "kuberGoldAdminActivityLogs"
        : "adminActivityLogs";

    const unsub = onSnapshot(collection(db, collectionName), (snap) => {
      setLogs(snap.docs.map((d) => d.data() as AuditLog));
    });

    return () => unsub();
  }, [product]);

  return useMemo(() => {
    const map = new Map<string, number>();

    for (const log of logs) {
      if (!log.action) continue;
      map.set(log.action, (map.get(log.action) ?? 0) + 1);
    }

    return Array.from(map.entries()).map(([action, count]) => ({
      id: `${product}-audit-${action}`, // stable + product-safe
      action,
      count,
    }));
  }, [logs, product]);
}
