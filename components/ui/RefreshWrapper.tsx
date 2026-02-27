"use client";

import { ReactNode, useEffect, useState } from "react";
import { RotateCw, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

type RefreshWrapperProps = {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  autoRefreshMs?: number; // optional auto refresh
};

export function RefreshWrapper({
  onRefresh,
  children,
  className,
  autoRefreshMs,
}: RefreshWrapperProps) {
  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [successFlash, setSuccessFlash] = useState(false);

  const handleRefresh = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await onRefresh();
      setLastSynced(new Date());

      // Success flash animation
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 800);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  // Optional Auto Refresh
  useEffect(() => {
    if (!autoRefreshMs) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, autoRefreshMs);

    return () => clearInterval(interval);
  }, [autoRefreshMs]);

  const getTimeAgo = () => {
    if (!lastSynced) return "Never";
    const seconds = Math.floor((Date.now() - lastSynced.getTime()) / 1000);
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div
      className={clsx(
        "relative transition-all duration-300",
        successFlash && 
        className,
      )}
    >
      {/* Animated Gradient Top Bar */}
      <div
        className={clsx(
          "absolute left-0 top-0 h-1 w-full overflow-hidden",
          loading ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="h-full w-full animate-[gradientMove_2s_linear_infinite] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        {/* Last Sync Indicator */}
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {lastSynced && (
            <>
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Synced {getTimeAgo()}</span>
            </>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className={clsx(
            "group flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-all",
            "hover:bg-muted active:scale-95",
            loading && "pointer-events-none opacity-70",
          )}
        >
          <RotateCw
            size={16}
            className={clsx(
              "transition-transform duration-700",
              loading && "animate-spin",
            )}
          />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {children}

      {/* Gradient animation keyframe */}
      <style jsx global>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}
