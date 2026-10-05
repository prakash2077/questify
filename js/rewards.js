// Coins, XP and levels. These are rules only: each function changes the state it
// is given and reports what was earned. The screens decide how to show and sound it.
// Nothing here ever takes coins or XP away; missing a quest costs a penalty, not progress.

import { CHECK_IN_XP, COINS_BY_PRIORITY, XP_BY_PRIORITY, xpToNext } from './config.js';
import { isDone, markDone } from './quests.js';

// The level a total amount of XP adds up to, and how far into that level it is.
export function levelInfo(xp) {
  let level = 1;
  let into = xp;
  while (into >= xpToNext(level)) {
    into -= xpToNext(level);
    level += 1;
  }
  return { level, into, needed: xpToNext(level) };
}

function addXp(state, amount) {
  const before = state.level;
  state.xp += amount;
  state.level = levelInfo(state.xp).level;
  return state.level - before;
}

// Marks a quest done for the day and pays out. Returns what was earned, or null
// if it was already done (so a quest can never pay twice in one day).
export function completeQuest(state, quest, date) {
  if (isDone(state, quest.id, date)) return null;
  markDone(state, quest.id, date);
  const xp = XP_BY_PRIORITY[quest.priority];
  const coins = COINS_BY_PRIORITY[quest.priority];
  state.coins += coins;
  const levelsGained = addXp(state, xp);
  return { xp, coins, levelsGained, level: state.level };
}

export function canCheckIn(state, date) {
  return !state.days[date]?.checkedIn;
}

// The daily check-in: a small XP bonus, once per day. Returns null if already used.
export function checkIn(state, date) {
  if (!canCheckIn(state, date)) return null;
  const day = (state.days[date] ??= { done: [], checkedIn: false });
  day.checkedIn = true;
  const levelsGained = addXp(state, CHECK_IN_XP);
  return { xp: CHECK_IN_XP, coins: 0, levelsGained, level: state.level };
}
