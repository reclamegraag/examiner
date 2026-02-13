import { describe, it, expect } from 'vitest';
import { calculateNextReview, getQualityFromCorrect, getWordsForReview } from '@/lib/spaced-repetition';

describe('spaced-repetition', () => {
  describe('calculateNextReview', () => {
    it('resets to 1 day for incorrect answer (quality < 3)', () => {
      const result = calculateNextReview(0, 2.5, 6);
      
      expect(result.interval).toBe(1);
    });

    it('sets interval to 1 for first correct answer', () => {
      const result = calculateNextReview(3, 2.5, 0);
      
      expect(result.interval).toBe(1);
    });

    it('sets interval to 6 for second correct answer', () => {
      const result = calculateNextReview(3, 2.5, 1);
      
      expect(result.interval).toBe(6);
    });

    it('multiplies interval by ease factor for subsequent correct answers', () => {
      const result = calculateNextReview(3, 2.5, 6);
      
      expect(result.interval).toBe(15);
    });

    it('decreases ease factor for low quality', () => {
      const result = calculateNextReview(3, 2.5, 6);
      
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('increases ease factor for high quality', () => {
      const result = calculateNextReview(5, 2.5, 6);
      
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('never lets ease factor go below 1.3', () => {
      const result = calculateNextReview(0, 1.3, 6);
      
      expect(result.easeFactor).toBe(1.3);
    });
  });

  describe('getQualityFromCorrect', () => {
    it('returns 0 for incorrect answer', () => {
      expect(getQualityFromCorrect(false)).toBe(0);
    });

    it('returns 5 for quick correct answer (< 3s)', () => {
      expect(getQualityFromCorrect(true, 2000)).toBe(5);
    });

    it('returns 4 for medium correct answer (< 5s)', () => {
      expect(getQualityFromCorrect(true, 4000)).toBe(4);
    });

    it('returns 3 for slow correct answer', () => {
      expect(getQualityFromCorrect(true, 6000)).toBe(3);
    });
  });

  describe('getWordsForReview', () => {
    it('returns indices of words due for review', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000 * 60 * 60 * 24);
      const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
      
      const pairs = [
        { nextReview: past, easeFactor: 2.5 },
        { nextReview: future, easeFactor: 2.5 },
        { nextReview: past, easeFactor: 2.0 },
      ];

      const result = getWordsForReview(pairs);

      expect(result).toHaveLength(2);
      expect(result).toContain(0);
      expect(result).toContain(2);
    });

    it('sorts by overdue and ease factor', () => {
      const now = new Date();
      const past1 = new Date(now.getTime() - 1000 * 60 * 60 * 24);
      const past2 = new Date(now.getTime() - 1000 * 60 * 60 * 48);
      
      const pairs = [
        { nextReview: past1, easeFactor: 2.0 },
        { nextReview: past2, easeFactor: 2.5 },
      ];

      const result = getWordsForReview(pairs);

      expect(result[0]).toBe(1);
    });
  });
});
