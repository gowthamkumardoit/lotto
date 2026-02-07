"use client";

import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type DrawRunAlert = {
    id: string;
    name: string;
    startsAt: Date;
};
export function getDrawStartTime(draw: {
    date: string; // "2026-01-21"
    time: string; // "07:00"
}): Date {
    // IST timezone safe
    return new Date(`${draw.date}T${draw.time}:00+05:30`);
}


export function useNextDrawRunAlert() {
    const [draw, setDraw] = useState<DrawRunAlert | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, "drawRuns"),
            where("status", "==", "OPEN"),
            orderBy("date", "asc"),
            orderBy("time", "asc"),
            limit(1),
        );

        const unsub = onSnapshot(q, (snap) => {
            if (snap.empty) {
                setDraw(null);
                return;
            }

            const doc = snap.docs[0];
            const d = doc.data();

            const startsAt = getDrawStartTime({
                date: d.date,
                time: d.time,
            });

            setDraw({
                id: doc.id,
                name: d.name,
                startsAt,
            });
        });

        return () => unsub();
    }, []);

    return draw;
}
