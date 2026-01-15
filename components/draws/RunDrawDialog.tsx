"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type DrawResult = {
  "2D": string;
  "3D": string;
  "4D": string;
};

type RunDrawDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRun: () => Promise<DrawResult>;
};

function randomDigits(len: number) {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += Math.floor(Math.random() * 10);
  }
  return out;
}

export function RunDrawDialog({
  open,
  onOpenChange,
  onRun,
}: RunDrawDialogProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [display, setDisplay] = useState({
    "2D": "00",
    "3D": "000",
    "4D": "0000",
  });

  // rolling digits animation
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setDisplay({
        "2D": randomDigits(2),
        "3D": randomDigits(3),
        "4D": randomDigits(4),
      });
    }, 80);

    return () => clearInterval(interval);
  }, [running]);

  // start run when dialog opens
  useEffect(() => {
    if (!open) return;

    const execute = async () => {
      setRunning(true);

      try {
        const res = await onRun();

        setRunning(false);
        setResult(res);
        setDisplay(res);

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        setRunning(false);
        onOpenChange(false);
      }
    };

    execute();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <VisuallyHidden>
          <DialogTitle>Run Draw</DialogTitle>
        </VisuallyHidden>
        <h2 className="text-xl font-semibold mb-4">
          {running ? "Running Draw…" : "Draw Completed 🎉"}
        </h2>

        <div className="grid grid-cols-3 gap-4 text-center">
          {(["2D", "3D", "4D"] as const).map((k) => (
            <motion.div
              key={k}
              className="rounded-lg border p-4"
              animate={running ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.6 }}
            >
              <div className="text-xs text-muted-foreground mb-1">{k}</div>
              <div className="text-2xl font-mono font-bold">{display[k]}</div>
            </motion.div>
          ))}
        </div>

        {!running && (
          <button
            className="mt-6 text-sm text-primary underline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
