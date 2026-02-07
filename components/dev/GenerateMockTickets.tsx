"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { httpsCallable } from "firebase/functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { functions } from "@/lib/firebase";

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
      const generate = httpsCallable(functions, "generateMockTickets");

      const res: any = await generate({ drawRunId });

      toast.success(
        `Generated ${res.data.created} tickets (₹${res.data.totalSales})`,
        { id: toastId },
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate tickets", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-dashed border-red-400">
      <CardHeader className="text-red-600 font-semibold">
        DEV TOOL — Generate Mock Tickets
      </CardHeader>

      <CardContent className="space-y-4">
        <Input
          placeholder="DrawRun ID (e.g. draw_2026-01-18)"
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
          ⚠️ Admin-only dev utility. Disabled in production.
        </p>
      </CardContent>
    </Card>
  );
}
