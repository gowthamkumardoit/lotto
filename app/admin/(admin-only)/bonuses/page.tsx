"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { useBonuses } from "@/hooks/useBonuses";
import BonusStats from "@/components/bonuses/BonusStats";
import BonusTable from "@/components/bonuses/BonusTable";
import CreateBonusModal from "@/components/bonuses/CreateBonusModal";
import BonusToolbar, { BonusFilters } from "@/components/bonuses/BonusToolbar";

export default function BonusManagementPage() {
  // ✅ single source of truth
  const [filters, setFilters] = useState<BonusFilters>({});
  const [open, setOpen] = useState(false);
  const { bonuses, loadMore, hasMore, loading, reload } = useBonuses(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bonus Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage all bonus grants across the platform
          </p>
        </div>

        <Button onClick={() => setOpen(true)}>Create Bonus</Button>
      </div>

      {/* Stats */}
      <BonusStats bonuses={bonuses} />

      {/* Toolbar */}
      <BonusToolbar filters={filters} setFilters={setFilters} />

      {/* Table */}
      <BonusTable bonuses={bonuses} onDelete={reload} />

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            Load More
          </Button>
        </div>
      )}

      <CreateBonusModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={reload} // ✅ pass reload
      />
    </div>
  );
}
