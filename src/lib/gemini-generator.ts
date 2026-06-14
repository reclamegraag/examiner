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
  /** Genereer toetskaartjes met werkwoordvervoegingen i.p.v. vertaalparen.
   *  termA = werkwoord + persoon/tijd, termB = de vervoegde vorm. */
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
    ? `Genereer precies ${count} toetskaartjes met werkwoordvervoegingen in het ${languageA} over het thema "${theme}".
Moeilijkheidsgraad: ${difficultyLabel[difficulty]}

Elke kaart test precies een persoon, tijd of vorm bij een werkwoord.
Zet de vraag in "termA" als "<hele werkwoord>: <persoon/tijd>".
Zet alleen de juiste vervoegde vorm in "termB".
Gebruik bij simpele rijtjes bijvoorbeeld "aller: il" -> "va".
Als je meerdere tijden gebruikt, neem de tijd op in de cue, bijvoorbeeld "aller: present - nous" -> "allons".
Maak geen gecombineerde antwoorden met meerdere personen of tijden. Vermijd duplicaten.

Geef ALLEEN een JSON-array terug met objecten met "termA" en "termB".
Geen uitleg, geen nummering, alleen de JSON-array.
Voorbeeld: [{"termA":"aller: il","termB":"va"},{"termA":"gaan: ik","termB":"ga"},{"termA":"to be: they","termB":"are"}]`
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
