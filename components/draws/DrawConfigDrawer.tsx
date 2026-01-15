/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

type DrawStatus = "OPEN" |  "LOCKED" | "RUNNING" | "DISABLED" | "COMPLETED";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draw: {
    id: string;
    name: string;
    time: string;
    status: DrawStatus;
    config?: any;
  };
};

export function DrawConfigDrawer({ open, onOpenChange, draw }: Props) {
  const isEditable = draw.status === "OPEN";

  /* ---------------- CONFIG STATE ---------------- */
  const [enable2D, setEnable2D] = useState(true);
  const [enable3D, setEnable3D] = useState(true);
  const [enable4D, setEnable4D] = useState(false);

  const [multiplier2D, setMultiplier2D] = useState(80);
  const [multiplier3D, setMultiplier3D] = useState(750);
  const [multiplier4D, setMultiplier4D] = useState(7500);

  const [maxBet, setMaxBet] = useState(1000);
  const [minSales, setMinSales] = useState(0);

  const [loading, setLoading] = useState(false);

  /* ---------------- HYDRATE EXISTING CONFIG ---------------- */
  useEffect(() => {
    if (open && draw.config) {
      setEnable2D(draw.config.enable2D ?? true);
      setEnable3D(draw.config.enable3D ?? true);
      setEnable4D(draw.config.enable4D ?? false);

      setMultiplier2D(draw.config.multiplier2D ?? 80);
      setMultiplier3D(draw.config.multiplier3D ?? 750);
      setMultiplier4D(draw.config.multiplier4D ?? 7500);

      setMaxBet(draw.config.maxBet ?? 1000);
      setMinSales(draw.config.minSales ?? 0);
    }
  }, [open, draw]);

  /* ---------------- SAVE (DUMMY) ---------------- */
  async function handleSave() {
    if (!isEditable) return;

    setLoading(true);
    try {
      // NEXT STEP: call updateDrawConfig CF
      await httpsCallable(
        functions,
        "updateDrawConfig"
      )({
        drawId: draw.id,
        config: {
          enable2D,
          enable3D,
          enable4D,
          multiplier2D,
          multiplier3D,
          multiplier4D,
          maxBet,
          minSales,
        },
      });

      toast.success("Configuration saved");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] p-4">
        <SheetHeader>
          <SheetTitle>Draw Configuration</SheetTitle>
          <SheetDescription>
            {draw.name} · {draw.time}
          </SheetDescription>
        </SheetHeader>

        {!isEditable && (
          <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            This draw is already running or completed. Configuration is locked.
          </p>
        )}

        <div className="mt-6 space-y-6">
          {/* -------- 2D -------- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Enable 2D</Label>
              <Switch
                checked={enable2D}
                onCheckedChange={setEnable2D}
                disabled={!isEditable}
              />
            </div>
            <Input
              type="number"
              placeholder="2D Multiplier"
              value={multiplier2D}
              onChange={(e) => setMultiplier2D(+e.target.value)}
              disabled={!isEditable || !enable2D}
            />
          </div>

          {/* -------- 3D -------- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Enable 3D</Label>
              <Switch
                checked={enable3D}
                onCheckedChange={setEnable3D}
                disabled={!isEditable}
              />
            </div>
            <Input
              type="number"
              placeholder="3D Multiplier"
              value={multiplier3D}
              onChange={(e) => setMultiplier3D(+e.target.value)}
              disabled={!isEditable || !enable3D}
            />
          </div>

          {/* -------- 4D -------- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Enable 4D</Label>
              <Switch
                checked={enable4D}
                onCheckedChange={setEnable4D}
                disabled={!isEditable}
              />
            </div>
            <Input
              type="number"
              placeholder="4D Multiplier"
              value={multiplier4D}
              onChange={(e) => setMultiplier4D(+e.target.value)}
              disabled={!isEditable || !enable4D}
            />
          </div>

          <Separator />

          {/* -------- RISK -------- */}
          <div className="space-y-2">
            <Label>Max Bet Per Ticket</Label>
            <Input
              type="number"
              value={maxBet}
              onChange={(e) => setMaxBet(+e.target.value)}
              disabled={!isEditable}
            />
          </div>

          <div className="space-y-2">
            <Label>Minimum Sales Required</Label>
            <Input
              type="number"
              value={minSales}
              onChange={(e) => setMinSales(+e.target.value)}
              disabled={!isEditable}
            />
          </div>
        </div>

        <div className="mt-8">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!isEditable || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
