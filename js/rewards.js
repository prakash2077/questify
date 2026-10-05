// Coins, XP and levels. These are rules only: each function changes the state it
// is given and reports what was earned. The screens decide how to show and sound it.
// Nothing here ever takes coins or XP away; missing a quest costs a penalty, not progress.

import { CHECK_IN_XP, COINS_BY_PRIORITY, XP_BY_PRIORITY, xpToNext } from './config.js';
import { isDone, markDone, newId } from './quests.js';
import { CATALOG, MAX_SOLDIER_NAME } from '../data/catalog.js';

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

// Every quest ever finished, across all days. It only ever goes up.
export function totalCleared(state) {
  return Object.values(state.days).reduce((total, day) => total + day.done.length, 0);
}

// ---------- Spending coins ----------

// Buys one Shop item. Soldiers need a name; weapons do not.
// Returns { ok: true, owned, item }, or { ok: false, reason } with nothing changed:
// 'coins' (with how many are missing in `short`), 'name', or 'unknown'.
export function buyItem(state, catalogId, name) {
  const item = CATALOG.find((entry) => entry.id === catalogId);
  if (!item) return { ok: false, reason: 'unknown' };
  if (state.coins < item.price) return { ok: false, reason: 'coins', short: item.price - state.coins };

  let soldierName = null;
  if (item.kind === 'soldier') {
    soldierName = String(name ?? '').trim().slice(0, MAX_SOLDIER_NAME);
    if (!soldierName) return { ok: false, reason: 'name' };
  }

  state.coins -= item.price;
  const owned = { id: newId(), catalogId, name: soldierName };
  state.army.push(owned);
  return { ok: true, owned, item };
}

// The army split into what the Battleground draws: soldiers and weapons, in the order bought.
export function armyOf(state) {
  const withItem = state.army
    .map((owned) => ({ ...owned, item: CATALOG.find((entry) => entry.id === owned.catalogId) }))
    .filter((owned) => owned.item);
  return {
    soldiers: withItem.filter((owned) => owned.item.kind === 'soldier'),
    weapons: withItem.filter((owned) => owned.item.kind === 'weapon'),
  };
}

// ---------- Daily check-in ----------

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
