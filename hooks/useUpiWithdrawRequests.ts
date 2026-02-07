/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UpiWithdrawalRequest } from "@/types/upiWithdrawal";

export function useUpiWithdrawRequests() {
  const [data, setData] = useState<UpiWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const q = query(
      collection(db, "upiWithdrawals"),
      orderBy("submittedAt", "desc"),
    );

    const snap = await getDocs(q);

    setData(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        submittedAt: d.data().submittedAt.toDate(),
        updatedAt: d.data().updatedAt.toDate(),
      })),
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, refetch: load };
}
