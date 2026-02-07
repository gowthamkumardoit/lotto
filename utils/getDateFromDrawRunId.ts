export function getDateFromDrawRunId(drawRunId?: string): string | null {
  if (!drawRunId) return null;
  const [, date] = drawRunId.split("_");
  return date ?? null; // YYYY-MM-DD
}
