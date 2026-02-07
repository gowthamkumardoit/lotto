"use client";

import { useEffect, useRef, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

type Props = {
  drawName: string;
  startsAt: Date;
  thresholdMinutes?: number;
};

export function DrawSoonAlertModal({
  drawName,
  startsAt,
  thresholdMinutes = 5,
}: Props) {
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundPlayedRef = useRef(false);
  const dismissedRef = useRef(false); // ✅ IMPORTANT

  useEffect(() => {
    audioRef.current = new Audio("/sounds/alert.mp3");
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      const diff = Math.floor((startsAt.getTime() - Date.now()) / 1000);
      setSecondsLeft(diff);

      const threshold = thresholdMinutes * 60;

      if (
        diff > 0 &&
        diff <= threshold &&
        !dismissedRef.current // ✅ respect dismissal
      ) {
        setOpen(true);

        if (!soundPlayedRef.current) {
          audioRef.current?.play().catch(() => {});
          soundPlayedRef.current = true;
        }
      }

      if (diff <= 0) {
        setOpen(false);
      }
    }, 1000);

    return () => clearInterval(i);
  }, [startsAt, thresholdMinutes]);

  function dismiss() {
    dismissedRef.current = true; // ✅ lock it
    setOpen(false);
  }

  if (!open) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="relative w-[360px] rounded-xl border bg-background shadow-xl">
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-amber-500 animate-pulse" />

          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-amber-500/15 p-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Draw starting soon</p>
                  <p className="text-xs text-muted-foreground">
                    Immediate attention required
                  </p>
                </div>
              </div>

              <button onClick={dismiss}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="text-sm">
              <strong>{drawName}</strong> starts in{" "}
              <span className="font-semibold text-amber-600">
                {mins}m {secs}s
              </span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={dismiss}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
