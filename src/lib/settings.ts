const GEMINI_KEY = 'examiner_gemini_api_key';

export function getGeminiApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GEMINI_KEY);
}

export function setGeminiApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(GEMINI_KEY, key.trim());
  } else {
    localStorage.removeItem(GEMINI_KEY);
  }
}
