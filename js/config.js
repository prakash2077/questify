// Tunable numbers and wording for the whole app. Change values here, not in the screens.

export const MAX_QUESTS = 3;
export const QUEST_LIMIT_MESSAGE = 'Three is the most you can do consistently. Remove one first.';

// Priority 3 is the most important and is listed first on Today.
export const PRIORITIES = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
];

export const PENALTY_IDEAS = [
  'Write an essay',
  'Write the punishment line 100 times',
  'Stare at a wall for an hour',
];

// Rewards for finishing a quest, by its priority (1 = Low, 3 = High).
export const XP_BY_PRIORITY = { 1: 10, 2: 20, 3: 30 };
export const COINS_BY_PRIORITY = { 1: 5, 2: 10, 3: 15 };
export const CHECK_IN_XP = 5; // once a day, less than any quest

// Levels get steeper. XP needed to go from level n to n+1:
// 50 at level 1, about 650 at level 10 (roughly ten days of steady work).
export const LEVEL_BASE_XP = 50;
export const LEVEL_GROWTH = 1.33;
export function xpToNext(level) {
  return Math.round(LEVEL_BASE_XP * LEVEL_GROWTH ** (level - 1));
}

// Battleground: how many demons loom in the background, and how big they are.
// Level 1 has none, so a new player sees only their fire. One more arrives per
// level up to MAX_DEMONS, and they keep growing after that.
export const MAX_DEMONS = 6;
export function demonsForLevel(level) {
  return {
    count: Math.min(Math.max(level - 1, 0), MAX_DEMONS),
    scale: Math.min(0.8 + 0.07 * Math.max(level - 2, 0), 1.9),
  };
}
// One extra layer of Battleground sound for every this-many soldiers.
export const SOLDIERS_PER_SOUND_LAYER = 2;
export const MAX_SOUND_LAYERS = 4;
export function soundLayersFor(soldierCount) {
  return Math.min(Math.ceil(soldierCount / SOLDIERS_PER_SOUND_LAYER), MAX_SOUND_LAYERS);
}

// Demo tools
export const DEMO_COINS = 100;

// Penalty Zone
export const PENALTY_CHECK_MS = 15 * 1000; // how often an open app looks for missed deadlines
export const FALLBACK_PHRASE = 'I did it';
export const FALLBACK_HOLD_MS = 5 * 1000;

export const DEFAULT_ACCENT = '#2f7bff';
export const DEFAULT_LIFESPAN_YEARS = 80;
export const MAX_LIFESPAN_YEARS = 120;
export const WEEKS_PER_YEAR = 52;
