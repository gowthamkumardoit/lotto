import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrawNameDialog } from "../draw-names/DrawNameDialog";

export function DrawsEmptyState() {
  return (
    <div className="rounded-xl border bg-background shadow-sm">
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <CalendarPlus className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold">No draws created yet</h3>

        {/* Description */}
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first draw to schedule lottery timings and start accepting
          entries.
        </p>

        {/* CTA */}
        <div className="mt-6">
          <DrawNameDialog>
            <Button size="sm">+ Create Draw</Button>
          </DrawNameDialog>
        </div>

        {/* Hint */}
        <p className="mt-3 text-xs text-muted-foreground">
          You can edit or disable draws anytime
        </p>
      </div>
    </div>
  );
}
