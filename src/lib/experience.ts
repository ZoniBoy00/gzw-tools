import type { ExperienceAction, ExperienceLevel } from './api';

export interface XpProgress {
  /** Total experience still needed to reach the target level. */
  remaining: number;
  /** Total experience the player is assumed to have (level threshold plus progress). */
  currentXp: number;
  targetXp: number;
  /** Experience between the current level and the next one, if there is a next level. */
  nextLevelCost: number | null;
}

function byLevel(levels: ExperienceLevel[]): ExperienceLevel[] {
  return [...levels].sort((a, b) => a.level - b.level);
}

/** Clamp a level to the range the wiki table covers. */
export function clampLevel(levels: ExperienceLevel[], level: number): number {
  if (levels.length === 0) return 1;
  const sorted = byLevel(levels);
  return Math.min(Math.max(Math.trunc(level) || sorted[0].level, sorted[0].level), sorted[sorted.length - 1].level);
}

/** Level a player has reached with a total experience amount. */
export function levelForXp(levels: ExperienceLevel[], xp: number): number {
  let reached = byLevel(levels)[0]?.level ?? 1;
  for (const entry of byLevel(levels)) {
    if (xp >= entry.threshold) reached = entry.level;
  }
  return reached;
}

/**
 * Experience needed to go from `currentLevel` (plus `progress` XP already earned towards the next level)
 * to `targetLevel`. Progress is limited to the size of the current level.
 */
export function computeXpProgress(levels: ExperienceLevel[], currentLevel: number, progress: number, targetLevel: number): XpProgress | null {
  const sorted = byLevel(levels);
  const current = sorted.find(entry => entry.level === currentLevel);
  const target = sorted.find(entry => entry.level === targetLevel);
  if (!current || !target) return null;
  const next = sorted.find(entry => entry.level === currentLevel + 1) ?? null;
  const nextLevelCost = next ? next.threshold - current.threshold : null;
  const safeProgress = Math.max(0, Math.min(Number.isFinite(progress) ? progress : 0, nextLevelCost ?? 0));
  const currentXp = current.threshold + safeProgress;
  return {
    remaining: Math.max(0, target.threshold - currentXp),
    currentXp,
    targetXp: target.threshold,
    nextLevelCost,
  };
}

/** How many times an action must be repeated to earn the experience, rounded up. */
export function repeatsNeeded(remaining: number, actions: ExperienceAction[]): { action: ExperienceAction; count: number }[] {
  return actions
    .filter(action => action.experience > 0)
    .map(action => ({ action, count: Math.ceil(remaining / action.experience) }));
}

/** Rewards unlocked by every level in (currentLevel, targetLevel]. */
export function rewardsBetween(levels: ExperienceLevel[], currentLevel: number, targetLevel: number): { level: number; rewards: string[] }[] {
  return byLevel(levels)
    .filter(entry => entry.level > currentLevel && entry.level <= targetLevel && entry.rewards.length > 0)
    .map(entry => ({ level: entry.level, rewards: entry.rewards }));
}
