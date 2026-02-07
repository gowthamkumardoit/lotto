"use client";

import { DrawSoonAlertModal } from "@/components/common/DrawSoonAlertModal";
import { useNextDrawRunAlert } from "@/hooks/useNextDrawAlert";

export function DrawSoonAlertFromFirestore() {
  const draw = useNextDrawRunAlert();

  if (!draw) return null;

  return (
    <DrawSoonAlertModal
      drawName={draw.name}
      startsAt={draw.startsAt}
      thresholdMinutes={8}
    />
  );
}
