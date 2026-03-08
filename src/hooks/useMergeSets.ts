'use client';

import { useCallback } from 'react';
import { db } from '@/lib/db';
import { deduplicateWordPairs } from '@/lib/dedup';

export function useMergeSets() {
  const merge = useCallback(async (
    name: string,
    sourceSetIds: number[],
    languageA: string,
    languageB: string,
  ): Promise<number> => {
    const allPairs = await db.wordPairs
      .where('setId')
      .anyOf(sourceSetIds)
      .toArray();

    const deduped = deduplicateWordPairs(allPairs);

    const now = new Date();
    const setId = await db.wordSets.add({
      name,
      languageA,
      languageB,
      createdAt: now,
      updatedAt: now,
    });

    if (deduped.length > 0 && setId !== undefined) {
      await db.wordPairs.bulkAdd(
        deduped.map(p => ({
          setId: setId as number,
          termA: p.termA,
          termB: p.termB,
          easeFactor: p.easeFactor,
          interval: p.interval,
          nextReview: p.nextReview,
          correctCount: p.correctCount,
          incorrectCount: p.incorrectCount,
          lastPractice: p.lastPractice,
        }))
      );
    }

    return setId as number;
  }, []);

  return { merge };
}
