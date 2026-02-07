import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/users";

export function useUsersByIds(userIds: string[]) {
  const [users, setUsers] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (userIds.length === 0) return;

    const unsubscribers = userIds.map((uid) =>
      onSnapshot(doc(db, "users", uid), (snap) => {
        if (!snap.exists()) return;

        const d = snap.data();
        setUsers((prev) => ({
          ...prev,
          [uid]: {
            uid,
            username: d.username,
            displayName: d.displayName,
            phone: d.phone,
          },
        }));
      })
    );

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [userIds.join("|")]);

  return users;
}
