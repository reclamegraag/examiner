import { describe, it, expect } from 'vitest';
import { paginate, backOrder, cardsPerSheet, getLayout, PRINT_LAYOUTS } from '@/lib/flashcard-print';

describe('flashcard-print', () => {
  describe('paginate', () => {
    it('splits items into pages of the given size', () => {
      const pages = paginate([1, 2, 3, 4], 2);
      expect(pages).toEqual([[1, 2], [3, 4]]);
    });

    it('pads the last page with null to keep grid alignment', () => {
      const pages = paginate([1, 2, 3], 2);
      expect(pages).toEqual([[1, 2], [3, null]]);
    });

    it('returns a single padded page when items are fewer than perPage', () => {
      const pages = paginate([1], 4);
      expect(pages).toEqual([[1, null, null, null]]);
    });

    it('returns empty array for empty input', () => {
      expect(paginate([], 6)).toEqual([]);
    });

    it('returns empty array for non-positive perPage', () => {
      expect(paginate([1, 2], 0)).toEqual([]);
    });
  });

  describe('backOrder', () => {
    it('reverses each row for long-edge (horizontal mirror) flip', () => {
      // 2 columns, 2 rows
      const page = ['a', 'b', 'c', 'd'];
      expect(backOrder(page, 2)).toEqual(['b', 'a', 'd', 'c']);
    });

    it('reverses rows of width 3', () => {
      const page = ['a', 'b', 'c', 'd', 'e', 'f'];
      expect(backOrder(page, 3)).toEqual(['c', 'b', 'a', 'f', 'e', 'd']);
    });

    it('keeps nulls in place within their row', () => {
      const page = ['a', 'b', 'c', null];
      expect(backOrder(page, 2)).toEqual(['b', 'a', null, 'c']);
    });

    it('is its own inverse (flipping twice restores order)', () => {
      const page = ['a', 'b', 'c', 'd', 'e', 'f'];
      expect(backOrder(backOrder(page, 3), 3)).toEqual(page);
    });
  });

  describe('layouts', () => {
    it('cardsPerSheet multiplies cols and rows', () => {
      expect(cardsPerSheet({ id: 'x', label: '', cols: 4, rows: 6 })).toBe(24);
    });

    it('every preset has a unique id', () => {
      const ids = PRINT_LAYOUTS.map(l => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('getLayout falls back to a default for unknown ids', () => {
      expect(getLayout('does-not-exist')).toBe(PRINT_LAYOUTS[2]);
    });

    it('getLayout returns the matching preset', () => {
      expect(getLayout('4x6').id).toBe('4x6');
    });
  });
});
