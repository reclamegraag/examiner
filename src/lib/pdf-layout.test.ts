import { describe, it, expect } from 'vitest';
import { reconstructPageLines, type PdfTextChunk } from './pdf-layout';

// Helper: build a chunk with sensible defaults.
const c = (str: string, x: number, y: number, w = str.length * 6, h = 10): PdfTextChunk => ({
  str,
  x,
  y,
  w,
  h,
});

describe('reconstructPageLines', () => {
  it('keeps two table columns apart as tab-separated rows', () => {
    // Left column at x=50, right column at x=300, three rows going down.
    const chunks = [
      c('hond', 50, 700), c('dog', 300, 700),
      c('kat', 50, 680), c('cat', 300, 680),
      c('vogel', 50, 660), c('bird', 300, 660),
    ];
    expect(reconstructPageLines(chunks)).toEqual([
      'hond\tdog',
      'kat\tcat',
      'vogel\tbird',
    ]);
  });

  it('does not merge the two columns into one string', () => {
    const lines = reconstructPageLines([
      c('huis', 50, 700), c('house', 300, 700),
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('huis\thouse');
    expect(lines[0]).not.toContain('huishouse');
  });

  it('drops text outside the table (titles, page numbers, hints)', () => {
    const chunks = [
      c('Hoofdstuk 5 - Dieren', 50, 760), // title, single block far above
      c('hond', 50, 700), c('dog', 300, 700),
      c('kat', 50, 680), c('cat', 300, 680),
      c('Pagina 1', 250, 40), // page number, lone block
    ];
    expect(reconstructPageLines(chunks)).toEqual([
      'hond\tdog',
      'kat\tcat',
    ]);
  });

  it('joins multi-word cells without splitting them across columns', () => {
    const chunks = [
      // "de hond" in the left column (two chunks close together), "the dog" on the right
      c('de', 50, 700, 12), c('hond', 66, 700, 24),
      c('the', 300, 700, 18), c('dog', 322, 700, 18),
    ];
    expect(reconstructPageLines(chunks)).toEqual(['de hond\tthe dog']);
  });

  it('falls back to plain lines when there is no column structure', () => {
    const chunks = [
      c('hond - dog', 50, 700),
      c('kat - cat', 50, 680),
    ];
    expect(reconstructPageLines(chunks)).toEqual(['hond - dog', 'kat - cat']);
  });

  it('returns nothing for empty input', () => {
    expect(reconstructPageLines([])).toEqual([]);
    expect(reconstructPageLines([c('   ', 0, 0)])).toEqual([]);
  });
});
