import Dexie, { type EntityTable } from 'dexie';
import type { WordSet, WordPair, PracticeSession } from '@/types';

const db = new Dexie('ExaminerDB') as Dexie & {
  wordSets: EntityTable<WordSet, 'id'>;
  wordPairs: EntityTable<WordPair, 'id'>;
  practiceSessions: EntityTable<PracticeSession, 'id'>;
};

db.version(1).stores({
  wordSets: '++id, name, languageA, languageB, createdAt, updatedAt',
  wordPairs: '++id, setId, termA, termB, easeFactor, interval, nextReview, correctCount, incorrectCount, lastPractice',
  practiceSessions: '++id, setId, mode, startedAt, completedAt',
});

export { db };
