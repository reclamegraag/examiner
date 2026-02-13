import { describe, it, expect } from 'vitest';
import { parseOcrLines, validateParsedPairs } from '@/lib/ocr-parser';
import type { OcrLine } from '@/types';

describe('ocr-parser', () => {
  describe('parseOcrLines', () => {
    it('parses tab-separated word pairs', () => {
      const lines: OcrLine[] = [
        { text: 'cat\tkat', confidence: 90, words: [] },
        { text: 'dog\thond', confidence: 90, words: [] },
      ];

      const result = parseOcrLines(lines);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        termA: 'cat',
        termB: 'kat',
        confidence: 90,
        line: 0,
      });
    });

    it('parses dash-separated word pairs', () => {
      const lines: OcrLine[] = [
        { text: 'cat - kat', confidence: 85, words: [] },
        { text: 'dog – hond', confidence: 85, words: [] },
      ];

      const result = parseOcrLines(lines);

      expect(result).toHaveLength(2);
      expect(result[0].termA).toBe('cat');
      expect(result[0].termB).toBe('kat');
    });

    it('parses colon-separated word pairs', () => {
      const lines: OcrLine[] = [
        { text: 'cat: kat', confidence: 80, words: [] },
      ];

      const result = parseOcrLines(lines);

      expect(result).toHaveLength(1);
      expect(result[0].termA).toBe('cat');
      expect(result[0].termB).toBe('kat');
    });

    it('parses multi-space separated word pairs', () => {
      const lines: OcrLine[] = [
        { text: 'cat    kat', confidence: 75, words: [] },
      ];

      const result = parseOcrLines(lines);

      expect(result).toHaveLength(1);
      expect(result[0].termA).toBe('cat');
      expect(result[0].termB).toBe('kat');
    });

    it('splits in half when no separator is found for 4+ words', () => {
      const lines: OcrLine[] = [
        { text: 'the cat is black', confidence: 70, words: [] },
      ];

      const result = parseOcrLines(lines);

      expect(result).toHaveLength(1);
      expect(result[0].termA).toBe('the cat');
      expect(result[0].termB).toBe('is black');
    });

    it('returns null for empty lines', () => {
      const lines: OcrLine[] = [
        { text: '', confidence: 90, words: [] },
        { text: '   ', confidence: 90, words: [] },
      ];

      const result = parseOcrLines(lines);

      expect(result).toHaveLength(0);
    });
  });

  describe('validateParsedPairs', () => {
    it('separates valid and low confidence pairs', () => {
      const pairs = [
        { termA: 'cat', termB: 'kat', confidence: 90, line: 0 },
        { termA: 'dog', termB: 'hond', confidence: 50, line: 1 },
        { termA: 'bird', termB: 'vogel', confidence: 70, line: 2 },
      ];

      const result = validateParsedPairs(pairs);

      expect(result.valid).toHaveLength(2);
      expect(result.lowConfidence).toHaveLength(1);
      expect(result.lowConfidence[0].termA).toBe('dog');
    });
  });
});
