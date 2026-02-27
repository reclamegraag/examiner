import lzString from 'lz-string';

export interface SharePayload {
  n: string;              // set naam
  a: string;              // languageA code
  b: string;              // languageB code
  p: [string, string][];  // [termA, termB] tuples
}

export function encodeShareData(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return lzString.compressToEncodedURIComponent(json);
}

export function decodeShareData(encoded: string): SharePayload | null {
  try {
    const json = lzString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;

    const data = JSON.parse(json);

    if (
      typeof data.n !== 'string' ||
      typeof data.a !== 'string' ||
      typeof data.b !== 'string' ||
      !Array.isArray(data.p) ||
      !data.p.every((pair: unknown) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        typeof pair[0] === 'string' &&
        typeof pair[1] === 'string'
      )
    ) {
      return null;
    }

    return data as SharePayload;
  } catch {
    return null;
  }
}

export function buildShareUrl(baseUrl: string, payload: SharePayload): string {
  const encoded = encodeShareData(payload);
  return `${baseUrl}/sets/import?d=${encoded}`;
}
