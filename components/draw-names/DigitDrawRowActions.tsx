/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Trash2, Power, Settings } from "lucide-react";
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

import { DigitDrawDialog } from "./DigitDrawDialog";
import { DigitDrawConfigDrawer } from "../digit-draws/DigitDrawConfigDrawer";

/* ---------------- TYPES ---------------- */

type DigitDrawStatus = "OPEN" | "LOCKED" | "RUNNING" | "DISABLED" | "COMPLETED";

type Props = {
  digitDrawId: string;
  name: string;
  digits: number;
  status: DigitDrawStatus;
  config?: any;
};

/* ---------------- COMPONENT ---------------- */

export function DigitDrawRowActions({
  digitDrawId,
  name,
  digits,
  status,
  config,
}: Props) {
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const isRunning = status === "RUNNING";
  const isCompleted = status === "COMPLETED";
  const isDisabled = status === "DISABLED";

  /* ---------------- TOGGLE ---------------- */
  async function handleToggle() {
    setLoading(true);
    const toastId = toast.loading(
      isDisabled ? "Enabling digit draw..." : "Disabling digit draw...",
    );

    try {
      await httpsCallable(
        functions,
        "toggleDigitDrawStatus",
      )({
        digitDrawId,
      });

      toast.success(isDisabled ? "Digit draw enabled" : "Digit draw disabled", {
        id: toastId,
      });
    } catch (err: any) {
      toast.error(err?.message || err?.details || "Action failed", {
        id: toastId,
      });
    } finally {
      setLoading(false);
      setConfirmToggle(false);
    }
  }

  /* ---------------- DELETE ---------------- */
  async function handleDelete() {
    setLoading(true);
    const toastId = toast.loading("Deleting digit draw...");

    try {
      await httpsCallable(
        functions,
        "deleteDigitDraw",
      )({
        digitDrawId,
      });

      toast.success("Digit draw deleted", { id: toastId });
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

        <DropdownMenuContent align="end" className="w-48">
          {/* ⚙️ Config */}
          <DropdownMenuItem
            disabled={isRunning || isCompleted}
            onClick={() => setConfigOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            {config ? "Edit Configuration" : "Configure"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* ✏️ Edit */}
          <DigitDrawDialog
            digitDrawId={digitDrawId}
            initialName={name}
            initialDigits={digits}
          >
            <DropdownMenuItem
              disabled={isRunning || isCompleted}
              onSelect={(e) => {
                e.preventDefault(); // 🔥 keep menu open for dialog
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </DigitDrawDialog>

          {/* 🔌 Toggle */}
          <DropdownMenuItem
            disabled={isRunning || isCompleted}
            onClick={() => setConfirmToggle(true)}
          >
            <Power className="mr-2 h-4 w-4" />
            {isDisabled ? "Enable" : "Disable"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* 🗑 Delete */}
          <DropdownMenuItem
            disabled={isRunning || isCompleted}
            className="text-red-600 focus:text-red-600"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ---------------- TOGGLE CONFIRM ---------------- */}
      <AlertDialog open={confirmToggle} onOpenChange={setConfirmToggle}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDisabled ? "Enable Digit Draw?" : "Disable Digit Draw?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDisabled
                ? "This digit draw will be visible and available again."
                : "This digit draw will be hidden and no longer accept bets."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} disabled={loading}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------------- DELETE CONFIRM ---------------- */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Delete Digit Draw?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. The digit draw will be permanently
              removed.
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

      {/* ---------------- CONFIG DRAWER ---------------- */}
      <DigitDrawConfigDrawer
        open={configOpen}
        onOpenChange={setConfigOpen}
        draw={{
          id: digitDrawId,
          name,
          digits,
          status,
          config,
        }}
      />
    </>
  );
}
