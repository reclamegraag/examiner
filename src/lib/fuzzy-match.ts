const accentMap: Record<string, string> = {
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
  'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ý': 'y', 'ÿ': 'y',
  'ñ': 'n', 'ç': 'c', 'ß': 'ss',
  'œ': 'oe', 'æ': 'ae',
};

function removeAccents(str: string): string {
  return str.replace(/[àáâãäåèéêëìíîïòóôõöùúûüýÿñçßœæ]/gi, char => 
    accentMap[char.toLowerCase()] || char
  );
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (a[j - 1] === b[i - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export interface MatchResult {
  isExact: boolean;
  isAccentMatch: boolean;
  isFuzzyMatch: boolean;
  isClose: boolean;
  distance: number;
}

export function fuzzyMatch(answer: string, correct: string): MatchResult {
  const normalizedAnswer = answer.toLowerCase().trim();
  const normalizedCorrect = correct.toLowerCase().trim();

  if (normalizedAnswer === normalizedCorrect) {
    return { isExact: true, isAccentMatch: true, isFuzzyMatch: true, isClose: false, distance: 0 };
  }

  const accentRemovedAnswer = removeAccents(normalizedAnswer);
  const accentRemovedCorrect = removeAccents(normalizedCorrect);

  if (accentRemovedAnswer === accentRemovedCorrect) {
    return { isExact: false, isAccentMatch: true, isFuzzyMatch: true, isClose: false, distance: 0 };
  }

  const distance = levenshteinDistance(accentRemovedAnswer, accentRemovedCorrect);
  const isClose = distance === 1;

  return {
    isExact: false,
    isAccentMatch: false,
    isFuzzyMatch: distance === 0,
    isClose,
    distance,
  };
}

export function getMatchFeedback(result: MatchResult, correct: string): string | null {
  if (result.isExact) return null;
  if (result.isAccentMatch) return 'Let op accenten';
  if (result.isClose) return `Bijna goed! Het antwoord is: ${correct}`;
  return `Fout. Het juiste antwoord is: ${correct}`;
}
