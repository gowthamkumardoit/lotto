"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Props = {
  slotId: string;
  digits: number;
};

export function TicketAvailabilityViewer({ slotId, digits }: Props) {
  const [soldTickets, setSoldTickets] = useState<string[]>([]);

  /* ---------------- LOAD SOLD ---------------- */

  useEffect(() => {
    const q = query(
      collection(db, "digitDrawTickets"),
      where("slotId", "==", slotId),
    );

    const unsub = onSnapshot(q, (snap) => {
      const numbers = snap.docs.map((doc) => doc.data().number as string);
      setSoldTickets(numbers);
    });

    return () => unsub();
  }, [slotId]);

  const soldSet = useMemo(() => new Set(soldTickets), [soldTickets]);

  /* ---------------- 2D ---------------- */

  if (digits === 2) {
    const tickets = Array.from({ length: 100 }, (_, i) =>
      i.toString().padStart(2, "0"),
    );

    return <TicketGrid tickets={tickets} soldSet={soldSet} />;
  }

  /* ---------------- 3D ---------------- */

  if (digits === 3) {
    const tabs = Array.from({ length: 10 }, (_, i) => i);

    return (
      <Tabs defaultValue="0">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t.toString()}>
              {t}xx
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => {
          const tickets = Array.from(
            { length: 100 },
            (_, i) => `${t}${i.toString().padStart(2, "0")}`,
          );

          return (
            <TabsContent key={t} value={t.toString()}>
              <TicketGrid tickets={tickets} soldSet={soldSet} />
            </TabsContent>
          );
        })}
      </Tabs>
    );
  }

  /* ---------------- 4D ---------------- */

  if (digits === 4) {
    const tabs = Array.from({ length: 10 }, (_, i) => i);

    return (
      <Tabs defaultValue="0">
        <TabsList className="flex flex-wrap">
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t.toString()}>
              {t}000–{t}999
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => {
          const base = t * 1000;

          const tickets = Array.from({ length: 1000 }, (_, i) =>
            (base + i).toString().padStart(4, "0"),
          );

          return (
            <TabsContent key={t} value={t.toString()}>
              <TicketGrid tickets={tickets} soldSet={soldSet} isFourDigit />
            </TabsContent>
          );
        })}
      </Tabs>
    );
  }

  return null;
}

/* ---------------- GRID COMPONENT ---------------- */

function TicketGrid({
  tickets,
  soldSet,
  isFourDigit,
}: {
  tickets: string[];
  soldSet: Set<string>;
  isFourDigit?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        isFourDigit
          ? "grid-cols-10 md:grid-cols-20"
          : "grid-cols-10 md:grid-cols-20",
      )}
    >
      {tickets.map((ticket) => {
        const isSold = soldSet.has(ticket);

        return (
          <div
            key={ticket}
            className={cn(
              "text-xs text-center py-2 rounded-md border transition",
              isSold
                ? "bg-red-500 text-white border-red-600"
                : "bg-green-100 text-green-800 border-green-300",
            )}
          >
            {ticket}
          </div>
        );
      })}
    </div>
  );
}
