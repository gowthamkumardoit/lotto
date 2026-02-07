import { Winner, WinnersByDraw } from "@/types/winners";

function getDateFromDrawRunId(drawRunId: string): Date | null {
  const [, datePart] = drawRunId.split("_");
  if (!datePart) return null;

  const date = new Date(datePart);
  return isNaN(date.getTime()) ? null : date;
}

export function groupWinnersByDraw(
  winners: Winner[],
): WinnersByDraw[] {
  const map = new Map<string, WinnersByDraw>();

  for (const w of winners) {
    if (!map.has(w.drawId)) {
      map.set(w.drawId, {
        drawId: w.drawId,
        drawRunId: w.drawRunId,
        winners: [],
        totalWinners: 0,
        totalPayout: 0,
      });
    }

    const entry = map.get(w.drawId)!;

    entry.winners.push(w);
    entry.totalWinners += 1;
    entry.totalPayout += w.winAmount;
  }

  return Array.from(map.values()).sort((a, b) => {
    const da = getDateFromDrawRunId(a.drawRunId)?.getTime() ?? 0;
    const db = getDateFromDrawRunId(b.drawRunId)?.getTime() ?? 0;
    return db - da; // latest first
  });
}
