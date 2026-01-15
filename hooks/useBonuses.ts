"use client";

import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    where,
    getDocs,
    DocumentSnapshot,
    Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Bonus } from "@/types/bonus";
import { BonusFilters } from "@/components/bonuses/BonusToolbar";

const PAGE_SIZE = 10;

export function useBonuses(filters: BonusFilters) {
    const [bonuses, setBonuses] = useState<Bonus[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const load = async (reset = false) => {
        setLoading(true);

        let q = query(
            collection(db, "bonuses"),
            orderBy("createdAt", "desc"),
            limit(PAGE_SIZE)
        );

        // 🔍 Filters
        if (filters.startDate) {
            q = query(q, where("createdAt", ">=", filters.startDate));
        }

        if (filters.endDate) {
            q = query(q, where("createdAt", "<=", filters.endDate));
        }

        // 📄 Pagination
        if (!reset && lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snap = await getDocs(q);

        const items: Bonus[] = snap.docs.map((doc) => {
            const data = doc.data();

            return {
                id: doc.id,
                title: data.title,
                amount: data.amount,
                status: data.status,
                validDays: data.validDays,
                createdBy: data.createdBy,

                // 🔄 Firestore Timestamp → JS Date
                createdAt: (data.createdAt as Timestamp).toDate(),
                expiresAt: (data.expiresAt as Timestamp).toDate(),
            };
        });

        setBonuses((prev) => (reset ? items : [...prev, ...items]));
        setLastDoc(snap.docs.at(-1) ?? null);
        setHasMore(snap.docs.length === PAGE_SIZE);
        setLoading(false);
    };

    // 🔁 Reload when filters change
    useEffect(() => {
        load(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    return {
        bonuses,
        loading,
        hasMore,
        loadMore: () => load(false),
        reload: () => load(true),
    };
}
