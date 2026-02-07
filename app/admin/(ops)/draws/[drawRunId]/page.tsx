"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { Loader2 } from "lucide-react";

import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";

/* ---- COMPOSED COMPONENTS ---- */
import { DrawSummaryCards } from "@/components/draw-details/DrawSummaryCards";
import { MostPlayedNumbers } from "@/components/draw-details/MostPlayedNumbers";
import { getFunctions, httpsCallable } from "firebase/functions";
import DrawResultsPanel from "@/components/draw-details/DrawResultPanel";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import WinnersPanel from "@/components/draw-details/WinnersPanel";
import AuditPanel from "@/components/draw-details/AuditPanel";

/* ---------------- TYPES ---------------- */

type DrawRunStatus = "UPCOMING" | "LOCKED" | "RUNNING" | "DRAWN" | "SETTLED";

type DrawRun = {
  id: string;
  name: string;
  time: string;
  date: string;
  status: DrawRunStatus;
  sales: number; // 👈 already in Firestore
  totalPayout?: number; // 👈 added after settlement
  result?: DrawResult | null;
};

type LegacyResult = string;

type SettledResult = {
  number: string;
  winners?: number;
  payout?: number;
};

export type DrawResult =
  | {
      "2D": LegacyResult;
      "3D": LegacyResult;
      "4D": LegacyResult;
    }
  | {
      "2D": SettledResult;
      "3D": SettledResult;
      "4D": SettledResult;
    };

/* ---------------- PAGE ---------------- */

export default function DrawDetailsPage() {
  const { drawRunId } = useParams<{ drawRunId: string }>();

  const [draw, setDraw] = useState<DrawRun | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* ---------------- LOAD DRAW ---------------- */

  useEffect(() => {
    const ref = doc(db, "drawRuns", drawRunId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setDraw({
            id: snap.id,
            ...(snap.data() as DrawRun),
          });
        }
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [drawRunId]);

  /* ---------------- LOADING ---------------- */

  if (loading || !draw) {
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

            <h1 className="text-2xl font-semibold">{draw.name}</h1>
          </div>

          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{draw.date}</span>
            <span>·</span>
            <span>{draw.time}</span>

            <Badge className="ml-2">{draw.status}</Badge>
          </div>
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <DrawSummaryCards drawRunId={drawRunId} />

      {/* ================= WINNING NUMBERS ================= */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Winning Numbers</h2>

        {draw.status !== "DRAWN" && draw.status !== "SETTLED" && (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Draw not completed yet. Winning numbers will appear once the draw is
            run.
          </div>
        )}

        {["RUNNING", "DRAWN", "SETTLED"].includes(draw.status) && (
          <DrawResultsPanel status={draw.status} />
        )}
      </section>

      {/* ================= MOST PLAYED ================= */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Most Played Numbers</h2>
        <MostPlayedNumbers drawRunId={drawRunId} />
      </section>

      {/* ================= WINNERS ================= */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Winners</h2>
        <WinnersPanel drawRunId={drawRunId} status={draw.status} />
      </section>

      {/* ================= AUDIT ================= */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Audit Timeline</h2>
        <AuditPanel drawRunId={drawRunId} />
      </section>
    </div>
  );
}
