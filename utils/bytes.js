/**
 * Pure-JS byte <-> base64 helpers.
 *
 * React Native's JS engine (Hermes) has no Buffer, and the atob/btoa
 * globals round-trip through strings. These helpers work on plain
 * Uint8Array values with chunked accumulation (no call-stack overflow on
 * multi-hundred-KB documents) and are safe on every platform.
 */

const B64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  let out = '';
  let buffer = '';

  for (let i = 0; i < data.length; i += 3) {
    const has2 = i + 1 < data.length;
    const has3 = i + 2 < data.length;
    const b0 = data[i];
    const b1 = has2 ? data[i + 1] : 0;
    const b2 = has3 ? data[i + 2] : 0;
    const triplet = (b0 << 16) | (b1 << 8) | b2;

    buffer += B64_CHARS[(triplet >> 18) & 63];
    buffer += B64_CHARS[(triplet >> 12) & 63];
    buffer += has2 ? B64_CHARS[(triplet >> 6) & 63] : '=';
    buffer += has3 ? B64_CHARS[triplet & 63] : '=';

    // Flush in ~32KB batches so string concatenation stays cheap.
    if (buffer.length >= 0x8000) {
      out += buffer;
      buffer = '';
    }
  }

  return out + buffer;
}
