/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type WithdrawalRequest = {
    id: string;
    userId: string;
    amount: number;
    status: "SUBMITTED" | "APPROVED" | "REJECTED";
    createdAt: Date;
};

export function useWithdrawalRequests() {
    const [data, setData] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const q = query(
                collection(db, "withdrawalRequests"),
                orderBy("createdAt", "desc"),
            );

            const snap = await getDocs(q);

            setData(
                snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as any),
                    createdAt: d.data().createdAt.toDate(),
                })),
            );

            setLoading(false);
        }

        load();
    }, []);

    return { data, loading };
}
