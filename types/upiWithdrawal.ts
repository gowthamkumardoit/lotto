export type UpiWithdrawalRequest = {
    id: string;
    userId: string;
    primaryUpi: string;
    secondaryUpi?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    submittedAt: Date;
    updatedAt: Date;
};
