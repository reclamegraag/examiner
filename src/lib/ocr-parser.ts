import type { ParsedWordPair, OcrLine } from '@/types';

type ConjugationPrompt = {
  pronoun: string;
  form: string;
};

type IndexedOcrLine = OcrLine & { index: number };

const SUBJECT_PRONOUNS = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'ik', 'jij', 'je', 'u', 'hij', 'zij', 'ze', 'het', 'wij', 'jullie',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr',
  'j', 'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'yo', 'el', 'ella', 'usted', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'ustedes',
  'io', 'lui', 'lei', 'noi', 'voi', 'loro',
  'eu', 'ele', 'ela', 'voce', 'nos', 'vos', 'eles', 'elas', 'voces',
]);

const IGNORED_HEADINGS = new Set([
  'present', 'present tense', 'simple present',
  'tegenwoordige tijd', 'presens',
  'indicatif', 'indicatif present', 'present de l indicatif',
  'presente', 'presente de indicativo',
  'werkwoord', 'werkwoorden', 'verb', 'verbs', 'verbe', 'verbes', 'verbo', 'verbos',
]);

export function parseOcrLines(lines: OcrLine[]): ParsedWordPair[] {
  const pairs: ParsedWordPair[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parsed = parseLine(line.text);
    if (parsed) {
      pairs.push({
        ...parsed,
        confidence: line.confidence,
        line: i,
      });
    }
  }

  if (pairs.length > 0) return pairs;

  // Fallback: if no pairs found on individual lines, try pairing
  // consecutive non-empty lines (handles columnar OCR output)
  const nonEmpty = lines
    .map((line, i) => ({ line, index: i }))
    .filter(({ line }) => line.text.trim().length > 0);

  if (nonEmpty.length >= 2 && nonEmpty.length % 2 === 0) {
    const half = nonEmpty.length / 2;
    for (let i = 0; i < half; i++) {
      const a = nonEmpty[i];
      const b = nonEmpty[i + half];
      pairs.push({
        termA: a.line.text.trim(),
        termB: b.line.text.trim(),
        confidence: Math.min(a.line.confidence, b.line.confidence),
        line: a.index,
      });
    }
  }

  return pairs;
}

export function parseConjugationLines(lines: OcrLine[]): ParsedWordPair[] {
  const indexedLines = lines
    .map((line, index) => ({ ...line, index, text: normalizeLineText(line.text) }))
    .filter(line => line.text.length > 0);

  const pairs: ParsedWordPair[] = [];
  const seen = new Set<string>();

  const addPair = (pair: ParsedWordPair) => {
    const key = `${pair.termA.toLocaleLowerCase()}\u0000${pair.termB.toLocaleLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push(pair);
  };

  for (const pair of parsePronounTables(indexedLines)) {
    addPair(pair);
  }

  let currentVerb: { verb: string; confidence: number; line: number } | null = null;

  for (const line of indexedLines) {
    const parsed = parseConjugationText(line.text, line.confidence, line.index, currentVerb?.verb);

    if (parsed.length > 0) {
      parsed.forEach(addPair);
      continue;
    }

    const heading = getVerbHeading(line.text);
    if (heading) {
      currentVerb = { verb: heading, confidence: line.confidence, line: line.index };
    }
  }

  return pairs;
}

function parsePronounTables(lines: IndexedOcrLine[]): ParsedWordPair[] {
  const pairs: ParsedWordPair[] = [];

  for (let i = 0; i < lines.length - 1; i++) {
    const headerPronouns = getPronounHeader(tokenizeConjugationText(lines[i].text));
    if (!headerPronouns) continue;

    const previousHeading = i > 0 ? getVerbHeading(lines[i - 1].text) : null;

    for (let rowIndex = i + 1; rowIndex < lines.length; rowIndex++) {
      const row = lines[rowIndex];
      const rowTokens = tokenizeConjugationText(row.text);
      if (rowTokens.length === 0) break;

      if (rowTokens.length === headerPronouns.length + 1) {
        const verb = cleanDisplayText(rowTokens[0]);
        if (!verb || isKnownPronounToken(verb)) break;

        pairs.push(...buildConjugationPairs(
          verb,
          headerPronouns.map((pronoun, index) => ({ pronoun, form: cleanDisplayText(rowTokens[index + 1]) })),
          Math.min(lines[i].confidence, row.confidence),
          row.index,
        ));
        continue;
      }

      if (previousHeading && rowIndex === i + 1 && rowTokens.length === headerPronouns.length) {
        pairs.push(...buildConjugationPairs(
          previousHeading,
          headerPronouns.map((pronoun, index) => ({ pronoun, form: cleanDisplayText(rowTokens[index]) })),
          Math.min(lines[i].confidence, row.confidence),
          row.index,
        ));
      }

      break;
    }
  }

  return pairs;
}

function parseConjugationText(
  text: string,
  confidence: number,
  lineIndex: number,
  fallbackVerb?: string,
): ParsedWordPair[] {
  const colonMatch = text.match(/^(.+?)\s*:\s*(.+)$/);
  if (colonMatch) {
    const verb = getVerbHeading(colonMatch[1]);
    const prompts = parsePronounSequence(tokenizeConjugationText(colonMatch[2]));
    if (verb && prompts.length > 0) {
      return buildConjugationPairs(verb, prompts, confidence, lineIndex);
    }
  }

  const tokens = tokenizeConjugationText(text);
  const firstPronounIndex = tokens.findIndex(isKnownPronounToken);

  if (firstPronounIndex === 0 && fallbackVerb) {
    return buildConjugationPairs(
      fallbackVerb,
      parsePronounSequence(tokens),
      confidence,
      lineIndex,
    );
  }

  if (firstPronounIndex > 0) {
    const verb = getVerbHeading(tokens.slice(0, firstPronounIndex).join(' '));
    if (!verb) return [];

    return buildConjugationPairs(
      verb,
      parsePronounSequence(tokens.slice(firstPronounIndex)),
      confidence,
      lineIndex,
    );
  }

  return [];
}

function buildConjugationPairs(
  verb: string,
  prompts: ConjugationPrompt[],
  confidence: number,
  line: number,
): ParsedWordPair[] {
  return prompts
    .filter(prompt => prompt.pronoun && prompt.form)
    .map(prompt => ({
      termA: `${verb}: ${prompt.pronoun}`,
      termB: prompt.form,
      confidence,
      line,
    }));
}

function parsePronounSequence(tokens: string[]): ConjugationPrompt[] {
  const prompts: ConjugationPrompt[] = [];
  let i = 0;

  while (i < tokens.length) {
    const pronoun = readPronoun(tokens[i]);
    if (!pronoun) {
      i++;
      continue;
    }

    i++;
    const formTokens: string[] = [];

    while (i < tokens.length && !isKnownPronounToken(tokens[i])) {
      const token = cleanDisplayText(tokens[i]);
      if (token && token !== '-') {
        formTokens.push(token);
      }
      i++;
    }

    const form = cleanDisplayText(formTokens.join(' '));
    if (form) {
      prompts.push({ pronoun, form });
    }
  }

  return prompts;
}

function getPronounHeader(tokens: string[]): string[] | null {
  if (tokens.length < 2) return null;
  const pronouns = tokens.map(readPronoun);
  return pronouns.every(Boolean) ? pronouns as string[] : null;
}

function readPronoun(token: string): string | null {
  return isKnownPronounToken(token) ? cleanDisplayText(token) : null;
}

function isKnownPronounToken(token: string): boolean {
  const normalized = normalizeForMatch(token).replace(/['.]/g, '');
  if (SUBJECT_PRONOUNS.has(normalized)) return true;

  const parts = normalized.split(/[\/\\]+/).filter(Boolean);
  return parts.length > 1 && parts.every(part => SUBJECT_PRONOUNS.has(part));
}

function getVerbHeading(text: string): string | null {
  const cleaned = cleanDisplayText(
    normalizeLineText(text)
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .replace(/\b(?:werkwoord|verb|verbe|verbo)\b\s*:?\s*/i, ''),
  );
  if (!cleaned) return null;

  const tokens = tokenizeConjugationText(cleaned);
  if (tokens.length === 0 || tokens.length > 3) return null;
  if (tokens.some(isKnownPronounToken)) return null;
  if (IGNORED_HEADINGS.has(normalizeForMatch(cleaned))) return null;

  if (tokens.length === 1) return cleanDisplayText(tokens[0]);
  if (normalizeForMatch(tokens[0]) === 'to' && tokens.length === 2) return cleanDisplayText(tokens.join(' '));

  return null;
}

function tokenizeConjugationText(text: string): string[] {
  return normalizeLineText(text)
    .replace(/[\u2013\u2014]/g, ' ')
    .replace(/[=,;|()[\]{}]/g, ' ')
    .split(/\s+/)
    .flatMap(splitElidedPronoun)
    .map(cleanDisplayText)
    .filter(Boolean);
}

function splitElidedPronoun(token: string): string[] {
  const match = token.match(/^(j['\u2019])(.+)$/i);
  if (!match) return [token];
  return [match[1], match[2]];
}

function normalizeLineText(text: string): string {
  return text
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDisplayText(text: string): string {
  return text
    .replace(/^[\s"'`]+|[\s"'`.,;:!?]+$/g, '')
    .trim();
}

function normalizeForMatch(text: string): string {
  return cleanDisplayText(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9'\/\\ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLine(text: string): { termA: string; termB: string } | null {
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

  const multiSpaceMatch = trimmed.match(/^(.+?)\s{2,}(.+)$/);
  if (multiSpaceMatch) {
    return {
      termA: multiSpaceMatch[1].trim(),
      termB: multiSpaceMatch[2].trim(),
    };
  }

  const words = trimmed.split(/\s+/);
  if (words.length >= 3) {
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
