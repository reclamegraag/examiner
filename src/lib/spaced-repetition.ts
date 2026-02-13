import type { SpacedRepetitionResult, Quality } from '@/types';

export function calculateNextReview(
  quality: Quality,
  currentEaseFactor: number,
  currentInterval: number
): SpacedRepetitionResult {
  let easeFactor = currentEaseFactor;
  let interval = currentInterval;

  if (quality < 3) {
    interval = 1;
  } else {
    if (currentInterval === 0) {
      interval = 1;
    } else if (currentInterval === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { easeFactor, interval, nextReview };
}

export function getQualityFromCorrect(isCorrect: boolean, timeHint?: number): Quality {
  if (!isCorrect) return 0;
  if (timeHint && timeHint < 3000) return 5;
  if (timeHint && timeHint < 5000) return 4;
  return 3;
}

export function getWordsForReview(pairs: { nextReview: Date; easeFactor: number }[]): number[] {
  const now = new Date();
  return pairs
    .map((pair, index) => ({ ...pair, index }))
    .filter(pair => new Date(pair.nextReview) <= now)
    .sort((a, b) => {
      const aDiff = now.getTime() - new Date(a.nextReview).getTime();
      const bDiff = now.getTime() - new Date(b.nextReview).getTime();
      if (aDiff !== bDiff) return bDiff - aDiff;
      return b.easeFactor - a.easeFactor;
    })
    .map(pair => pair.index);
}
