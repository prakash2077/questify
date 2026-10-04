// Checks the app's rules without a browser. Run with: node tests/check-logic.mjs

import assert from 'node:assert/strict';
import { MAX_QUESTS } from '../js/config.js';
import {
  addDays,
  addQuest,
  canAddQuest,
  dateStr,
  isDone,
  markDone,
  questsFor,
  removeQuest,
  upcomingQuests,
} from '../js/quests.js';
import { weeksLeft, weeksLived, weeksTotal } from '../js/weeks-grid.js';

let passed = 0;
function check(name, run) {
  run();
  passed += 1;
  console.log(`ok - ${name}`);
}

const emptyState = () => ({ quests: [], days: {} });
const quest = (over = {}) => ({ name: 'Read', deadline: '21:00', priority: 2, penalty: 'Write an essay', ...over });
const noon = new Date(2026, 9, 4, 12, 0); // 4 October 2026, 12:00 local time

// ---------- Quests ----------

check('dates are local YYYY-MM-DD and roll over months', () => {
  assert.equal(dateStr(noon), '2026-10-04');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

check('a quest keeps its name, deadline, priority and penalty', () => {
  const state = emptyState();
  const { ok, quest: saved } = addQuest(state, quest({ name: '  Solve DSA  ', priority: '3' }), noon);
  assert.equal(ok, true);
  assert.equal(saved.name, 'Solve DSA');
  assert.equal(saved.deadline, '21:00');
  assert.equal(saved.priority, 3);
  assert.equal(saved.penalty, 'Write an essay');
  assert.equal(saved.createdOn, '2026-10-04');
});

check('a quest with a missing name, penalty or deadline is refused', () => {
  const state = emptyState();
  assert.equal(addQuest(state, quest({ name: '   ' }), noon).reason, 'invalid');
  assert.equal(addQuest(state, quest({ penalty: '' }), noon).reason, 'invalid');
  assert.equal(addQuest(state, quest({ deadline: '' }), noon).reason, 'invalid');
  assert.equal(addQuest(state, quest({ priority: 4 }), noon).reason, 'invalid');
  assert.equal(state.quests.length, 0);
});

check(`a fourth quest is refused (limit is ${MAX_QUESTS})`, () => {
  const state = emptyState();
  for (let i = 0; i < MAX_QUESTS; i++) assert.equal(addQuest(state, quest(), noon).ok, true);
  assert.equal(canAddQuest(state), false);
  const fourth = addQuest(state, quest(), noon);
  assert.deepEqual(fourth, { ok: false, reason: 'limit' });
  assert.equal(state.quests.length, MAX_QUESTS);
});

check('removing a quest frees a slot', () => {
  const state = emptyState();
  for (let i = 0; i < MAX_QUESTS; i++) addQuest(state, quest(), noon);
  removeQuest(state, state.quests[0].id);
  assert.equal(state.quests.length, MAX_QUESTS - 1);
  assert.equal(canAddQuest(state), true);
});

check('Today lists highest priority first, then the earlier deadline', () => {
  const state = emptyState();
  addQuest(state, quest({ name: 'low', priority: 1, deadline: '18:00' }), noon);
  addQuest(state, quest({ name: 'high-late', priority: 3, deadline: '22:00' }), noon);
  addQuest(state, quest({ name: 'high-early', priority: 3, deadline: '20:00' }), noon);
  assert.deepEqual(questsFor(state, '2026-10-04').map((q) => q.name), ['high-early', 'high-late', 'low']);
});

check('a quest made after its deadline today starts tomorrow', () => {
  const state = emptyState();
  addQuest(state, quest({ name: 'morning run', deadline: '07:00' }), noon);
  assert.equal(state.quests[0].startsOn, '2026-10-05');
  assert.deepEqual(questsFor(state, '2026-10-04'), []);
  assert.deepEqual(upcomingQuests(state, '2026-10-04').map((q) => q.name), ['morning run']);
  assert.deepEqual(questsFor(state, '2026-10-05').map((q) => q.name), ['morning run']);
});

check('a quest made exactly at its deadline also starts tomorrow', () => {
  const state = emptyState();
  addQuest(state, quest({ deadline: '12:00' }), noon);
  assert.equal(state.quests[0].startsOn, '2026-10-05');
});

check('quests come back the next day without being re-entered', () => {
  const state = emptyState();
  addQuest(state, quest({ name: 'Read' }), noon);
  assert.deepEqual(questsFor(state, '2026-10-05').map((q) => q.name), ['Read']);
  assert.deepEqual(questsFor(state, '2026-11-20').map((q) => q.name), ['Read']);
});

check('ticking a quest is done for that day only', () => {
  const state = emptyState();
  const { quest: saved } = addQuest(state, quest(), noon);
  assert.equal(isDone(state, saved.id, '2026-10-04'), false);
  markDone(state, saved.id, '2026-10-04');
  markDone(state, saved.id, '2026-10-04');
  assert.equal(isDone(state, saved.id, '2026-10-04'), true);
  assert.deepEqual(state.days['2026-10-04'].done, [saved.id]);
  assert.equal(isDone(state, saved.id, '2026-10-05'), false);
});

// ---------- Weeks left ----------

check('weeks left = lifespan x 52 - weeks lived', () => {
  assert.equal(weeksTotal(80), 4160);
  assert.equal(weeksLived('2026-09-20', noon), 2);
  assert.equal(weeksLeft({ dob: '2026-09-20', lifespanYears: 80 }, noon), 4158);
  assert.equal(weeksLeft({ dob: '1900-01-01', lifespanYears: 80 }, noon), 0);
});

console.log(`\n${passed} checks passed`);
