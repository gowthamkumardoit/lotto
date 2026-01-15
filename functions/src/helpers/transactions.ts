export async function runTransaction<T>(
    db: FirebaseFirestore.Firestore,
    fn: (tx: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
    return db.runTransaction(async (tx) => fn(tx));
}
