import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AuditLog {
  action: string;
}

interface AuditSummary {
  id: string;      // ✅ stable key
  action: string;
  count: number;
}

export function useAuditAnalytics(): AuditSummary[] {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "adminActivityLogs"),
      (snap) => {
        setLogs(snap.docs.map((d) => d.data() as AuditLog));
      }
    );

    return () => unsub();
  }, []);

  return useMemo(() => {
    const map = new Map<string, number>();

    for (const log of logs) {
      if (!log.action) continue;
      map.set(log.action, (map.get(log.action) ?? 0) + 1);
    }

    return Array.from(map.entries()).map(([action, count]) => ({
      id: `audit-${action}`, // ✅ deterministic & unique
      action,
      count,
    }));
  }, [logs]);
}
