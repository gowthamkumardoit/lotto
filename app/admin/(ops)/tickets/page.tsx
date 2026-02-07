"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { format } from "date-fns";

import { db } from "@/lib/firebase";
import {
  TicketFilterSidebar,
  Filters,
} from "@/components/tickets/TicketFilters";
import { TicketsTable } from "./TicketsPageTable";
type TicketStatus = "OPEN" | "LOCKED" | "WON" | "LOST";
type Ticket = {
  id: string;
  ticketNumber: string;
  type: "2D" | "3D" | "4D";
  amount: number;
  status: TicketStatus;
  createdAt: string;
  createdAtRaw?: Date;
};
export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    types: [],
    statuses: [],
  });

  /* ---------------- FIREBASE ---------------- */

  useEffect(() => {
    const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const rows: Ticket[] = snap.docs.map((doc) => {
        const d = doc.data();

        const createdAtDate = d.createdAt?.toDate();

        return {
          id: doc.id,
          ticketNumber: d.number,
          type: d.type,
          amount: d.amount,
          status: d.status,
          createdAt: createdAtDate ? format(createdAtDate, "dd MMM yyyy") : "",
          createdAtRaw: createdAtDate,
        };
      });

      setTickets(rows);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------------- FILTERING ---------------- */

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // SEARCH
      if (
        filters.search &&
        !t.ticketNumber.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // TYPE
      if (filters.types.length && !filters.types.includes(t.type)) {
        return false;
      }

      // STATUS
      if (filters.statuses.length && !filters.statuses.includes(t.status)) {
        return false;
      }

      // DATE RANGE
      if (filters.dateFrom || filters.dateTo) {
        if (!t.createdAtRaw) return false;

        if (filters.dateFrom && t.createdAtRaw < filters.dateFrom) {
          return false;
        }

        if (filters.dateTo && t.createdAtRaw > filters.dateTo) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, filters]);

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-7xl flex gap-6">
        {/* FILTERS */}
        <TicketFilterSidebar onChange={setFilters} />

        {/* CONTENT */}
        <main className="flex-1 space-y-4">
          <div className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-800">Tickets</h2>
            <p className="text-sm text-neutral-500">
              All tickets placed by users
            </p>
          </div>

          <TicketsTable
            data={filteredTickets}
            loading={loading}
            onRowClick={(t) => console.log("Clicked:", t.id)}
          />
        </main>
      </div>
    </div>
  );
}
