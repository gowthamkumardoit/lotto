export function formatKuberGoldSettledResult(settlementSummary: any): string {
  if (!settlementSummary) return "";

  let message = "🏆 Draw Results Declared!\n\n";

  message += `• Winning Number: ${settlementSummary.winningNumber ?? "N/A"}\n\n`;
  // message += `• Exact Winners: ${settlementSummary.exactWinners ?? 0}\n`;
  // message += `• Minus One Winners: ${settlementSummary.minusOneWinners ?? 0}\n`;
  // message += `• Minus Two Winners: ${settlementSummary.minusTwoWinners ?? 0}\n\n`;

  message += "🎉 Congratulations to all winners!";

  return message;
}