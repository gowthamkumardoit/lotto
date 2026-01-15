/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, functions } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DrawPayoutPreview } from "@/components/draw-details/DrawPayoutPreview";
import { toast } from "sonner";
/* ---------------- TYPES ---------------- */
type status = "UPCOMING" | "LOCKED" | "RUNNING" | "DRAWN" | "SETTLED";
type DrawResult = {
  "2D": string;
  "3D": string;
  "4D": string;
};

type ConfigSnapshot = {
  enable2D: boolean;
  enable3D: boolean;
  enable4D: boolean;
  multiplier2D: number;
  multiplier3D: number;
  multiplier4D: number;
};

type TicketStats = {
  winners: number;
  totalAmount: number;
};

type TicketStatsMap = {
  "2D": TicketStats;
  "3D": TicketStats;
  "4D": TicketStats;
};

type TicketStatsResponse = TicketStatsMap;

/* ---------------- COMPONENT ---------------- */

export default function DrawResultsPanel({ status }: { status: status }) {
  const params = useParams();
  const drawRunId = params?.drawRunId as string;

  const [result, setResult] = useState<DrawResult | null>(null);
  const [config, setConfig] = useState<ConfigSnapshot | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStatsMap>({
    "2D": { winners: 0, totalAmount: 0 },
    "3D": { winners: 0, totalAmount: 0 },
    "4D": { winners: 0, totalAmount: 0 },
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const lastResultRef = useRef<string | null>(null);
  const [settling, setSettling] = useState(false);
  /* ---------------- LOAD STATS (CLOUD FUNCTION) ---------------- */
  async function handleDeclareWinners(): Promise<void> {
    const settleDraw = httpsCallable(functions, "settleDrawRun");
    const toastId = toast.loading("Declaring winners…");

    try {
      setSettling(true);
      const res = await settleDraw({ drawRunId });
      console.log("settleDraw response:", res.data);

      toast.success("Winners declared successfully", {
        id: toastId,
      });
    } catch (err: any) {
      console.error(err);

      toast.error(err?.message || "Failed to declare winners", { id: toastId });
    } finally {
      setSettling(false);
    }
  }

  const loadTicketStats = async (result: DrawResult) => {
    console.log("data.result", result);
    try {
      setLoadingStats(true);

      const getStats = httpsCallable<
        { drawRunId: string; result: DrawResult },
        TicketStatsResponse
      >(functions, "getDrawTicketStats");

      const res = await getStats({ drawRunId, result });
      console.log("response", res);

      setTicketStats(res.data);
      console.log("ticketStats", ticketStats);
    } catch (err) {
      console.error("Failed to load ticket stats", err);
      setTicketStats({
        "2D": { winners: 0, totalAmount: 0 },
        "3D": { winners: 0, totalAmount: 0 },
        "4D": { winners: 0, totalAmount: 0 },
      });
    } finally {
      setLoadingStats(false);
    }
  };

  /* ---------------- LOAD DRAW ---------------- */

  useEffect(() => {

    console.log("status--------", status);
    if (!drawRunId) return;

    const ref = doc(db, "drawRuns", drawRunId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      const serialized = JSON.stringify(data.result);

      if (lastResultRef.current === serialized) return;
      lastResultRef.current = serialized;

      setResult(data.result);
      setConfig(data.configSnapshot);

      console.log("data.configSnapshot", data.configSnapshot);
      // fire & forget
      loadTicketStats(data.result);
    });

    return () => unsub();
  }, [drawRunId]);

  /* ---------------- UI ---------------- */

  if (!result) {
    return <div className="text-center py-10">Waiting for result…</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Draw Results</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {(["2D", "3D", "4D"] as const).map((type) => (
          <div
            key={type}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{type}</Badge>
              <span className="text-lg font-bold tracking-wider">
                {result[type]}
              </span>
            </div>

            <div className="text-sm text-muted-foreground">
              🎟️ Winners:{" "}
              <span className="font-semibold text-foreground">
                {loadingStats ? "…" : ticketStats[type].winners}
              </span>
            </div>
          </div>
        ))}

        {config && status !== "SETTLED" && (
          <DrawPayoutPreview
            stats={{
              "2D": {
                winners: ticketStats["2D"]?.winners ?? 0,
                totalAmount: ticketStats["2D"]?.totalAmount ?? 0,
              },
              "3D": {
                winners: ticketStats["3D"]?.winners ?? 0,
                totalAmount: ticketStats["3D"]?.totalAmount ?? 0,
              },
              "4D": {
                winners: ticketStats["4D"]?.winners ?? 0,
                totalAmount: ticketStats["4D"]?.totalAmount ?? 0,
              },
            }}
            config={config}
            totalSales={377800} // backend later
            loading={settling}
            onDeclare={handleDeclareWinners}
          />
        )}
      </CardContent>
    </Card>
  );
}
