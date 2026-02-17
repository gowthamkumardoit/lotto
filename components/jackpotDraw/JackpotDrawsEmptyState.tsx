import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateJackpotDialog } from "../draw-names/JackpotDrawDialog";

export function JackpotDrawsEmptyState() {
  return (
    <div className="rounded-xl border bg-background shadow-sm">
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Gift className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold">No jackpot draws created yet</h3>

        {/* Description */}
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first jackpot draw to configure prizes, ticket pricing,
          and start selling tickets.
        </p>

        {/* CTA */}
        <div className="mt-6">
          <CreateJackpotDialog>
            <Button size="sm">+ Create Jackpot</Button>
          </CreateJackpotDialog>
        </div>

        {/* Hint */}
        <p className="mt-3 text-xs text-muted-foreground">
          Jackpot draws can be edited before they are locked
        </p>
      </div>
    </div>
  );
}
