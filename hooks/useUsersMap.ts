"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type UserDetails = {
  phone?: string;
  email?: string;
};

export function useUsersMap(userIds: string[]) {
  const [users, setUsers] = useState<Record<string, UserDetails>>({});

  useEffect(() => {
    async function fetchUsers() {
      const map: Record<string, UserDetails> = {};

      await Promise.all(
        userIds.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, "users", id));

            if (snap.exists()) {
              const d = snap.data();
              map[id] = {
                phone: d.phone ?? "-",
                email: d.email ?? "-",
              };
            }
          } catch {
            map[id] = { phone: "-", email: "-" };
          }
        }),
      );

      setUsers(map);
    }

    if (userIds.length) fetchUsers();
  }, [userIds]);

  return users;
}
