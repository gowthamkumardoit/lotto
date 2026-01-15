"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { deleteBonus } from "@/services/bonusService";
import { ConfirmActionDialog } from "../common/ConfirmActionDialog";
import { useAuth } from "@/hooks/useAuth";
export function BonusRowActions({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted: () => void;
}) {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(false); // ✅ ADD
  const { user } = useAuth(); // admin user
  const handleDelete = async () => {
    if (loading) return;

    try {
      setLoading(true);
      if (!user?.uid) return;

      await deleteBonus(id, user.uid);
      toast.success("Bonus deleted");
      onDeleted();
    } catch {
      toast.error("Failed to delete bonus");
    } finally {
      setLoading(false);
      setOpenConfirm(false);
    }
  };

  return (
    <>
      <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => {
              setOpenMenu(false); // ✅ close dropdown
              setOpenConfirm(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation */}
      <ConfirmActionDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        title="Delete Bonus?"
        description="This action cannot be undone. The bonus will be permanently removed."
        confirmText={loading ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
