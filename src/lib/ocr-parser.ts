import type { ParsedWordPair, OcrLine } from '@/types';

export function parseOcrLines(lines: OcrLine[]): ParsedWordPair[] {
  const pairs: ParsedWordPair[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parsed = parseLine(line.text, i);
    if (parsed) {
      pairs.push({
        ...parsed,
        confidence: line.confidence,
        line: i,
      });
    }
  }

  return pairs;
}

function parseLine(text: string, lineIndex: number): { termA: string; termB: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const tabSplit = trimmed.split('\t');
  if (tabSplit.length >= 2) {
    return {
      termA: tabSplit[0].trim(),
      termB: tabSplit.slice(1).join(' ').trim(),
    };
  }

  const dashMatch = trimmed.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    return {
      termA: dashMatch[1].trim(),
      termB: dashMatch[2].trim(),
    };
  }

  const colonMatch = trimmed.match(/^(.+?)\s*:\s*(.+)$/);
  if (colonMatch) {
    return {
      termA: colonMatch[1].trim(),
      termB: colonMatch[2].trim(),
    };
  }

  const multiSpaceMatch = trimmed.match(/^(.+?)\s{3,}(.+)$/);
  if (multiSpaceMatch) {
    return {
      termA: multiSpaceMatch[1].trim(),
      termB: multiSpaceMatch[2].trim(),
    };
  }

  const words = trimmed.split(/\s+/);
  if (words.length >= 4) {
    const mid = Math.ceil(words.length / 2);
    return {
      termA: words.slice(0, mid).join(' '),
      termB: words.slice(mid).join(' '),
    };
  }

  if (words.length === 2) {
    return {
      termA: words[0],
      termB: words[1],
    };
  }

  return null;
}

export function validateParsedPairs(pairs: ParsedWordPair[]): {
  valid: ParsedWordPair[];
  lowConfidence: ParsedWordPair[];
} {
  const valid: ParsedWordPair[] = [];
  const lowConfidence: ParsedWordPair[] = [];

  for (const pair of pairs) {
    if (!pair.termA || !pair.termB) continue;
    
    if (pair.confidence < 60) {
      lowConfidence.push(pair);
    } else {
      valid.push(pair);
    }
  }

  return { valid, lowConfidence };
}
