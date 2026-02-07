"use client";

import { useEffect } from "react";
import { usePlatformConfigStore } from "@/store/platformConfig.store";

export default function DynamicFavicon() {
  const logoUrl =
    usePlatformConfigStore((s) => s.config?.branding?.logoUrl) ||
    "/favicon.ico";

  useEffect(() => {
    if (!logoUrl) return;

    let link =
      document.querySelector<HTMLLinkElement>("link[rel='icon']");

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.href = logoUrl;
    link.type = "image/png";
  }, [logoUrl]);

  return null;
}
