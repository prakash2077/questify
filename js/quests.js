// Goals and recurring daily quests: the three-quest rule and today's list.
// Everything here works on the state object it is given and never touches the
// page, so the rules can be checked on their own.

import { MAX_QUESTS } from './config.js';

const pad = (n) => String(n).padStart(2, '0');

// The device's local date as YYYY-MM-DD.
export function dateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  return dateStr(new Date(y, m - 1, d + n));
}

// The exact moment a quest is due on a given date.
export function deadlineAt(quest, date) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = quest.deadline.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

export function canAddQuest(state) {
  return state.quests.length < MAX_QUESTS;
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Adds a recurring daily quest. A quest created after its deadline has already
// passed today begins tomorrow, so it can never be "missed" the moment it is made.
export function addQuest(state, input, now = new Date()) {
  if (!canAddQuest(state)) return { ok: false, reason: 'limit' };

  const name = String(input.name ?? '').trim();
  const penalty = String(input.penalty ?? '').trim();
  const deadline = String(input.deadline ?? '');
  const priority = Number(input.priority);
  if (!name || !penalty || !/^\d{2}:\d{2}$/.test(deadline) || ![1, 2, 3].includes(priority)) {
    return { ok: false, reason: 'invalid' };
  }

  const today = dateStr(now);
  const quest = { id: newId(), name, deadline, priority, penalty, createdOn: today, startsOn: today };
  if (now >= deadlineAt(quest, today)) quest.startsOn = addDays(today, 1);
  state.quests.push(quest);
  return { ok: true, quest };
}

export function removeQuest(state, id) {
  state.quests = state.quests.filter((q) => q.id !== id);
}

// Highest priority first; equal priorities by the earlier deadline.
function byPriority(a, b) {
  return b.priority - a.priority || a.deadline.localeCompare(b.deadline);
}

// The quests that count on this date.
export function questsFor(state, date) {
  return state.quests.filter((q) => q.startsOn <= date).sort(byPriority);
}

// Quests that exist but have not started yet (made after their deadline today).
export function upcomingQuests(state, date) {
  return state.quests.filter((q) => q.startsOn > date).sort(byPriority);
}

export function isDone(state, questId, date) {
  return Boolean(state.days[date]?.done.includes(questId));
}

export function markDone(state, questId, date) {
  const day = (state.days[date] ??= { done: [], checkedIn: false });
  if (!day.done.includes(questId)) day.done.push(questId);
}
