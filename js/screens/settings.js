// Settings: the Proof Gallery and the Demo tools.

import { getState, resetAll, update } from '../store.js';
import { DEMO_COINS } from '../config.js';
import { dateStr, deadlineAt, isDone, questsFor, upcomingQuests } from '../quests.js';
import { initGallery, releaseGallery, renderGallery } from './gallery.js';

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');

let app;

// Demo tool: moves today's deadline for the next unfinished quest to one minute
// from now, so the Penalty Zone can be shown without waiting all day. Only today
// is changed; the quest keeps its real deadline on every other day.
function dueInOneMinute() {
  const state = getState();
  const now = new Date();
  const today = dateStr(now);
  const next =
    questsFor(state, today).find((q) => !isDone(state, q.id, today) && deadlineAt(q, today) > now) ??
    upcomingQuests(state, today)[0];

  if (!next) {
    app.notify('Every quest for today is already finished or missed. Add a new quest, or reset all data, to see the Penalty Zone again.', 'Demo tools');
    return;
  }

  const due = new Date(now.getTime() + 60 * 1000);
  const time = dateStr(due) === today ? `${pad(due.getHours())}:${pad(due.getMinutes())}:${pad(due.getSeconds())}` : '23:59:59';
  update((s) => {
    const quest = s.quests.find((q) => q.id === next.id);
    quest.demo = { date: today, time };
    if (quest.startsOn > today) quest.startsOn = today;
  });
  app.go('today');
}

async function resetEverything() {
  const sure = await app.confirm('Erase your goal, quests, progress and penalty photos from this device? This cannot be undone.', 'Reset all data');
  if (sure) resetAll();
}

export function initSettings(theApp) {
  app = theApp;
  initGallery();

  app.register('settings', {
    enter: renderGallery,
    leave: releaseGallery,
  });

  $('settings-back').addEventListener('click', () => app.go('today'));
  $('demo-due-soon').addEventListener('click', dueInOneMinute);
  $('demo-coins').addEventListener('click', () => {
    update((state) => {
      state.coins += DEMO_COINS;
    });
    app.notify(`${DEMO_COINS} test coins added. You now have ${getState().coins}.`, 'Demo tools');
  });
  $('demo-reset').addEventListener('click', resetEverything);
}
