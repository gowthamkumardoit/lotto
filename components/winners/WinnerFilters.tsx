"use client";

import { Badge } from "@/components/ui/badge";

export function WinnerFilters() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs text-muted-foreground">Filter by</span>

      <Badge variant="outline">2D</Badge>
      <Badge variant="outline">3D</Badge>
      <Badge variant="outline">4D</Badge>

      <Badge variant="outline">Credited</Badge>
      <Badge variant="outline">Pending</Badge>
    </div>
  );
}
