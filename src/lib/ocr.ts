import { createWorker, type Worker } from 'tesseract.js';
import type { OcrResult, OcrLine, OcrWord } from '@/types';

const workerCache: Map<string, Worker> = new Map();

let currentProgressCallback: ((progress: number) => void) | undefined;

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

interface TesseractLine {
  text: string;
  confidence: number;
  words?: TesseractWord[];
}

interface TesseractData {
  text: string;
  confidence: number;
  lines?: TesseractLine[];
}

export async function getWorker(languageCode: string): Promise<Worker> {
  const cached = workerCache.get(languageCode);
  if (cached) return cached;

  const worker = await createWorker(languageCode, 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && currentProgressCallback) {
        currentProgressCallback(m.progress);
      }
    },
  });

  workerCache.set(languageCode, worker);
  return worker;
}

export async function processImage(
  image: string | HTMLImageElement | Blob | File,
  languageCode: string,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  currentProgressCallback = onProgress;
  const worker = await getWorker(languageCode);

  const result = await worker.recognize(image);
  currentProgressCallback = undefined;
  const data = result.data as TesseractData;

  const lines: OcrLine[] = [];
  
  if (data.lines) {
    for (const line of data.lines) {
      const words: OcrWord[] = [];
      if (line.words) {
        for (const word of line.words) {
          words.push({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox,
          });
        }
      }
      lines.push({
        text: line.text.trim(),
        confidence: line.confidence,
        words,
      });
    }
  }

  return {
    text: data.text,
    confidence: data.confidence,
    lines,
  };
}

export async function terminateWorkers(): Promise<void> {
  const promises = Array.from(workerCache.values()).map(worker => worker.terminate());
  workerCache.clear();
  await Promise.all(promises);
}
