'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { processImage } from '@/lib/ocr';
import { processImageWithGemini } from '@/lib/ocr-gemini';
import { parseOcrLines, validateParsedPairs } from '@/lib/ocr-parser';
import { getGeminiApiKey } from '@/lib/settings';
import type { ParsedWordPair } from '@/types';

export interface QueuedImage {
  id: string;
  file: File | Blob;
  previewUrl: string;
}

interface UseMultiImageOcrReturn {
  images: QueuedImage[];
  isProcessing: boolean;
  progress: number;
  currentImageIndex: number;
  parsedPairs: ParsedWordPair[];
  lowConfidencePairs: ParsedWordPair[];
  error: string | null;
  addImages: (files: (File | Blob)[]) => void;
  removeImage: (id: string) => void;
  processAll: (
    languageCode: string,
    languageA: string,
    languageB: string,
  ) => Promise<{ valid: ParsedWordPair[]; lowConfidence: ParsedWordPair[] } | null>;
  reset: () => void;
}

let idCounter = 0;

export function useMultiImageOcr(): UseMultiImageOcrReturn {
  const [images, setImages] = useState<QueuedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [parsedPairs, setParsedPairs] = useState<ParsedWordPair[]>([]);
  const [lowConfidencePairs, setLowConfidencePairs] = useState<ParsedWordPair[]>([]);
  const [error, setError] = useState<string | null>(null);

  const imageUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = imageUrlsRef.current;
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const addImages = useCallback((files: (File | Blob)[]) => {
    const newImages: QueuedImage[] = files.map(file => {
      const url = URL.createObjectURL(file);
      imageUrlsRef.current.add(url);
      return {
        id: `img-${++idCounter}`,
        file,
        previewUrl: url,
      };
    });
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.previewUrl);
        imageUrlsRef.current.delete(img.previewUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const processAll = useCallback(async (
    languageCode: string,
    languageA: string,
    languageB: string,
  ): Promise<{ valid: ParsedWordPair[]; lowConfidence: ParsedWordPair[] } | null> => {
    if (images.length === 0) return null;

    setIsProcessing(true);
    setProgress(0);
    setCurrentImageIndex(0);
    setError(null);

    const allValid: ParsedWordPair[] = [];
    const allLowConfidence: ParsedWordPair[] = [];

    try {
      const apiKey = getGeminiApiKey();
      const total = images.length;

      for (let i = 0; i < total; i++) {
        setCurrentImageIndex(i);
        const image = images[i];

        if (apiKey) {
          setProgress(Math.round(((i + 0.5) / total) * 100));
          const pairs = await processImageWithGemini(image.file, apiKey, languageA, languageB);
          const valid = pairs.filter(p => p.confidence >= 60);
          const lowConfidence = pairs.filter(p => p.confidence < 60);
          allValid.push(...valid);
          allLowConfidence.push(...lowConfidence);
        } else {
          const ocrResult = await processImage(image.file, languageCode, (p) => {
            setProgress(Math.round(((i + p) / total) * 100));
          });
          const pairs = parseOcrLines(ocrResult.lines);
          const { valid, lowConfidence } = validateParsedPairs(pairs);
          allValid.push(...valid);
          allLowConfidence.push(...lowConfidence);
        }

        setProgress(Math.round(((i + 1) / total) * 100));
      }

      setParsedPairs(allValid);
      setLowConfidencePairs(allLowConfidence);

      return { valid: allValid, lowConfidence: allLowConfidence };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR verwerking mislukt');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [images]);

  const reset = useCallback(() => {
    images.forEach(img => {
      URL.revokeObjectURL(img.previewUrl);
      imageUrlsRef.current.delete(img.previewUrl);
    });
    setImages([]);
    setIsProcessing(false);
    setProgress(0);
    setCurrentImageIndex(0);
    setParsedPairs([]);
    setLowConfidencePairs([]);
    setError(null);
  }, [images]);

  return {
    images,
    isProcessing,
    progress,
    currentImageIndex,
    parsedPairs,
    lowConfidencePairs,
    error,
    addImages,
    removeImage,
    processAll,
    reset,
  };
}
