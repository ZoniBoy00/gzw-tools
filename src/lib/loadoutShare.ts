// Shareable loadout links: the loadout is packed into a URL-safe base64 string in ?loadout=.

export interface SharedLoadout {
  name: string;
  weapons: string[];
  vest: string;
  helmet: string;
  ammo: string[];
  notes: string;
}

const MAX_ITEMS = 20;
const MAX_TEXT = 500;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

const text = (value: unknown) => (typeof value === 'string' ? value.slice(0, MAX_TEXT) : '');
const list = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, MAX_ITEMS).map((item) => item.slice(0, MAX_TEXT)) : [];

export function encodeLoadout(loadout: SharedLoadout): string {
  return toBase64Url(JSON.stringify({ n: loadout.name, w: loadout.weapons, v: loadout.vest, h: loadout.helmet, a: loadout.ammo, t: loadout.notes }));
}

export function decodeLoadout(encoded: string): SharedLoadout | null {
  try {
    const data = JSON.parse(fromBase64Url(encoded)) as Record<string, unknown>;
    const name = text(data.n).trim();
    if (!name) return null;
    return { name, weapons: list(data.w), vest: text(data.v), helmet: text(data.h), ammo: list(data.a), notes: text(data.t) };
  } catch {
    return null;
  }
}

export function loadoutShareUrl(loadout: SharedLoadout, origin: string): string {
  return `${origin}/loadouts?loadout=${encodeLoadout(loadout)}`;
}
