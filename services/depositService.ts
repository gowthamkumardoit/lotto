import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DepositRequestWithWallet } from "@/types/deposit";

export async function getDepositWithWallet(
    topupId: string
): Promise<DepositRequestWithWallet> {
    // 1️⃣ Topup request
    const topupSnap = await getDoc(doc(db, "topupRequests", topupId));
    if (!topupSnap.exists()) {
        throw new Error("Deposit not found");
    }

    const t = topupSnap.data();

    // 2️⃣ User
    const userSnap = await getDoc(doc(db, "users", t.userId));
    if (!userSnap.exists()) {
        throw new Error("User not found");
    }

    const u = userSnap.data();

    return {
        id: topupSnap.id,
        amount: t.amount,
        method: t.method,
        status: t.status,
        reference: t.utr,
        proofUrl: t.proofUrl,
        adminNote: t.adminNote,
        createdAt: t.createdAt.toDate().toLocaleString(),

        userName: u.username ?? "Unknown",
        userPhone: u.phone ?? "—",

        wallet: {
            available: u.walletBalance ?? 0,
            locked: u.lockedBalance ?? 0,
            bonus: u.bonusBalance ?? 0,
        },
    };
}
