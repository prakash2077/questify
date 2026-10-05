// Today: home. Shows level, XP and coins, then today's quests by priority, each
// with its deadline, a Focus button and a done tick. As a deadline closes in,
// its quest shows it: the countdown switches to seconds and the row turns hot.

import { getState, update } from '../store.js';
import {
  dateStr,
  deadlineAt,
  isDone,
  penaltyServed,
  questsFor,
  removeQuest,
  upcomingQuests,
} from '../quests.js';
import { CHECK_IN_XP, TENSION_CRITICAL_MS, TENSION_NEAR_MS, TENSION_SOON_MS } from '../config.js';
import { armyOf, canCheckIn, checkIn, completeQuest, levelInfo } from '../rewards.js';
import { enforcePenalty } from '../penalty.js';
import { openQuestSheet, questSummary } from './setup.js';

const $ = (id) => document.getElementById(id);
const FLAME_ICON =
  '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 6C58 28 82 40 82 66 82 85 67 98 50 98 33 98 18 85 18 66 18 51 27 42 33 31 36 42 40 47 45 47 42 32 44 18 50 6Z"/></svg>';

let app;
let clock = null;
let live = []; // the open quests on screen, so their countdowns can tick in place
let shown = { xp: null, coins: null }; // what the header last showed, to spot a change

// Marks a quest done and pays out its coins and XP. A tick only counts before
// the deadline: if a quest has just been missed, the app locks instead.
// Returns true when the quest was completed.
export function finishQuest(quest) {
  if (enforcePenalty()) {
    app.lock();
    return false;
  }
  const today = dateStr();
  let reward;
  let dayCleared = false;
  update((state) => {
    reward = completeQuest(state, quest, today);
    dayCleared = questsFor(state, today).every((q) => isDone(state, q.id, today));
  });
  if (!reward) return false;
  // Finishing the last quest of the day is its own, bigger moment.
  app.celebrate({ title: dayCleared ? 'All quests cleared' : 'Quest complete', sound: 'done', big: dayCleared, ...reward });
  return true;
}

// How close a deadline is, as a mood for the row.
function urgency(msLeft) {
  if (msLeft <= TENSION_CRITICAL_MS) return 'critical';
  if (msLeft <= TENSION_NEAR_MS) return 'near';
  if (msLeft <= TENSION_SOON_MS) return 'soon';
  return 'calm';
}

// "3h 12m left", "42m left", and inside the last ten minutes "9:41 left".
// Null once the deadline has passed.
function timeLeft(msLeft) {
  if (msLeft <= 0) return null;
  if (msLeft <= TENSION_NEAR_MS) {
    const seconds = Math.ceil(msLeft / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} left`;
  }
  const minutes = Math.ceil(msLeft / 60000);
  if (minutes < 60) return `${minutes}m left`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
}

// How much of the day is still left before the deadline, from 1 (midnight) to 0 (due).
function dayShare(deadline, now) {
  const midnight = new Date(deadline);
  midnight.setHours(0, 0, 0, 0);
  return Math.max(0, Math.min(1, (deadline - now) / (deadline - midnight)));
}

function questRow(quest, { today, now, upcoming }) {
  const done = !upcoming && isDone(getState(), quest.id, today);
  const deadline = deadlineAt(quest, today);
  const left = timeLeft(deadline - now);
  const open = !upcoming && !done && Boolean(left); // can still be worked on today

  const row = document.createElement('li');
  row.className = upcoming ? 'quest quest--upcoming' : 'quest quest--tickable';
  row.classList.toggle('is-done', done);

  const status = document.createElement('span');
  status.className = 'quest__status';
  if (upcoming) {
    status.hidden = true;
  } else if (done) {
    status.classList.add('quest__cleared');
    status.textContent = 'Cleared';
  } else if (left) {
    status.textContent = left;
  } else {
    status.classList.add('quest__late');
    status.textContent = penaltyServed(getState(), quest.id, today) ? 'Missed · penalty cleared' : 'Deadline passed';
  }
  const body = questSummary(quest, { date: today, extras: [status] });

  const side = document.createElement('div');
  side.className = 'quest__side';

  const remove = document.createElement('button');
  remove.className = 'icon-btn';
  remove.type = 'button';
  remove.textContent = '×';
  remove.setAttribute('aria-label', `Remove quest: ${quest.name}`);
  remove.addEventListener('click', async () => {
    const sure = await app.confirm(`Remove "${quest.name}"? It will stop appearing each day.`, 'Remove quest');
    if (!sure) return;
    update((state) => removeQuest(state, quest.id));
    render();
  });
  side.append(remove);

  if (upcoming) {
    row.append(body, side);
    return row;
  }

  if (open) {
    const focus = document.createElement('button');
    focus.className = 'quest__focus';
    focus.type = 'button';
    focus.innerHTML = `${FLAME_ICON}<span>Focus</span>`;
    focus.setAttribute('aria-label', `Focus on: ${quest.name}`);
    focus.addEventListener('click', () => app.go('focus', { questId: quest.id }));
    side.append(focus);
  }

  const tick = document.createElement('button');
  tick.className = 'quest__tick';
  tick.type = 'button';
  tick.disabled = !open;
  tick.setAttribute('aria-label', done ? `Done: ${quest.name}` : `Mark done: ${quest.name}`);
  tick.addEventListener('click', () => {
    if (finishQuest(quest)) render();
  });

  row.append(tick, body, side);

  if (open) {
    // A thin bar along the bottom that drains as the deadline approaches.
    const bar = document.createElement('span');
    bar.className = 'quest__timebar';
    const fill = document.createElement('span');
    bar.append(fill);
    row.append(bar);
    live.push({ deadline, row, status, fill });
    paintCountdown(live.at(-1), now);
  }
  return row;
}

// Updates one open quest's countdown, bar and mood without rebuilding its row.
function paintCountdown({ deadline, row, status, fill }, now) {
  const msLeft = deadline - now;
  status.textContent = timeLeft(msLeft) ?? '0:00 left';
  row.dataset.urgency = urgency(msLeft);
  fill.style.width = `${dayShare(deadline, now) * 100}%`;
}

// Runs every second while Today is open.
function tickCountdowns() {
  const now = new Date();
  // A deadline has just passed, or the day has changed: redraw everything.
  if (live.some((entry) => entry.deadline <= now) || $('today-quests').dataset.day !== dateStr(now)) {
    render();
    return;
  }
  for (const entry of live) paintCountdown(entry, now);
}

// Gives a number in the header a small kick when it changes.
function bump(el) {
  el.classList.remove('is-bumped');
  void el.offsetWidth;
  el.classList.add('is-bumped');
}

// Level, XP bar and coins at the top of Today.
function renderHud(state, today) {
  const { level, into, needed } = levelInfo(state.xp);
  $('hud-level').textContent = level;
  $('hud-xp').textContent = `${into} / ${needed}`;
  $('hud-bar-fill').style.width = `${(into / needed) * 100}%`;
  $('hud-bar').setAttribute('aria-valuenow', into);
  $('hud-bar').setAttribute('aria-valuemax', needed);
  $('hud-coins').textContent = state.coins.toLocaleString();

  if (shown.xp !== null && shown.xp !== state.xp) bump($('hud-xp'));
  if (shown.coins !== null && shown.coins !== state.coins) bump($('hud-coins'));
  shown = { xp: state.xp, coins: state.coins };

  const available = canCheckIn(state, today);
  $('today-checkin').disabled = !available;
  $('today-checkin-note').textContent = available ? `+${CHECK_IN_XP} XP` : 'Done today';

  const soldiers = armyOf(state).soldiers.length;
  $('today-army-note').textContent = soldiers === 0 ? 'Your fire' : soldiers === 1 ? '1 soldier' : `${soldiers} soldiers`;
}

function render() {
  const state = getState();
  const now = new Date();
  const today = dateStr(now);
  const quests = questsFor(state, today);
  const upcoming = upcomingQuests(state, today);

  $('today-date').textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  $('today-goal').textContent = state.goal?.name ?? '';
  renderHud(state, today);

  live = [];
  $('today-quests').dataset.day = today;
  $('today-quests').replaceChildren(...quests.map((q) => questRow(q, { today, now })));
  $('today-empty').hidden = quests.length > 0;
  $('today-clear').hidden = quests.length === 0 || !quests.every((q) => isDone(state, q.id, today));

  $('today-upcoming').replaceChildren(...upcoming.map((q) => questRow(q, { today, now, upcoming: true })));
  $('today-upcoming-wrap').hidden = upcoming.length === 0;
}

export function initToday(theApp) {
  app = theApp;

  app.register('today', {
    enter() {
      render();
      clock = setInterval(tickCountdowns, 1000);
    },
    leave() {
      clearInterval(clock);
    },
  });

  $('today-add-quest').addEventListener('click', () => openQuestSheet(render));
  $('today-settings').addEventListener('click', () => app.go('settings'));
  $('today-shop').addEventListener('click', () => app.go('shop'));
  $('today-battleground').addEventListener('click', () => app.go('battleground'));
  $('today-checkin').addEventListener('click', () => {
    let reward;
    update((state) => {
      reward = checkIn(state, dateStr());
    });
    if (reward) app.celebrate({ title: 'Checked in', sound: 'checkIn', ...reward });
    render();
  });
}
