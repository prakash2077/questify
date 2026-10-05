// Checks the app's rules without a browser. Run with: node tests/check-logic.mjs

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { CHECK_IN_XP, MAX_QUESTS, XP_BY_PRIORITY, demonsForLevel, soundLayersFor, xpToNext } from '../js/config.js';
import { armyOf, buyItem, canCheckIn, checkIn, completeQuest, levelInfo, totalCleared } from '../js/rewards.js';
import { QUOTES, quoteOfTheDay } from '../data/quotes.js';
import { CATALOG, FIRST_SOLDIER_NAME } from '../data/catalog.js';
import {
  addDays,
  addQuest,
  canAddQuest,
  dateStr,
  deadlineTime,
  findMissed,
  isDone,
  markDone,
  nextDeadline,
  penaltyServed,
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

// ---------- Missed quests (the Penalty Zone trigger) ----------

// A state with one 21:00 quest that started on 4 October.
function withQuest(over = {}) {
  const state = { quests: [], days: {}, proofs: [] };
  const { quest: saved } = addQuest(state, quest(over), noon);
  return { state, id: saved.id };
}
const at = (day, hh, mm = 0) => new Date(2026, 9, day, hh, mm);

check('before the deadline nothing is missed', () => {
  const { state } = withQuest();
  assert.deepEqual(findMissed(state, at(4, 20, 59)), []);
});

check('deadline passed without a tick is a miss', () => {
  const { state, id } = withQuest();
  assert.deepEqual(findMissed(state, at(4, 21, 0)), [{ questId: id, date: '2026-10-04' }]);
});

check('a ticked quest is never missed', () => {
  const { state, id } = withQuest();
  markDone(state, id, '2026-10-04');
  assert.deepEqual(findMissed(state, at(4, 23, 0)), []);
});

check('a miss on an earlier day is found when the app opens the next morning', () => {
  const { state, id } = withQuest();
  assert.deepEqual(findMissed(state, at(5, 8)), [{ questId: id, date: '2026-10-04' }]);
});

check('a quest made after its deadline is not missed that day', () => {
  const { state, id } = withQuest({ deadline: '07:00' });
  assert.deepEqual(findMissed(state, at(4, 23)), []);
  assert.deepEqual(findMissed(state, at(5, 7, 1)), [{ questId: id, date: '2026-10-05' }]);
});

check('a week away costs one penalty per quest, for the most recent miss', () => {
  const { state, id } = withQuest();
  assert.deepEqual(findMissed(state, at(11, 9)), [{ questId: id, date: '2026-10-10' }]);
});

check('a cleared penalty is not asked for again, and answers for earlier days', () => {
  const { state, id } = withQuest();
  state.proofs.push({ id: 'p1', questId: id, date: '2026-10-10', hasPhoto: true });
  assert.deepEqual(findMissed(state, at(11, 9)), []);
  assert.equal(penaltyServed(state, id, '2026-10-10'), true);
  assert.equal(penaltyServed(state, id, '2026-10-11'), false);
  assert.deepEqual(findMissed(state, at(11, 21)), [{ questId: id, date: '2026-10-11' }]);
});

check('several missed quests come back oldest deadline first', () => {
  const state = { quests: [], days: {}, proofs: [] };
  const late = addQuest(state, quest({ name: 'late', deadline: '20:00' }), noon).quest;
  const early = addQuest(state, quest({ name: 'early', deadline: '15:00' }), noon).quest;
  assert.deepEqual(findMissed(state, at(4, 22)), [
    { questId: early.id, date: '2026-10-04' },
    { questId: late.id, date: '2026-10-04' },
  ]);
});

check('a Demo tool deadline applies to its one day only', () => {
  const { state, id } = withQuest();
  state.quests[0].demo = { date: '2026-10-04', time: '12:01:00' };
  assert.equal(deadlineTime(state.quests[0], '2026-10-04'), '12:01:00');
  assert.equal(deadlineTime(state.quests[0], '2026-10-05'), '21:00');
  assert.deepEqual(findMissed(state, at(4, 12, 0)), []);
  assert.deepEqual(findMissed(state, at(4, 12, 1)), [{ questId: id, date: '2026-10-04' }]);
  markDone(state, id, '2026-10-04');
  assert.deepEqual(findMissed(state, at(5, 20, 59)), []);
});

check('the next deadline skips finished quests and passed deadlines', () => {
  const state = { quests: [], days: {}, proofs: [] };
  const a = addQuest(state, quest({ deadline: '15:00' }), noon).quest;
  addQuest(state, quest({ deadline: '20:00' }), noon);
  assert.equal(nextDeadline(state, noon).getHours(), 15);
  markDone(state, a.id, '2026-10-04');
  assert.equal(nextDeadline(state, noon).getHours(), 20);
  assert.equal(nextDeadline(state, at(4, 20, 30)), null);
});

// ---------- Rewards: coins, XP and levels ----------

function player(over = {}) {
  return { quests: [], days: {}, proofs: [], coins: 0, xp: 0, level: 1, ...over };
}

check('finishing a quest pays XP 10/20/30 and coins 5/10/15 by priority', () => {
  for (const [priority, xp, coins] of [[1, 10, 5], [2, 20, 10], [3, 30, 15]]) {
    const state = player();
    const { quest: saved } = addQuest(state, quest({ priority }), noon);
    assert.deepEqual(completeQuest(state, saved, '2026-10-04'), { xp, coins, levelsGained: 0, level: 1 });
    assert.equal(state.xp, xp);
    assert.equal(state.coins, coins);
    assert.equal(isDone(state, saved.id, '2026-10-04'), true);
  }
});

check('a quest cannot pay twice in one day, but pays again the next day', () => {
  const state = player();
  const { quest: saved } = addQuest(state, quest({ priority: 3 }), noon);
  completeQuest(state, saved, '2026-10-04');
  assert.equal(completeQuest(state, saved, '2026-10-04'), null);
  assert.equal(state.xp, 30);
  assert.notEqual(completeQuest(state, saved, '2026-10-05'), null);
  assert.equal(state.xp, 60);
});

check('the daily check-in gives 5 XP, once per day, less than any quest', () => {
  const state = player();
  assert.equal(canCheckIn(state, '2026-10-04'), true);
  assert.deepEqual(checkIn(state, '2026-10-04'), { xp: 5, coins: 0, levelsGained: 0, level: 1 });
  assert.equal(canCheckIn(state, '2026-10-04'), false);
  assert.equal(checkIn(state, '2026-10-04'), null);
  assert.equal(state.xp, 5);
  assert.equal(state.coins, 0);
  assert.equal(canCheckIn(state, '2026-10-05'), true);
  assert.ok(CHECK_IN_XP < Math.min(...Object.values(XP_BY_PRIORITY)));
});

check('level 1 to 2 needs 50 XP, and every later level needs more than the last', () => {
  assert.equal(xpToNext(1), 50);
  for (let level = 1; level < 30; level++) assert.ok(xpToNext(level + 1) > xpToNext(level));
  assert.ok(xpToNext(10) > 600 && xpToNext(10) < 700, `level 10 to 11 is about 650 (${xpToNext(10)})`);
});

check('the level is worked out from total XP', () => {
  assert.deepEqual(levelInfo(0), { level: 1, into: 0, needed: 50 });
  assert.deepEqual(levelInfo(49), { level: 1, into: 49, needed: 50 });
  assert.deepEqual(levelInfo(50), { level: 2, into: 0, needed: xpToNext(2) });
  assert.deepEqual(levelInfo(50 + xpToNext(2) + 3), { level: 3, into: 3, needed: xpToNext(3) });
});

check('crossing the threshold raises the level and reports it', () => {
  const state = player({ xp: 40, level: 1 });
  const { quest: saved } = addQuest(state, quest({ priority: 2 }), noon);
  assert.deepEqual(completeQuest(state, saved, '2026-10-04'), { xp: 20, coins: 10, levelsGained: 1, level: 2 });
  assert.equal(state.level, 2);
});

check('a full first day (three quests and a check-in) reaches level 2', () => {
  const state = player();
  for (const priority of [1, 2, 3]) completeQuest(state, addQuest(state, quest({ priority }), noon).quest, '2026-10-04');
  checkIn(state, '2026-10-04');
  assert.equal(state.xp, 65);
  assert.equal(state.level, 2);
});

check('missing a quest never removes coins, XP or levels', () => {
  const state = player({ coins: 40, xp: 70, level: 2 });
  addQuest(state, quest(), noon);
  assert.equal(findMissed(state, at(6, 9)).length, 1);
  assert.deepEqual([state.coins, state.xp, state.level], [40, 70, 2]);
});

// ---------- Motivation ----------

check('the count of quests cleared adds up every day and never goes down', () => {
  const state = player();
  assert.equal(totalCleared(state), 0);
  const a = addQuest(state, quest({ priority: 1 }), noon).quest;
  const b = addQuest(state, quest({ priority: 2 }), noon).quest;
  completeQuest(state, a, '2026-10-04');
  completeQuest(state, b, '2026-10-04');
  completeQuest(state, a, '2026-10-05');
  assert.equal(totalCleared(state), 3);
  assert.equal(findMissed(state, at(6, 23)).length, 2);
  assert.equal(totalCleared(state), 3, 'a missed day takes nothing away');
});

check('the quote of the day is the same all day and changes over time', () => {
  assert.deepEqual(quoteOfTheDay('2026-10-05'), quoteOfTheDay('2026-10-05'));
  const week = ['01', '02', '03', '04', '05', '06', '07'].map((day) => quoteOfTheDay(`2026-10-${day}`).text);
  assert.equal(new Set(week).size, 7, 'a week of days gives seven different quotes');
  for (const q of QUOTES) assert.ok(q.text.length > 10 && q.author.length > 2);
});

// ---------- Shop and army ----------

const price = (id) => CATALOG.find((item) => item.id === id).price;

check('the Shop sells soldiers and weapons, each with a price and a drawing', () => {
  assert.ok(CATALOG.some((item) => item.kind === 'soldier'));
  assert.ok(CATALOG.some((item) => item.kind === 'weapon'));
  for (const item of CATALOG) {
    assert.ok(item.price > 0 && item.label && item.sprite, item.id);
    assert.ok(existsSync(new URL(`../assets/sprites/${item.sprite}.svg`, import.meta.url)), `drawing for ${item.id}`);
  }
  assert.equal(new Set(CATALOG.map((item) => item.id)).size, CATALOG.length, 'ids are unique');
  assert.equal(FIRST_SOLDIER_NAME, 'Sung Jinwoo');
});

check('a purchase is blocked when coins are short, and nothing changes', () => {
  const state = player({ coins: price('swordsman') - 1, army: [] });
  assert.deepEqual(buyItem(state, 'swordsman', 'Igris'), { ok: false, reason: 'coins', short: 1 });
  assert.equal(state.coins, price('swordsman') - 1);
  assert.deepEqual(state.army, []);
});

check('buying a soldier spends the coins and saves it with its name', () => {
  const state = player({ coins: 100, army: [] });
  const result = buyItem(state, 'swordsman', '  Igris  ');
  assert.equal(result.ok, true);
  assert.equal(state.coins, 100 - price('swordsman'));
  assert.equal(state.army.length, 1);
  assert.deepEqual([state.army[0].catalogId, state.army[0].name], ['swordsman', 'Igris']);
});

check('a soldier needs a name; a weapon does not', () => {
  const state = player({ coins: 100, army: [] });
  assert.deepEqual(buyItem(state, 'swordsman', '   '), { ok: false, reason: 'name' });
  assert.equal(state.coins, 100);
  assert.equal(buyItem(state, 'sword').ok, true);
  assert.equal(state.army[0].name, null);
  assert.equal(buyItem(state, 'no-such-thing', 'x').reason, 'unknown');
});

check('the army is split into soldiers and weapons, in the order bought', () => {
  const state = player({ coins: 500, army: [] });
  buyItem(state, 'swordsman', 'Igris');
  buyItem(state, 'sword');
  buyItem(state, 'mage', 'Beru');
  const { soldiers, weapons } = armyOf(state);
  assert.deepEqual(soldiers.map((s) => s.name), ['Igris', 'Beru']);
  assert.deepEqual(weapons.map((w) => w.item.label), ['Iron Sword']);
});

check('the first soldier is affordable after one full day of quests', () => {
  const cheapest = Math.min(...CATALOG.filter((item) => item.kind === 'soldier').map((item) => item.price));
  assert.ok(cheapest <= 5 + 10 + 15, `cheapest soldier costs ${cheapest}`);
});

// ---------- Battleground ----------

check('at level 1 there are no demons: only the fire', () => {
  assert.equal(demonsForLevel(1).count, 0);
});

check('higher levels bring more demons, then bigger ones, and never fewer or smaller', () => {
  for (let level = 1; level < 40; level++) {
    const now = demonsForLevel(level);
    const next = demonsForLevel(level + 1);
    assert.ok(next.count >= now.count && next.scale >= now.scale, `level ${level + 1}`);
    assert.ok(next.count > now.count || next.scale > now.scale || level >= 18, `level ${level + 1} changes something`);
  }
  assert.ok(demonsForLevel(2).count === 1 && demonsForLevel(5).count === 4);
  assert.ok(demonsForLevel(12).scale > demonsForLevel(7).scale, 'once the horde is full, the demons keep growing');
});

check('the Battleground gains a sound layer for every few soldiers', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 20].map(soundLayersFor), [0, 1, 1, 2, 2, 3, 3, 4, 4]);
});

// ---------- Weeks left ----------

check('weeks left = lifespan x 52 - weeks lived', () => {
  assert.equal(weeksTotal(80), 4160);
  assert.equal(weeksLived('2026-09-20', noon), 2);
  assert.equal(weeksLeft({ dob: '2026-09-20', lifespanYears: 80 }, noon), 4158);
  assert.equal(weeksLeft({ dob: '1900-01-01', lifespanYears: 80 }, noon), 0);
});

// ---------- Offline file list ----------

check('every file the app loads is in the service worker\'s offline list', () => {
  const root = new URL('../', import.meta.url);
  const listed = readFileSync(new URL('sw.js', root), 'utf8')
    .match(/const APP_FILES = \[([^\]]*)\]/)[1]
    .match(/'[^']+'/g)
    .map((entry) => entry.slice(1, -1));

  const onDisk = ['index.html', 'manifest.webmanifest'];
  for (const folder of ['css', 'js', 'data', 'assets']) {
    for (const file of readdirSync(new URL(folder, root), { recursive: true, withFileTypes: true })) {
      if (!file.isFile()) continue;
      const path = `${file.parentPath}/${file.name}`.replaceAll('\\', '/');
      onDisk.push(path.slice(path.lastIndexOf(`/${folder}/`) + 1));
    }
  }

  assert.deepEqual(onDisk.filter((file) => !listed.includes(file)), [], 'files missing from APP_FILES in sw.js');
  assert.deepEqual(listed.filter((file) => file !== './' && !onDisk.includes(file)), [], 'APP_FILES names files that do not exist');
});

console.log(`\n${passed} checks passed`);
