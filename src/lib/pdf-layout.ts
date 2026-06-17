/**
 * Reconstructs visual table rows from positioned PDF text chunks.
 *
 * PDF text extraction yields chunks in an arbitrary reading order, so a naive
 * concatenation merges two columns of a vocabulary table into one string and
 * pulls in text that sits outside the table (titles, page numbers, hints).
 *
 * This module rebuilds the layout geometrically:
 *  1. chunks are grouped into rows by their vertical position;
 *  2. each row is split at its widest horizontal gap (the column separator);
 *  3. rows whose split does not line up with the table's second column are
 *     discarded as out-of-table noise.
 *
 * The logic is pure (no pdfjs dependency) so it can be unit tested directly.
 */

export interface PdfTextChunk {
  str: string;
  /** Left edge, PDF user-space units. */
  x: number;
  /** Baseline position; larger is higher on the page. */
  y: number;
  /** Chunk width. */
  w: number;
  /** Font height, used as a scale reference. */
  h: number;
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

/** Joins chunks of one cell, inserting a space only across real word gaps. */
const joinCell = (chunks: PdfTextChunk[]): string => {
  let text = chunks[0].str;
  for (let i = 1; i < chunks.length; i++) {
    const prev = chunks[i - 1];
    const gap = chunks[i].x - (prev.x + prev.w);
    text += (gap > prev.h * 0.3 ? ' ' : '') + chunks[i].str;
  }
  return text.replace(/\s+/g, ' ').trim();
};

interface Row {
  chunks: PdfTextChunk[];
  /** Index after which the widest gap occurs, or -1 if a single chunk. */
  splitIndex: number;
  /** x of the first chunk to the right of the widest gap. */
  rightStartX: number;
  /** Width of the widest gap. */
  maxGap: number;
}

/**
 * Reconstructs the lines of a single page. Two-column rows are returned as
 * `left\tright` (the OCR parser already splits on tabs); rows outside the
 * detected table are dropped. Falls back to plain per-row text when no table
 * structure is found, so single-column / "woord - vertaling" PDFs still work.
 */
export function reconstructPageLines(input: PdfTextChunk[]): string[] {
  const chunks = input.filter(c => c.str.trim().length > 0);
  if (chunks.length === 0) return [];

  const heights = chunks.map(c => c.h).filter(h => h > 0);
  const rowTolerance = Math.max(median(heights) * 0.6, 2);
  const maxX = Math.max(...chunks.map(c => c.x + c.w));
  const columnGapThreshold = maxX * 0.06;
  const alignTolerance = Math.max(maxX * 0.04, 6);

  // Group chunks into rows by baseline (top to bottom).
  const byY = [...chunks].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: Row[] = [];
  let currentChunks: PdfTextChunk[] = [];
  let rowY = byY[0].y;

  const flushRow = () => {
    if (currentChunks.length === 0) return;
    const ordered = [...currentChunks].sort((a, b) => a.x - b.x);
    let splitIndex = -1;
    let maxGap = 0;
    let rightStartX = 0;
    for (let i = 0; i < ordered.length - 1; i++) {
      const gap = ordered[i + 1].x - (ordered[i].x + ordered[i].w);
      if (gap > maxGap) {
        maxGap = gap;
        splitIndex = i;
        rightStartX = ordered[i + 1].x;
      }
    }
    rows.push({ chunks: ordered, splitIndex, maxGap, rightStartX });
  };

  for (const chunk of byY) {
    if (Math.abs(chunk.y - rowY) > rowTolerance) {
      flushRow();
      currentChunks = [];
    }
    currentChunks.push(chunk);
    rowY = chunk.y;
  }
  flushRow();

  // Detect the table's second-column position from rows with a clear gap.
  const columnRows = rows.filter(r => r.splitIndex >= 0 && r.maxGap >= columnGapThreshold);
  const columnX = columnRows.length > 0 ? median(columnRows.map(r => r.rightStartX)) : null;

  if (columnX === null) {
    // No table structure — emit every row as a single line.
    return rows.map(r => joinCell(r.chunks)).filter(Boolean);
  }

  const lines: string[] = [];
  for (const row of rows) {
    const aligned =
      row.splitIndex >= 0 &&
      row.maxGap >= columnGapThreshold &&
      Math.abs(row.rightStartX - columnX) <= alignTolerance;
    if (!aligned) continue; // drop out-of-table text
    const left = joinCell(row.chunks.slice(0, row.splitIndex + 1));
    const right = joinCell(row.chunks.slice(row.splitIndex + 1));
    if (left && right) lines.push(`${left}\t${right}`);
  }

  return lines;
}
