// Starts the app and decides which screen is showing.

import { getState } from './store.js';
import { play, unlockAudio } from './audio.js';
import { enforcePenalty, initPenalty, startWatching } from './penalty.js';
import { initSetup } from './screens/setup.js';
import { initToday } from './screens/today.js';
import { initFocus } from './screens/focus.js';
import { initSettings } from './screens/settings.js';

const screens = {}; // name -> { enter, leave }
let current = 'gate';

function register(name, handlers) {
  screens[name] = handlers;
}

// Show exactly one screen at a time. While a penalty is waiting, that one screen
// is always the Penalty Zone, whatever was asked for.
function go(name, details = {}) {
  if (enforcePenalty()) name = 'penalty';
  screens[current]?.leave?.();
  current = name;
  for (const el of document.querySelectorAll('.screen')) {
    el.classList.toggle('is-active', el.dataset.screen === name);
  }
  window.scrollTo(0, 0);
  screens[name]?.enter?.(details);
}

// Called when a deadline passes while the app is open: drop everything and lock.
function lock() {
  if (current === 'penalty' || current === 'gate') return;
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
  go('penalty');
}

// ---------- System message window ----------

const noticeEl = document.getElementById('notice');
const noticeTitle = document.getElementById('notice-title');
const noticeText = document.getElementById('notice-text');
const noticeYes = document.getElementById('notice-yes');
const noticeNo = document.getElementById('notice-no');

// Shows a message and resolves with true (OK / Yes) or false (No / dismissed).
function showNotice({ text, title = 'Notification', yes = 'OK', no = null }) {
  return new Promise((resolve) => {
    noticeTitle.textContent = title;
    noticeText.textContent = text;
    noticeYes.textContent = yes;
    noticeNo.textContent = no ?? '';
    noticeNo.hidden = !no;

    const finish = (answer) => {
      noticeEl.removeEventListener('close', dismissed);
      if (noticeEl.open) noticeEl.close();
      resolve(answer);
    };
    // Closed some other way: the Escape key, or the app locking underneath it.
    const dismissed = () => finish(false);
    noticeEl.addEventListener('close', dismissed);
    noticeYes.onclick = () => finish(true);
    noticeNo.onclick = () => finish(false);
    noticeEl.showModal();
  });
}

// ---------- Reward pop-up ----------

const rewardEl = document.getElementById('reward');
let rewardTimer = null;

// Shows what was just earned, with sound, over whatever screen is showing.
function celebrate({ title, sound, xp, coins, levelsGained, level }) {
  document.getElementById('reward-title').textContent = title;
  document.getElementById('reward-xp').textContent = `+${xp} XP`;
  document.getElementById('reward-coins').hidden = !coins;
  document.getElementById('reward-coins-num').textContent = `+${coins}`;
  document.getElementById('reward-level').hidden = !levelsGained;
  document.getElementById('reward-level').textContent = `Level up! You are now level ${level}`;

  // Hiding and re-showing restarts the pop-in animation if one is already on screen.
  rewardEl.hidden = true;
  void rewardEl.offsetWidth;
  rewardEl.hidden = false;
  clearTimeout(rewardTimer);
  rewardTimer = setTimeout(() => {
    rewardEl.hidden = true;
  }, levelsGained ? 3400 : 1900);

  play(sound);
  if (coins) play('coins');
  if (levelsGained) play('levelUp');
}

// What each screen is handed so it can move around and talk to the user.
const app = {
  go,
  lock,
  register,
  celebrate,
  notify: (text, title) => showNotice({ text, title }),
  confirm: (text, title) => showNotice({ text, title, yes: 'Yes', no: 'No' }),
};

initSetup(app);
initToday(app);
initFocus(app);
initSettings(app);
initPenalty(app);

// Offline support and "Add to Home Screen" both need the service worker (sw.js).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// The first tap: it lets the phone play sound, then the app opens.
document.getElementById('gate').addEventListener('click', () => {
  unlockAudio();
  go(getState().profile.setupDone ? 'today' : 'setup');
  if (current !== 'penalty') play('begin');
  startWatching();
});
