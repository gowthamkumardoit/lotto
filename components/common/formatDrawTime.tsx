/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timestamp } from "firebase/firestore";

export function formatDrawTime(
  time: Timestamp | string | null | undefined
): string {
  if (!time) return "--:--";

  // 🔁 OLD DATA / FORM STATE
  if (typeof time === "string") {
    return time; // already HH:mm
  }

  // 🔁 Firestore Timestamp
  if (time instanceof Timestamp) {
    return time.toDate().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // 🔁 Fallback (plain object from JSON)
  // Firestore sometimes gives { seconds, nanoseconds }
  if (
    typeof time === "object" &&
    "seconds" in time &&
    typeof (time as any).seconds === "number"
  ) {
    const date = new Date((time as any).seconds * 1000);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return "--:--";
}
