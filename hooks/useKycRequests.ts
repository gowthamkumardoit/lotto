import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { KycRequest } from "@/types/kyc";

export function useKycRequests(refreshKey?: number) {
  const [data, setData] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(db, "kycRequests"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: KycRequest[] = snap.docs.map((d) => {
          const v = d.data();

          return {
            uid: v.uid,
            fullName: v.fullName ?? "",
            dob: v.dob ?? "",
            docType: v.docType ?? "",
            docNumber: v.docNumber ?? "",
            docImageUrl: v.docImageUrl ?? "",
            status: v.status ?? "SUBMITTED",
            createdAt: v.createdAt?.toDate?.() ?? new Date(),
          };
        });

        setData(rows);
        setLoading(false);
      },
      (error) => {
        console.error("KYC listener error:", error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [refreshKey]); // 👈 re-subscribe when refresh pressed

  return { data, loading };
}
