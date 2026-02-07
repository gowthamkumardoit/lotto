"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

type WinnerRow = {
  ticketId: string;
  userId: string;
  username?: string;
  phone?: string;
  type: "2D" | "3D" | "4D";
  number: string;
  amount: number;
  winAmount: number;
};

export default function WinnersPanel({
  drawRunId,
  status,
}: {
  drawRunId: string;
  status: string;
}) {
  const [rows, setRows] = useState<WinnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "SETTLED") {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "tickets"),
      where("drawRunId", "==", drawRunId),
      where("status", "==", "WON")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const winners: WinnerRow[] = [];

      for (const docSnap of snap.docs) {
        const t = docSnap.data();

        // 🔗 JOIN USER
        const userSnap = await getDoc(doc(db, "users", t.userId));
        const user = userSnap.exists() ? userSnap.data() : null;

        winners.push({
          ticketId: docSnap.id,
          userId: t.userId,
          username: user?.username ?? "Test User—",
          phone: user?.phone ?? "",
          type: t.type,
          number: t.number,
          amount: t.amount,
          winAmount: t.winAmount,
        });
      }

      setRows(winners);
      setLoading(false);
    });

    return () => unsub();
  }, [drawRunId, status]);

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (status !== "SETTLED") {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Winners will appear after settlement.
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        No winning tickets for this draw.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="p-3 text-left">User</th>
            <th className="p-3 text-left">UID</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Number</th>
            <th className="p-3 text-left">Bet</th>
            <th className="p-3 text-left">Win</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.ticketId} className="border-b">
              <td className="p-3 font-medium">{r.username}</td>
              <td className="p-3 text-xs text-muted-foreground">
                {r.userId}
              </td>
              <td className="p-3">{r.type}</td>
              <td className="p-3 font-mono">{r.number}</td>
              <td className="p-3">₹{r.amount}</td>
              <td className="p-3 font-semibold text-green-600">
                ₹{r.winAmount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
