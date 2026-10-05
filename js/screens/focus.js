// Focus: a true-black screen with only the quest name and the bonfire.

import { getState } from '../store.js';
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
      putOutFire = lightFire($('focus-fire'));
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
