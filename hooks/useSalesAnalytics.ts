"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDateFromDrawRunId } from "@/utils/getDateFromDrawRunId";

interface Ticket {
    amount: number;
    type: "2D" | "3D" | "4D";
    drawRunId: string;
}

export function useSalesAnalytics() {
    const [tickets, setTickets] = useState<Ticket[]>([]);

    useEffect(() => {
        return onSnapshot(collection(db, "tickets"), (snap) => {
            setTickets(snap.docs.map(d => d.data() as Ticket));
        });
    }, []);

    return useMemo(() => {
        let totalSales = 0;
        const dailyMap = new Map<string, { sales: number; tickets: number }>();
        const typeSplit: Record<string, number> = { "2D": 0, "3D": 0, "4D": 0 };

        tickets.forEach(t => {
            totalSales += t.amount;
            typeSplit[t.type] += 1;

            const date = getDateFromDrawRunId(t.drawRunId);
            if (!date) return;

            const d = dailyMap.get(date) ?? { sales: 0, tickets: 0 };
            d.sales += t.amount;
            d.tickets += 1;
            dailyMap.set(date, d);
        });

        return {
            totalSales,
            tickets,
            totalTickets: tickets.length,
            dailySalesData: Array.from(dailyMap.entries()).map(([date, v]) => ({
                date,
                sales: v.sales,
                tickets: v.tickets,
            })),
            ticketTypeSplit: Object.entries(typeSplit).map(([name, value]) => ({
                name,
                value,
            })),
        };
    }, [tickets]);
}
