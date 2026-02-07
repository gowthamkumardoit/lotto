import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { KycRequest } from "@/types/kyc";

export function useKycRequests() {
    const [data, setData] = useState<KycRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "kycRequests"),
            orderBy("createdAt", "desc"),
        );

        const unsub = onSnapshot(q, (snap) => {
            setData(
                snap.docs.map((d) => {
                    const v = d.data();
                    return {
                        uid: v.uid,
                        fullName: v.fullName,
                        dob: v.dob,
                        docType: v.docType,
                        docNumber: v.docNumber,
                        docImageUrl: v.docImageUrl,
                        status: v.status,
                        createdAt: v.createdAt.toDate(),
                    };
                }),
            );
            setLoading(false);
        });

        return () => unsub();
    }, []);

    return { data, loading };
}
