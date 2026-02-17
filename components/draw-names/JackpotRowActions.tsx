/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Settings } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";

import { functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateJackpotDialog } from "./JackpotDrawDialog";

/* ---------------- TYPES ---------------- */
type JackpotStatus = "CREATED" | "OPEN" | "GUARANTEED" | "LOCKED" | "SETTLED";

type Props = {
  drawId: string;
  status: JackpotStatus;
};

/* ---------------- COMPONENT ---------------- */
export function JackpotRowActions({ drawId, status }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const isSettled = status === "SETTLED";
  const isLocked = status === "LOCKED";

  /* ---------------- DELETE ---------------- */
  async function handleDelete() {
    setLoading(true);
    const toastId = toast.loading("Deleting jackpot draw...");

    try {
      await httpsCallable(
        functions,
        "deleteJackpotDraw",
      )({
        drawId,
      });

      toast.success("Jackpot draw deleted", { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || err?.details || "Delete failed", {
        id: toastId,
      });
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  }
  

  return (
    <>
      {/* ---------------- ACTION MENU ---------------- */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          {/* ⚙️ Edit Configuration */}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Edit Configuration
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* 🗑 Delete */}
          <DropdownMenuItem
            disabled={!["CREATED"].includes(status)}
            className="text-red-600 focus:text-red-600"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ---------------- DELETE CONFIRM ---------------- */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Delete Jackpot Draw?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. All jackpot configuration and data
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------------- EDIT JACKPOT DIALOG ---------------- */}
      <CreateJackpotDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        drawId={drawId}
      />
    </>
  );
}
