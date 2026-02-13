import type { Language } from '@/types';

export const languages: Language[] = [
  { code: 'nl', name: 'Nederlands', tesseractCode: 'nld', speechCode: 'nl-NL' },
  { code: 'en', name: 'Engels', tesseractCode: 'eng', speechCode: 'en-GB' },
  { code: 'de', name: 'Duits', tesseractCode: 'deu', speechCode: 'de-DE' },
  { code: 'fr', name: 'Frans', tesseractCode: 'fra', speechCode: 'fr-FR' },
  { code: 'es', name: 'Spaans', tesseractCode: 'spa', speechCode: 'es-ES' },
  { code: 'it', name: 'Italiaans', tesseractCode: 'ita', speechCode: 'it-IT' },
  { code: 'pt', name: 'Portugees', tesseractCode: 'por', speechCode: 'pt-PT' },
  { code: 'la', name: 'Latijn', tesseractCode: 'lat', speechCode: 'la' },
];

export function getLanguageByCode(code: string): Language | undefined {
  return languages.find(lang => lang.code === code);
}

export function getLanguageByTesseract(code: string): Language | undefined {
  return languages.find(lang => lang.tesseractCode === code);
}

export function getLanguageBySpeech(code: string): Language | undefined {
  return languages.find(lang => lang.speechCode === code);
}
