import { describe, it, expect } from 'vitest';
import { fuzzyMatch, getMatchFeedback } from '@/lib/fuzzy-match';

describe('fuzzy-match', () => {
  describe('fuzzyMatch', () => {
    it('returns exact match for identical strings', () => {
      const result = fuzzyMatch('kat', 'kat');
      
      expect(result.isExact).toBe(true);
      expect(result.isAccentMatch).toBe(true);
      expect(result.isFuzzyMatch).toBe(true);
      expect(result.distance).toBe(0);
    });

    it('is case insensitive', () => {
      const result = fuzzyMatch('KAT', 'kat');
      
      expect(result.isExact).toBe(true);
    });

    it('trims whitespace', () => {
      const result = fuzzyMatch('  kat  ', 'kat');
      
      expect(result.isExact).toBe(true);
    });

    it('matches with accent tolerance', () => {
      const result = fuzzyMatch('cafe', 'café');
      
      expect(result.isExact).toBe(false);
      expect(result.isAccentMatch).toBe(true);
      expect(result.isFuzzyMatch).toBe(true);
    });

    it('detects close match (1 character off)', () => {
      const result = fuzzyMatch('katt', 'kat');
      
      expect(result.isClose).toBe(true);
      expect(result.distance).toBe(1);
    });

    it('calculates levenshtein distance correctly', () => {
      const result = fuzzyMatch('kitten', 'sitting');
      
      expect(result.distance).toBe(3);
    });

    it('handles German umlauts', () => {
      const result = fuzzyMatch('uber', 'über');
      
      expect(result.isAccentMatch).toBe(true);
    });

    it('handles French accents', () => {
      const result = fuzzyMatch('francais', 'français');
      
      expect(result.isAccentMatch).toBe(true);
    });

    it('returns false for completely different words', () => {
      const result = fuzzyMatch('cat', 'dog');
      
      expect(result.isExact).toBe(false);
      expect(result.isAccentMatch).toBe(false);
      expect(result.isFuzzyMatch).toBe(false);
      expect(result.isClose).toBe(false);
    });
  });

  describe('getMatchFeedback', () => {
    it('returns null for exact match', () => {
      const result = fuzzyMatch('kat', 'kat');
      const feedback = getMatchFeedback(result, 'kat');
      
      expect(feedback).toBeNull();
    });

    it('returns accent hint for accent match', () => {
      const result = fuzzyMatch('cafe', 'café');
      const feedback = getMatchFeedback(result, 'café');
      
      expect(feedback).toBe('Let op accenten');
    });

    it('returns close hint for 1 character off', () => {
      const result = fuzzyMatch('katt', 'kat');
      const feedback = getMatchFeedback(result, 'kat');
      
      expect(feedback).toContain('Bijna goed');
      expect(feedback).toContain('kat');
    });

    it('returns correct answer for wrong answer', () => {
      const result = fuzzyMatch('hond', 'kat');
      const feedback = getMatchFeedback(result, 'kat');
      
      expect(feedback).toContain('Fout');
      expect(feedback).toContain('kat');
    });
  });
});
