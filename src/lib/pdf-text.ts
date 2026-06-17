'use client';

import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { OcrLine } from '@/types';

// Use the bundled worker; Turbopack/Webpack resolve this URL at build time.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export class PdfNoTextError extends Error {
  constructor() {
    super(
      'In deze PDF is geen tekst gevonden. Waarschijnlijk is het een scan of een ' +
        'foto. Maak hiervan een foto of upload de pagina als afbeelding, dan herken ' +
        'ik de tekst met tekstherkenning (OCR).',
    );
    this.name = 'PdfNoTextError';
  }
}

/**
 * Extracts text lines from a PDF that contains a real (selectable) text layer.
 *
 * Lines are reconstructed from PDF.js text items: each item carries a `hasEOL`
 * flag that marks the end of a visual line. Pages are concatenated in order.
 *
 * Throws {@link PdfNoTextError} when the document has no extractable text — i.e.
 * a scanned/image-only PDF that needs OCR instead.
 */
export async function extractPdfTextLines(file: File | Blob): Promise<OcrLine[]> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;

  const lines: OcrLine[] = [];

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();

      let current = '';
      for (const item of content.items) {
        // Marked-content items have no `str`; only text items do.
        if (!('str' in item)) continue;
        const text = item as TextItem;
        current += text.str;
        if (text.hasEOL) {
          lines.push({ text: current.trim(), confidence: 100, words: [] });
          current = '';
        }
      }
      if (current.trim()) {
        lines.push({ text: current.trim(), confidence: 100, words: [] });
      }

      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }

  const meaningful = lines.filter(l => l.text.length > 0);
  if (meaningful.length === 0) {
    throw new PdfNoTextError();
  }

  return meaningful;
}
