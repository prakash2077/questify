// Focus: a true-black screen with only the quest name and the bonfire.

import { getState } from '../store.js';
import { TENSION_NEAR_MS } from '../config.js';
import { dateStr, deadlineAt } from '../quests.js';
import { lightFire } from '../fire.js';
import { startFireSound, stopFireSound } from '../audio.js';
import { finishQuest } from './today.js';

const $ = (id) => document.getElementById(id);

let app;
let quest = null;
let putOutFire = null;

export function initFocus(theApp) {
  app = theApp;

  app.register('focus', {
    enter({ questId }) {
      quest = getState().quests.find((q) => q.id === questId);
      $('focus-quest').textContent = quest.name;
      // In the last ten minutes before the deadline the fire burns harder and harder.
      const deadline = deadlineAt(quest, dateStr());
      putOutFire = lightFire($('focus-fire'), () => Math.max(0, Math.min(1, 1 - (deadline - new Date()) / TENSION_NEAR_MS)));
      startFireSound();
    },
    leave() {
      putOutFire();
      stopFireSound();
    },
  });

  $('focus-back').addEventListener('click', () => app.go('today'));
  $('focus-done').addEventListener('click', () => {
    if (finishQuest(quest)) app.go('today');
  });
}
