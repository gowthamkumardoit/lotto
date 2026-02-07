"use client";

import { useDrawName } from "@/hooks/useDrawName";

export function DrawNameCell({ drawId }: { drawId: string }) {
  const { name, loading } = useDrawName(drawId);

  if (loading) {
    return <span className="text-muted-foreground">Loading…</span>;
  }

  return <span className="font-medium">{name ?? drawId}</span>;
}
