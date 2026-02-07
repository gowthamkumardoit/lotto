export function getWinnerMessage(
    type: "2D" | "3D" | "4D",
    number: string,
    winAmount: number
) {
    return {
        title: "🎉 Congratulations! You Won",
        body: `Your ${type} number ${number} won ₹${winAmount}. Check your wallet.`,
    };
}
