import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getWithdrawalWithWallet(withdrawalId: string) {
    const ref = doc(db, "withdrawalRequests", withdrawalId);
    const snap = await getDoc(ref);

    if (!snap.exists()) throw new Error("Withdrawal not found");

    const w = snap.data();

    const userSnap = await getDoc(doc(db, "users", w.userId));
    const user = userSnap.data();

    return {
        id: snap.id,
        amount: w.amount,
        status: w.status,
        createdAt: w.createdAt.toDate().toLocaleString("en-IN"),
        userId: w.userId,
        userName: user?.displayName ?? "—",
        userPhone: user?.phone ?? "—",
        destination: snap.id,
        wallet: {
            available:
                (user?.walletBalance ?? 0),
            locked: user?.lockedBalance ?? 0,
            bonus: user?.bonusBalance ?? 0,
        },
    };
}
