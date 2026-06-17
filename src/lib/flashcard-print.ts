export interface PrintLayout {
  /** Stabiele identifier, bv. opgeslagen in instellingen. */
  id: string;
  /** Label voor in de UI. */
  label: string;
  cols: number;
  rows: number;
}

/**
 * Beschikbare rasterindelingen voor het afdrukken van oefenkaartjes op A4.
 * Oplopend van grote, goed leesbare kaartjes tot compacte vellen (48 per vel).
 */
export const PRINT_LAYOUTS: PrintLayout[] = [
  { id: '2x4', label: '8 per vel', cols: 2, rows: 4 },
  { id: '2x5', label: '10 per vel', cols: 2, rows: 5 },
  { id: '3x4', label: '12 per vel', cols: 3, rows: 4 },
  { id: '4x4', label: '16 per vel', cols: 4, rows: 4 },
  { id: '4x6', label: '24 per vel', cols: 4, rows: 6 },
  { id: '6x8', label: '48 per vel', cols: 6, rows: 8 },
];

export function getLayout(id: string): PrintLayout {
  return PRINT_LAYOUTS.find(l => l.id === id) ?? PRINT_LAYOUTS[2];
}

/** Aantal kaartjes (woordparen) per vel voor een indeling. */
export function cardsPerSheet(layout: PrintLayout): number {
  return layout.cols * layout.rows;
}

/**
 * Verdeelt een lijst over pagina's van `perPage` cellen. De laatste pagina
 * wordt aangevuld met `null` zodat elke pagina exact het rasteraantal heeft —
 * dat is nodig om de achterkant correct uit te lijnen.
 */
export function paginate<T>(items: T[], perPage: number): (T | null)[][] {
  if (perPage <= 0) return [];
  const pages: (T | null)[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    const slice: (T | null)[] = items.slice(i, i + perPage);
    while (slice.length < perPage) slice.push(null);
    pages.push(slice);
  }
  return pages;
}

/**
 * Geeft een pagina (rij-voor-rij, voorkant-volgorde) terug in de volgorde die
 * nodig is voor de achterkant bij dubbelzijdig printen met omslaan langs de
 * lange (verticale) zijde. Zo'n omslag is een horizontale spiegeling, dus elke
 * rij wordt omgekeerd. Hierdoor belandt de achterkant van elk kaartje precies
 * achter de eigen voorkant.
 */
export function backOrder<T>(page: T[], cols: number): T[] {
  if (cols <= 0) return [...page];
  const result: T[] = [];
  for (let r = 0; r < page.length; r += cols) {
    const row = page.slice(r, r + cols);
    row.reverse();
    result.push(...row);
  }
  return result;
}

/**
 * Bovengrens voor de lettergrootte (pt) op basis van het aantal kolommen.
 *
 * Dit is bewust ruim: korte woorden mogen lekker groot worden weergegeven. De
 * uiteindelijke grootte wordt per kaartje automatisch verkleind zodat ook lange
 * woorden of zinnen netjes in de cel passen (zie de auto-fit in de printpagina).
 */
export function maxFontSizePt(cols: number): number {
  if (cols <= 2) return 32;
  if (cols === 3) return 26;
  if (cols === 4) return 20;
  return 14;
}

/** Ondergrens voor de auto-fit zodat tekst nooit onleesbaar klein wordt. */
export const MIN_FONT_SIZE_PT = 6;
