'use client';

import { useState, useCallback } from 'react';
import { processImage } from '@/lib/ocr';
import { processImageWithGemini } from '@/lib/ocr-gemini';
import { parseOcrLines, validateParsedPairs } from '@/lib/ocr-parser';
import { getGeminiApiKey } from '@/lib/settings';
import type { OcrResult, ParsedWordPair } from '@/types';

interface UseOcrReturn {
  isProcessing: boolean;
  progress: number;
  result: OcrResult | null;
  parsedPairs: ParsedWordPair[];
  lowConfidencePairs: ParsedWordPair[];
  error: string | null;
  process: (image: string | HTMLImageElement | Blob | File, languageCode: string, languageA?: string, languageB?: string) => Promise<{ valid: ParsedWordPair[]; lowConfidence: ParsedWordPair[] } | null>;
  reset: () => void;
}

export function useOcr(): UseOcrReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [parsedPairs, setParsedPairs] = useState<ParsedWordPair[]>([]);
  const [lowConfidencePairs, setLowConfidencePairs] = useState<ParsedWordPair[]>([]);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(async (
    image: string | HTMLImageElement | Blob | File,
    languageCode: string,
    languageA?: string,
    languageB?: string,
  ): Promise<{ valid: ParsedWordPair[]; lowConfidence: ParsedWordPair[] } | null> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const apiKey = getGeminiApiKey();

      // Try Gemini Vision if API key is set and image is a Blob/File
      if (apiKey && (image instanceof Blob || image instanceof File) && languageA && languageB) {
        setProgress(50);
        const pairs = await processImageWithGemini(image, apiKey, languageA, languageB);
        setProgress(100);

        const valid = pairs.filter(p => p.confidence >= 60);
        const lowConfidence = pairs.filter(p => p.confidence < 60);

        setParsedPairs(valid);
        setLowConfidencePairs(lowConfidence);

        return { valid, lowConfidence };
      }

      // Fallback: Tesseract OCR
      const ocrResult = await processImage(image, languageCode, (p) => {
        setProgress(Math.round(p * 100));
      });

      setResult(ocrResult);

      const pairs = parseOcrLines(ocrResult.lines);
      const { valid, lowConfidence } = validateParsedPairs(pairs);

      setParsedPairs(valid);
      setLowConfidencePairs(lowConfidence);

      return { valid, lowConfidence };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR processing failed');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setResult(null);
    setParsedPairs([]);
    setLowConfidencePairs([]);
    setError(null);
  }, []);

  return {
    isProcessing,
    progress,
    result,
    parsedPairs,
    lowConfidencePairs,
    error,
    process,
    reset,
  };
}
