"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function AdminSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  /* ─────────────────────────────────────
     ⌘K / Ctrl+K focus handler
  ───────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (e.key === "Escape") {
        inputRef.current?.blur();
        setValue("");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ─────────────────────────────────────
     Enter → route
  ───────────────────────────────────── */
  const handleSubmit = () => {
    if (!value.trim()) return;

    // You can extend this logic later
    router.push(`/admin/users?search=${encodeURIComponent(value.trim())}`);
  };

  return (
    <div className="hidden md:flex w-[360px] relative">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

      <Input
        ref={inputRef}
        value={value}
        placeholder="Search users, draws, settings…"
        className="pl-9"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />

      <kbd className="absolute right-3 top-2 text-xs text-muted-foreground">
        ⌘K
      </kbd>
    </div>
  );
}
