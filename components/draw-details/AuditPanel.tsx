"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AuditEvent = {
  id: string;
  action: string;
  message: string;
  actor: string;
  createdAt: any;
};

const ACTION_COLORS: Record<string, string> = {
  DRAW_CREATED: "bg-gray-200 text-gray-700",
  DRAW_LOCKED: "bg-yellow-100 text-yellow-700",
  DRAW_LOCKED_MANUAL: "bg-orange-100 text-orange-700",
  DRAW_RUNNING: "bg-blue-100 text-blue-700",
  RESULT_DECLARED: "bg-purple-100 text-purple-700",
  SETTLED: "bg-green-100 text-green-700",
};

export default function AuditPanel({ drawRunId }: { drawRunId: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "drawRunAudits"),
      where("drawRunId", "==", drawRunId),
      orderBy("createdAt", "asc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      setEvents(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })),
      );
      setLoading(false);
    });

    return () => unsub();
  }, [drawRunId]);

  /* ---------------- STATES ---------------- */

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        No audit events recorded yet.
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <ul className="divide-y">
        {events.map((e, index) => (
          <li key={e.id} className="p-4 flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
              {index !== events.length - 1 && (
                <div className="w-px flex-1 bg-muted mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    ACTION_COLORS[e.action] ??
                    "bg-gray-100 text-gray-700"
                  }
                >
                  {e.action}
                </Badge>

                <span className="text-xs text-muted-foreground">
                  {format(e.createdAt.toDate(), "dd MMM yyyy, HH:mm")}
                </span>
              </div>

              <p className="text-sm">{e.message}</p>

              <p className="text-xs text-muted-foreground">
                Actor: {e.actor === "SYSTEM" ? "System" : e.actor}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
