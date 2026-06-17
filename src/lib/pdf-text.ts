'use client';

import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { OcrLine } from '@/types';
import { reconstructPageLines, type PdfTextChunk } from './pdf-layout';

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
 * Each page's positioned text chunks are reconstructed into table rows by
 * {@link reconstructPageLines}, which keeps two columns apart and discards
 * out-of-table text. Pages are processed independently and concatenated.
 *
 * Throws {@link PdfNoTextError} when the document has no extractable text — i.e.
 * a scanned/image-only PDF that needs OCR instead.
 */
export async function extractPdfTextLines(file: File | Blob): Promise<OcrLine[]> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;

  const lines: OcrLine[] = [];
  let hadAnyText = false;

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();

      const chunks: PdfTextChunk[] = [];
      for (const item of content.items) {
        // Marked-content items have no `str`; only text items do.
        if (!('str' in item)) continue;
        const text = item as TextItem;
        if (text.str.trim().length > 0) hadAnyText = true;
        chunks.push({
          str: text.str,
          x: text.transform[4],
          y: text.transform[5],
          w: text.width,
          h: text.height,
        });
      }

      for (const line of reconstructPageLines(chunks)) {
        lines.push({ text: line, confidence: 100, words: [] });
      }

      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }

  // No selectable text at all → scanned/image-only PDF that needs OCR.
  if (!hadAnyText) {
    throw new PdfNoTextError();
  }

  return lines;
}
