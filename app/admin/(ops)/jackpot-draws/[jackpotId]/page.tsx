"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { Loader2, ArrowLeft } from "lucide-react";

import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JackpotSummaryCards } from "@/components/jackpotDraw/JackpotDrawSummary";
import { DotGrid } from "@/components/jackpotDraw/DotGrid";
import { TicketRangeHeatMap } from "@/components/jackpotDraw/TicketRangeHeatMap";
import { TicketRangeHeatMapLegend } from "@/components/jackpotDraw/TicketRangeHeatMapLegend";
import { TicketVelocityStrip } from "@/components/jackpotDraw/TicketVelocityStrip";

/* ---- JACKPOT COMPOSED COMPONENTS ---- */
// import { JackpotSummaryCards } from "@/components/jackpots/details/JackpotSummaryCards";
// import { JackpotPrizeBreakdown } from "@/components/jackpots/details/JackpotPrizeBreakdown";
// import { JackpotWinnersPanel } from "@/components/jackpots/details/JackpotWinnersPanel";
// import { JackpotAuditPanel } from "@/components/jackpots/details/JackpotAuditPanel";

/* ---------------- TYPES ---------------- */

const MOCK_BUCKETS = Array.from({ length: 100 }).map((_, i) => ({
  index: i,
  sold: Math.floor(Math.random() * 1000),
  capacity: 1000,
  isWinningRange: i === 23 || i === 77,
  soldTickets: i === 23 ? [23012, 23045, 23088, 23101, 23190] : undefined,
}));

const mockVelocityData = [
  { time: "10:00", sold: 12 },
  { time: "10:10", sold: 28 },
  { time: "10:20", sold: 55 },
  { time: "10:30", sold: 92 }, // 🔥 rush
  { time: "10:40", sold: 140 }, // 🔥 peak
  { time: "10:50", sold: 61 },
  { time: "11:00", sold: 22 },
  { time: "11:10", sold: 8 }, // 🐢 slow
];

type JackpotStatus = "CREATED" | "OPEN" | "GUARANTEED" | "LOCKED" | "SETTLED";

type JackpotDraw = {
  id: string;
  name: string;
  drawDate: string;
  time: string;
  status: JackpotStatus;

  ticketPrice: number;
  digits: number;

  ticketsSold: number;
  totalCollection: number;

  jackpotAmount: number;
  totalPayout?: number;

  prizeTiers?: any[];
};

/* ---------------- PAGE ---------------- */

export default function JackpotDetailsPage() {
  const { jackpotId } = useParams<{ jackpotId: string }>();
  const router = useRouter();

  const [jackpot, setJackpot] = useState<JackpotDraw | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD JACKPOT ---------------- */

  useEffect(() => {
    const ref = doc(db, "jackpotDraws", jackpotId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as JackpotDraw;

          const { id: _ignored, ...rest } = data;

          setJackpot({
            id: snap.id,
            ...rest,
          });
        }

        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [jackpotId]);

  /* ---------------- LOADING ---------------- */

  if (loading || !jackpot) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  /* ---------------- RENDER ---------------- */

  return (
    <div className="space-y-8 p-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="-ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <h1 className="text-2xl font-semibold">{jackpot.name}</h1>
          </div>

          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{jackpot.drawDate}</span>
            <span>·</span>
            <span>{jackpot.time}</span>

            <Badge className="ml-2">{jackpot.status}</Badge>
          </div>
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <JackpotSummaryCards jackpotId={jackpotId} />

      <TicketVelocityStrip points={mockVelocityData} />

      {/* ================= PRIZE CONFIG ================= */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Prize Configuration</h2>

        {!jackpot.prizeTiers?.length && (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Prize configuration not available.
          </div>
        )}

        <DotGrid
          title="Jackpot Sales Heat Map"
          totalTickets={100000} // 10^5
          soldTickets={94700} // from Firestore
          guaranteedAt={25000} // calculated guarantee threshold
        />

        {/* {jackpot.prizeTiers?.length && (
          <JackpotPrizeBreakdown prizeTiers={jackpot.prizeTiers} />
        )} */}
      </section>

      {/* ================= WINNERS ================= */}
      <section>
        {/* <h2 className="mb-3 text-lg font-semibold">Winners</h2> */}

        {/* {jackpot.status !== "SETTLED" && (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Winners will appear once the jackpot is settled.
          </div>
        )} */}

        {/* {jackpot.status === "SETTLED" && (
          <JackpotWinnersPanel jackpotId={jackpotId} />
        )} */}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          <TicketRangeHeatMap buckets={MOCK_BUCKETS} />
          <TicketRangeHeatMapLegend />
        </div>
      </section>

      {/* ================= AUDIT ================= */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Audit Timeline</h2>
        {/* <JackpotAuditPanel jackpotId={jackpotId} /> */}
      </section>
    </div>
  );
}
