/**
 * Map t\u00ean m\u00e0u ti\u1ebfng Vi\u1ec7t \u2192 background CSS (HEX/gradient).
 * Tr\u1ea3 v\u1ec1 `null` n\u1ebfu kh\u00f4ng nh\u1eadn ra (caller t\u1ef1 fallback).
 */

const RAW_MAP: Record<string, string> = {
  'tr\u1eafng': '#ffffff',
  'kem': '#f1e7d2',
  'be': '#e9d8b9',
  'v\u00e0ng nh\u1ea1t': '#f5e2a7',
  'v\u00e0ng': '#f5c542',

  '\u0111en': '#111111',
  'x\u00e1m': '#9aa0a6',
  'x\u00e1m nh\u1ea1t': '#c8ccd1',
  'x\u00e1m \u0111\u1eadm': '#5a5f66',
  'x\u00e1m tro': '#7e8388',
  'x\u00e1m xi m\u0103ng': '#a3a39c',

  'n\u00e2u': '#7a4f30',
  'n\u00e2u be': '#b89172',
  'n\u00e2u \u0111\u1eadm': '#4a2d1a',

  '\u0111\u1ecf': '#d33833',
  '\u0111\u1ecf \u0111\u00f4': '#7c1f23',

  'xanh d\u01b0\u01a1ng': '#2d6cdf',
  'xanh d\u01b0\u01a1ng nh\u1ea1t': '#9ec5ff',
  'xanh d\u01b0\u01a1ng \u0111\u1eadm': '#1a3a8a',
  'xanh navi': '#1d2a52',
  'xanh \u0111en': '#1b2840',
  'xanh': '#2d6cdf',

  'xanh l\u00e1': '#3f8c4d',
  'xanh l\u00e1 \u0111\u1eadm': '#244a2c',
  'xanh r\u00eau': '#5d6f3a',
  'xanh mint': '#a9e0c5',

  'h\u1ed3ng': '#f4a6c0',
  't\u00edm': '#7e57c2',
  'cam': '#f08a3d',
};

function normalize(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** L\u1ea5y background CSS cho m\u1ed9t t\u00ean m\u00e0u ti\u1ebfng Vi\u1ec7t. */
export function getColorBackground(name: string | null | undefined): string {
  if (!name) return '#e5e7eb';
  const key = normalize(name);
  if (RAW_MAP[key]) return RAW_MAP[key];

  for (const [k, v] of Object.entries(RAW_MAP)) {
    if (key.includes(k)) return v;
  }
  return '#e5e7eb';
}

/** True n\u1ebfu m\u00e0u qu\u00e1 s\u00e1ng \u2014 c\u1ea7n vi\u1ec1n t\u1ed1i \u0111\u1ec3 nh\u00ecn r\u00f5 tr\u00ean n\u1ec1n tr\u1eafng. */
export function isLightColor(name: string | null | undefined): boolean {
  const bg = getColorBackground(name);
  if (!bg.startsWith('#')) return false;
  const hex = bg.slice(1);
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.85;
}
