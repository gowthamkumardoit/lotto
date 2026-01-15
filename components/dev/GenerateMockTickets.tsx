"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/* ---------------- CONFIG ---------------- */

const TOTAL_TICKETS = 1000;

// realistic distribution
const TYPE_DISTRIBUTION = {
  "2D": 0.47, // 60%
  "3D": 0.38, // 30%
  "4D": 0.1, // 10%
};

const BET_AMOUNTS = [10, 20, 50, 100, 200];

/* ---------------- HELPERS ---------------- */

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(type: "2D" | "3D" | "4D") {
  if (type === "2D") return String(Math.floor(Math.random() * 100)).padStart(2, "0");
  if (type === "3D") return String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function pickType(): "2D" | "3D" | "4D" {
  const r = Math.random();
  if (r < TYPE_DISTRIBUTION["2D"]) return "2D";
  if (r < TYPE_DISTRIBUTION["2D"] + TYPE_DISTRIBUTION["3D"]) return "3D";
  return "4D";
}

/* ---------------- COMPONENT ---------------- */

export function GenerateMockTickets() {
  const [drawRunId, setDrawRunId] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateTickets() {
    if (!drawRunId.trim()) {
      toast.error("DrawRun ID is required");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Generating mock tickets...");

    try {
      let created = 0;
      const batchSize = 200; // Firestore safe limit

      while (created < TOTAL_TICKETS) {
        const batch = writeBatch(db);

        for (let i = 0; i < batchSize && created < TOTAL_TICKETS; i++) {
          const type = pickType();
          const ticketRef = doc(collection(db, "tickets"));

          batch.set(ticketRef, {
            id: ticketRef.id,
            drawRunId,
            userId: `mock_user_${Math.floor(Math.random() * 1500)}`,
            type,
            number: randomNumber(type),
            amount: randomItem(BET_AMOUNTS),
            winAmount: 0, // will be filled on runDraw
            createdAt: serverTimestamp(),
            status: "OPEN"
          });

          created++;
        }

        await batch.commit();
      }

      toast.success(`Generated ${TOTAL_TICKETS} tickets`, {
        id: toastId,
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate tickets", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-dashed border-red-300">
      <CardHeader className="text-red-600 font-semibold">
        DEV TOOL — Generate Mock Tickets
      </CardHeader>

      <CardContent className="space-y-4">
        <Input
          placeholder="DrawRun ID (e.g. draw_06_2026-01-14)"
          value={drawRunId}
          onChange={(e) => setDrawRunId(e.target.value)}
          disabled={loading}
        />

        <Button
          variant="destructive"
          onClick={generateTickets}
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate 1000 Mock Tickets
        </Button>

        <p className="text-xs text-muted-foreground">
          ⚠️ For development/testing only. Do not use in production.
        </p>
      </CardContent>
    </Card>
  );
}
