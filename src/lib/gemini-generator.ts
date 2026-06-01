interface GeminiPair {
  termA: string;
  termB: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message: string };
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const difficultyLabel: Record<Difficulty, string> = {
  beginner: 'beginner (eenvoudige, veelgebruikte woorden)',
  intermediate: 'gemiddeld (schoolniveau, alledaagse woordenschat)',
  advanced: 'gevorderd (complexe, minder gangbare woorden)',
};

export interface GenerateOptions {
  /** Genereer werkwoordvervoegingen i.p.v. vertaalparen. termA = hele werkwoord,
   *  termB = de overige vervoegingen (bv. verleden tijd / voltooid deelwoord) samen. */
  conjugation?: boolean;
}

export async function generateWordPairs(
  apiKey: string,
  theme: string,
  languageA: string,
  languageB: string,
  count: number,
  difficulty: Difficulty,
  options: GenerateOptions = {},
): Promise<{ termA: string; termB: string }[]> {
  const prompt = options.conjugation
    ? `Genereer precies ${count} werkwoordvervoegingen in het ${languageA} over het thema "${theme}".
Moeilijkheidsgraad: ${difficultyLabel[difficulty]}

Veel werkwoorden hebben meerdere vormen (bijvoorbeeld hele werkwoord/tegenwoordige tijd, verleden tijd en voltooid deelwoord).
Zet de hele/onbepaalde vorm in "termA" en voeg ALLE overige vervoegingen samen in "termB", gescheiden door " / ".
Maak GEEN aparte regel per tijd; combineer alle tijden van hetzelfde werkwoord in één object. Vermijd duplicaten.

Geef ALLEEN een JSON-array terug met objecten met "termA" en "termB".
Geen uitleg, geen nummering, alleen de JSON-array.
Voorbeeld: [{"termA":"come","termB":"came / come"},{"termA":"buy","termB":"bought / bought"},{"termA":"choose","termB":"chose / chosen"}]`
    : `Genereer precies ${count} woordparen over het thema "${theme}".
Taal A: ${languageA}
Taal B: ${languageB}
Moeilijkheidsgraad: ${difficultyLabel[difficulty]}

Geef ALLEEN een JSON-array terug met objecten met "termA" (in ${languageA}) en "termB" (in ${languageB}).
Geen uitleg, geen nummering, alleen de JSON-array.
Voorbeeld: [{"termA":"hond","termB":"dog"},{"termA":"kat","termB":"cat"}]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
        },
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || `Gemini API fout (${response.status})`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Geen resultaat van Gemini');
  }

  const parsed: GeminiPair[] = JSON.parse(text);

  if (!Array.isArray(parsed)) {
    throw new Error('Onverwacht formaat van Gemini');
  }

  return parsed
    .filter(p => p.termA?.trim() && p.termB?.trim())
    .map(p => ({
      termA: p.termA.trim(),
      termB: p.termB.trim(),
    }));
}
