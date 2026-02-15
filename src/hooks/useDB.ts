import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { WordSet, WordPair, PracticeSession } from '@/types';

export function useWordSets() {
  const sets = useLiveQuery(() => 
    db.wordSets.orderBy('updatedAt').reverse().toArray()
  );

  const isLoading = sets === undefined;

  return { sets: sets || [], isLoading };
}

export function useWordSet(id: number | undefined) {
  const set = useLiveQuery(() => 
    id ? db.wordSets.get(id) : undefined,
    [id]
  );

  return { set, isLoading: set === undefined };
}

export function useWordPairs(setId: number | undefined) {
  const pairs = useLiveQuery(() =>
    setId ? db.wordPairs.where('setId').equals(setId).toArray() : [],
    [setId]
  );

  return { pairs: pairs || [], isLoading: pairs === undefined };
}

export function useCreateWordSet() {
  const create = async (
    name: string,
    languageA: string,
    languageB: string,
    pairs: { termA: string; termB: string }[]
  ) => {
    const now = new Date();
    const setId = await db.wordSets.add({
      name,
      languageA,
      languageB,
      createdAt: now,
      updatedAt: now,
    });

    if (pairs.length > 0 && setId !== undefined) {
      const wordPairs = pairs.map(pair => ({
        setId: setId as number,
        termA: pair.termA,
        termB: pair.termB,
        easeFactor: 2.5,
        interval: 0,
        nextReview: now,
        correctCount: 0,
        incorrectCount: 0,
      }));
      
      await db.wordPairs.bulkAdd(wordPairs);
    }

    return setId;
  };

  return { create };
}

export function useUpdateWordSet() {
  const update = async (id: number, updates: Partial<WordSet>) => {
    await db.wordSets.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  };

  return { update };
}

export function useDeleteWordSet() {
  const deleteSet = async (id: number) => {
    await db.wordPairs.where('setId').equals(id).delete();
    await db.wordSets.delete(id);
  };

  return { deleteSet };
}

export function useAddWordPair() {
  const add = async (setId: number, termA: string, termB: string) => {
    const pair = {
      setId,
      termA,
      termB,
      easeFactor: 2.5,
      interval: 0,
      nextReview: new Date(),
      correctCount: 0,
      incorrectCount: 0,
    };
    
    await db.wordPairs.add(pair);
    await db.wordSets.update(setId, { updatedAt: new Date() });
  };

  return { add };
}

export function useUpdateWordPair() {
  const update = async (id: number, updates: Partial<WordPair>) => {
    await db.wordPairs.update(id, updates);
  };

  return { update };
}

export function useDeleteWordPair() {
  const deletePair = async (id: number) => {
    const pair = await db.wordPairs.get(id);
    if (pair?.setId) {
      await db.wordPairs.delete(id);
      await db.wordSets.update(pair.setId, { updatedAt: new Date() });
    }
  };

  return { deletePair };
}

export function useAllPracticeSessions() {
  const sessions = useLiveQuery(() =>
    db.practiceSessions.toArray()
  );

  return { sessions: sessions || [], isLoading: sessions === undefined };
}

export function usePracticeSessions(setId: number | undefined) {
  const sessions = useLiveQuery(() =>
    setId ? db.practiceSessions.where('setId').equals(setId).reverse().toArray() : [],
    [setId]
  );

  return { sessions: sessions || [], isLoading: sessions === undefined };
}

export function useCreatePracticeSession() {
  const create = async (session: Omit<PracticeSession, 'id'>) => {
    return db.practiceSessions.add(session as PracticeSession);
  };

  return { create };
}

export function useResetWordPairStats() {
  const resetStats = async (setId: number) => {
    const pairs = await db.wordPairs.where('setId').equals(setId).toArray();
    const now = new Date();
    await Promise.all(
      pairs.map(p =>
        db.wordPairs.update(p.id!, {
          correctCount: 0,
          incorrectCount: 0,
          easeFactor: 2.5,
          interval: 0,
          nextReview: now,
          lastPractice: undefined,
        })
      )
    );
  };

  return { resetStats };
}
