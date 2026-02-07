"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type BackButtonProps = {
  fallbackHref?: string; // optional fallback route
  label?: string;
};

export function BackButton({
  fallbackHref = "/admin",
  label = "Back",
}: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-2"
      onClick={() => {
        // If browser history exists → go back
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
