export type Winner = {
    id: string;
    userId: string;
    number: string;
    type: "2D" | "3D" | "4D";
    betAmount: number;
    winAmount: number;
    multiplier: number;
    drawId: string;
    drawRunId: string;
    settledAt: string;
};

export type WinnersByDraw = {
    drawId: string;
    drawRunId: string;
    winners: Winner[];
    totalWinners: number;
    totalPayout: number;
};
