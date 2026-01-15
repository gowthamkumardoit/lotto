// /types/bonus.ts

export type BonusStatus = "ACTIVE" | "EXPIRED" | "USED";

export interface Bonus {
    id: string;

    title: string;
    amount: number;

    /** Campaign lifecycle status */
    status: BonusStatus;

    /** Number of days bonus is valid from creation */
    validDays: number;

    /** Auto-calculated expiry date */
    expiresAt: Date;

    /** Admin who created the bonus */
    createdBy: string;

    /** Creation timestamp */
    createdAt: Date;
}
