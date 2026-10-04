// Today: home. Lists today's quests by priority, each with its deadline and a done tick.

import { getState, update } from '../store.js';
import {
  dateStr,
  deadlineAt,
  isDone,
  markDone,
  penaltyServed,
  questsFor,
  removeQuest,
  upcomingQuests,
} from '../quests.js';
import { enforcePenalty } from '../penalty.js';
import { openQuestSheet, questSummary } from './setup.js';

const $ = (id) => document.getElementById(id);
const REFRESH_MS = 30 * 1000; // keeps "time left" current while Today is open

let app;
let refreshTimer = null;

// "3h 12m left", "12m left", or null once the deadline has passed.
function timeLeft(deadline, now) {
  const minutes = Math.ceil((deadline - now) / 60000);
  if (minutes <= 0) return null;
  if (minutes < 60) return `${minutes}m left`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
}

function questRow(quest, { today, now, upcoming }) {
  const done = !upcoming && isDone(getState(), quest.id, today);

  const row = document.createElement('li');
  row.className = upcoming ? 'quest quest--upcoming' : 'quest quest--tickable';
  row.classList.toggle('is-done', done);

  const status = document.createElement('span');
  status.className = 'quest__status';
  const left = timeLeft(deadlineAt(quest, today), now);
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

  if (upcoming) {
    row.append(body, remove);
    return row;
  }

  const tick = document.createElement('button');
  tick.className = 'quest__tick';
  tick.type = 'button';
  tick.disabled = done || !left;
  tick.setAttribute('aria-label', done ? `Done: ${quest.name}` : `Mark done: ${quest.name}`);
  tick.addEventListener('click', () => {
    // A tick only counts before the deadline. If it has just passed, lock instead.
    if (enforcePenalty()) {
      app.lock();
      return;
    }
    update((state) => markDone(state, quest.id, today));
    render();
  });

  row.append(tick, body, remove);
  return row;
}

function render() {
  const state = getState();
  const now = new Date();
  const today = dateStr(now);
  const quests = questsFor(state, today);
  const upcoming = upcomingQuests(state, today);

  $('today-date').textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  $('today-goal').textContent = state.goal?.name ?? '';

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
      refreshTimer = setInterval(render, REFRESH_MS);
    },
    leave() {
      clearInterval(refreshTimer);
    },
  });

  $('today-add-quest').addEventListener('click', () => openQuestSheet(render));
  $('today-settings').addEventListener('click', () => app.go('settings'));
}
