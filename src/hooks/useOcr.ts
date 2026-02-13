'use client';

import { useState, useCallback } from 'react';
import { processImage } from '@/lib/ocr';
import { parseOcrLines, validateParsedPairs } from '@/lib/ocr-parser';
import type { OcrResult, ParsedWordPair } from '@/types';

interface UseOcrReturn {
  isProcessing: boolean;
  progress: number;
  result: OcrResult | null;
  parsedPairs: ParsedWordPair[];
  lowConfidencePairs: ParsedWordPair[];
  error: string | null;
  process: (image: string | HTMLImageElement | Blob | File, languageCode: string) => Promise<void>;
  reset: () => void;
}

export function useOcr(): UseOcrReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [parsedPairs, setParsedPairs] = useState<ParsedWordPair[]>([]);
  const [lowConfidencePairs, setLowConfidencePairs] = useState<ParsedWordPair[]>([]);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(async (image: string | HTMLImageElement | Blob | File, languageCode: string) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const ocrResult = await processImage(image, languageCode, (p) => {
        setProgress(Math.round(p * 100));
      });

      setResult(ocrResult);

      const pairs = parseOcrLines(ocrResult.lines);
      const { valid, lowConfidence } = validateParsedPairs(pairs);

      setParsedPairs(valid);
      setLowConfidencePairs(lowConfidence);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR processing failed');
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
