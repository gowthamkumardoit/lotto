// src/components/PlatformConfigBootstrap.tsx
"use client";

import { useEffect } from "react";
import { usePlatformConfigStore } from "@/store/platformConfig.store";

export default function PlatformConfigBootstrap() {
  const load = usePlatformConfigStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return null; // 👈 renders nothing
}
