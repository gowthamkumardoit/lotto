"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDateFromDrawRunId } from "@/utils/getDateFromDrawRunId";

type ProductType = "kuberX" | "kuberGold";

interface Ticket {
  amount: number;
  type: "2D" | "3D" | "4D";
  drawRunId?: string;
  slotId?: string;
  createdAt?: any;
}

export function useSalesAnalytics(product: ProductType = "kuberX") {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const collectionName =
      product === "kuberGold" ? "kuberGoldTickets" : "tickets";

    const unsub = onSnapshot(collection(db, collectionName), (snap) => {
      setTickets(snap.docs.map((d) => d.data() as Ticket));
    });

    return () => unsub();
  }, [product]);

  return useMemo(() => {
    let totalSales = 0;

    const dailyMap = new Map<string, { sales: number; tickets: number }>();
    const typeSplit: Record<string, number> = {
      "2D": 0,
      "3D": 0,
      "4D": 0,
    };

    tickets.forEach((t) => {
      totalSales += t.amount ?? 0;
      typeSplit[t.type] += 1;

      let date: string | null = null;

      if (product === "kuberX") {
        const d = getDateFromDrawRunId(t.drawRunId);
        if (d) date = d;
      } else {
        // Kuber Gold → use createdAt
        if (t.createdAt?.toDate) {
          date = t.createdAt.toDate().toISOString().split("T")[0];
        }
      }

      if (!date) return;

      const existing = dailyMap.get(date) ?? { sales: 0, tickets: 0 };

      existing.sales += t.amount ?? 0;
      existing.tickets += 1;

      dailyMap.set(date, existing);
    });

    return {
      totalSales,
      tickets,
      totalTickets: tickets.length,

      dailySalesData: Array.from(dailyMap.entries())
        .map(([date, v]) => ({
          date,
          sales: v.sales,
          tickets: v.tickets,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),

      ticketTypeSplit: Object.entries(typeSplit).map(([name, value]) => ({
        name,
        value,
      })),
    };
  }, [tickets, product]);
}
