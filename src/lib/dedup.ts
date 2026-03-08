export function deduplicateWordPairs<
  T extends { termA: string; termB: string; correctCount?: number },
>(pairs: T[]): T[] {
  const seen = new Map<string, T>();

  for (const pair of pairs) {
    const key = `${pair.termA.trim().toLowerCase()}|||${pair.termB.trim().toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing || (pair.correctCount ?? 0) > (existing.correctCount ?? 0)) {
      seen.set(key, pair);
    }
  }

  return Array.from(seen.values());
}
