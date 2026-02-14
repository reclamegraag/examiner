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

export async function processImageWithGemini(
  image: Blob | File,
  apiKey: string,
  languageA: string,
  languageB: string,
): Promise<ParsedWordPair[]> {
  const { base64, mimeType } = await imageToBase64(image);

  const prompt = `Extract ALL word pairs from this vocabulary list image.
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
