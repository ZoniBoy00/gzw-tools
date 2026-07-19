// Vendor Rep Tracker — localStorage-backed vendor reputation values
// Defaults to 0, persists user's actual in-game rep

import { VENDORS } from './calc';

const LS_KEY = 'gzw-vendor-reps';

export interface VendorRep {
  slug: string;
  name: string;
  rep: number;
  maxRep: number;
  desc: string;
}

function loadReps(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveReps(reps: Record<string, number>) {
  localStorage.setItem(LS_KEY, JSON.stringify(reps));
}

export function getVendorReps(): VendorRep[] {
  const saved = loadReps();
  return VENDORS.map((v) => ({
    slug: v.slug,
    name: v.name,
    rep: saved[v.slug] ?? 0,
    maxRep: v.maxRep,
    desc: v.desc,
  }));
}

export function setVendorRep(slug: string, rep: number) {
  const saved = loadReps();
  saved[slug] = Math.max(0, Math.min(rep, VENDORS.find((v) => v.slug === slug)?.maxRep ?? 13000));
  saveReps(saved);
}

export function setVendorReps(reps: Record<string, number>) {
  const saved = loadReps();
  for (const [slug, rep] of Object.entries(reps)) {
    saved[slug] = Math.max(0, Math.min(rep, VENDORS.find((v) => v.slug === slug)?.maxRep ?? 13000));
  }
  saveReps(saved);
}

export function resetVendorReps() {
  localStorage.removeItem(LS_KEY);
}

export function useVendorReps(): VendorRep[] {
  // Simple read — caller triggers re-render via state
  return getVendorReps();
}
