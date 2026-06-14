import type { ParsedWordPair } from '@/types';

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

function imageToBase64(image: Blob | File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(image);
  });
}

export interface GeminiOcrOptions {
  /** Verwerk de afbeelding als werkwoordvervoegingstabel i.p.v. vertaalparen.
   *  termA = de toetsvraag met werkwoord + persoon/tijd, termB = de vervoegde vorm. */
  conjugation?: boolean;
}

export async function processImageWithGemini(
  image: Blob | File,
  apiKey: string,
  languageA: string,
  languageB: string,
  options: GeminiOcrOptions = {},
): Promise<ParsedWordPair[]> {
  const { base64, mimeType } = await imageToBase64(image);

  const prompt = options.conjugation
    ? `This image shows verb conjugations in ${languageA}.
Extract EVERY testable conjugated form as a separate quiz card.
For each verb block or table, identify the base/infinitive verb (for example "aller", "gaan", "to go").
For each subject/person/tense cue, put the quiz question in "termA" as "<base verb>: <cue>".
Put ONLY the conjugated answer in "termB".
If a page has multiple tenses or moods, include the tense/mood in the cue, for example "aller: present - il".
If the page only shows pronouns, use just the pronoun cue, for example "aller: il".
Keep alternative forms exactly as written, separated as written.
Ignore translations, phonetic transcriptions in square brackets, explanations, page titles, headers and numbering.
Return one object per conjugated form; never combine multiple pronouns or tenses into one answer.
Return ONLY a JSON array of objects with "termA" and "termB".
Examples: [{"termA":"aller: il","termB":"va"},{"termA":"gaan: ik","termB":"ga"},{"termA":"aller: present - nous","termB":"allons"}]`
    : `Extract ALL word pairs from this vocabulary list image.
The list contains pairs in two languages: ${languageA} and ${languageB}.
Return ONLY a JSON array of objects with "termA" (${languageA}) and "termB" (${languageB}).
Ignore numbering, bullet points, and headers. Only return the word pairs.
Example: [{"termA":"house","termB":"huis"},{"termA":"cat","termB":"kat"}]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
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
    .map((p, i) => ({
      termA: p.termA.trim(),
      termB: p.termB.trim(),
      confidence: 95,
      line: i,
    }));
}
