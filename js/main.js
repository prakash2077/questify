// Starts the app and decides which screen is showing.

import { getState } from './store.js';
import { buzz, play, unlockAudio } from './audio.js';
import { enforcePenalty, initPenalty, startWatching } from './penalty.js';
import { initSetup } from './screens/setup.js';
import { initToday } from './screens/today.js';
import { initFocus } from './screens/focus.js';
import { initShop } from './screens/shop.js';
import { initBattleground } from './battleground.js';
import { applyAccent, initSettings } from './screens/settings.js';
import { initIntro } from './intro.js';
import { armyOf } from './rewards.js';
import { loadSprites } from './sprites.js';
import { CATALOG, DEMON_SPRITES } from '../data/catalog.js';

const screens = {}; // name -> { enter, leave }
let current = 'gate';

function register(name, handlers) {
  screens[name] = handlers;
}

// The order screens come in. Going to a later one slides in from the right,
// going back to an earlier one slides in from the left.
const ORDER = ['gate', 'intro', 'demo', 'setup', 'today', 'shop', 'battleground', 'settings', 'focus', 'penalty'];
// The four screens that live on the tab bar.
const TABS = ['today', 'shop', 'battleground', 'settings'];
const tabbar = document.getElementById('tabbar');

// Show exactly one screen at a time. While a penalty is waiting, that one screen
// is always the Penalty Zone, whatever was asked for.
function go(name, details = {}) {
  if (enforcePenalty()) name = 'penalty';
  const from = current;
  screens[current]?.leave?.();
  current = name;
  for (const el of document.querySelectorAll('.screen')) {
    el.classList.toggle('is-active', el.dataset.screen === name);
    if (el.dataset.screen === name) {
      el.dataset.enter = name === 'penalty' || from === 'gate' ? 'fade' : ORDER.indexOf(name) > ORDER.indexOf(from) ? 'forward' : 'back';
    }
  }
  showTabs();
  window.scrollTo(0, 0);
  // A breath of air between the app's own screens; the big entrances have their own sound.
  if (from !== name && ORDER.indexOf(from) > 1 && name !== 'penalty') play('nav');
  screens[name]?.enter?.(details);
}

// Shows the tab bar on the four main screens, with the current one lit.
function showTabs() {
  tabbar.hidden = !TABS.includes(current);
  for (const tab of tabbar.querySelectorAll('.tab')) {
    if (tab.dataset.go === current) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  const soldiers = armyOf(getState()).soldiers.length;
  const badge = document.getElementById('tab-army-count');
  badge.hidden = soldiers === 0;
  badge.textContent = soldiers;
}

for (const tab of tabbar.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => {
    if (tab.dataset.go !== current) go(tab.dataset.go);
  });
}

// Every button in the app answers a touch with a soft click and a tiny vibration.
document.addEventListener(
  'pointerdown',
  (event) => {
    if (event.target.closest?.('button, label.btn, .segmented label, .chip')) {
      play('tap');
      buzz(8);
    }
  },
  { passive: true },
);

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
// `sound` is what it opens with: 'open' for news, 'deny' for a refusal.
function showNotice({ text, title = 'Notification', yes = 'OK', no = null, sound = 'open' }) {
  play(sound);
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

// ---------- Big moments: shake, sparks, the reward sequence ----------

const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const appEl = document.getElementById('app');

// Jolts the whole screen. `hard` is for the moments that should really land.
function shake(hard = false) {
  if (calm()) return;
  const name = hard ? 'is-quaking' : 'is-shaking';
  appEl.classList.remove('is-shaking', 'is-quaking');
  void appEl.offsetWidth; // lets the same shake start again from the beginning
  appEl.classList.add(name);
  appEl.addEventListener('animationend', () => appEl.classList.remove(name), { once: true });
}

// A burst of sparks flying out from a point and falling away.
function sparks(canvas, { x, y, count, colours }) {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.clientWidth * scale;
  canvas.height = canvas.clientHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  if (calm()) return;

  const bits = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 420;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 120,
      size: 1 + Math.random() * 2.4,
      life: 0.6 + Math.random() * 0.8,
      colour: colours[Math.floor(Math.random() * colours.length)],
    };
  });
  let last = null;
  let age = 0;
  function frame(now) {
    const dt = Math.min((now - (last ?? now)) / 1000, 0.05);
    last = now;
    age += dt;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.globalCompositeOperation = 'lighter';
    let alive = false;
    for (const bit of bits) {
      if (age > bit.life) continue;
      alive = true;
      bit.vy += 620 * dt; // gravity
      bit.vx *= 1 - 1.6 * dt; // air slowing it down
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      ctx.globalAlpha = 1 - age / bit.life;
      ctx.fillStyle = bit.colour;
      ctx.beginPath();
      ctx.arc(bit.x, bit.y, bit.size, 0, Math.PI * 2);
      ctx.fill();
    }
    if (alive) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const rewardEl = document.getElementById('reward');
let rewardTimer = null;

// Shows what was just earned over whatever screen is showing: a flash, a
// shockwave, sparks, a jolt and a sound. `big` is for a level-up or a finished day.
function celebrate({ title, sound, xp, coins, levelsGained, level, big = false, note = '' }) {
  const grand = big || levelsGained > 0;
  document.getElementById('reward-title').textContent = title;
  document.getElementById('reward-xp').textContent = `+${xp} XP`;
  document.getElementById('reward-coins').hidden = !coins;
  document.getElementById('reward-coins-num').textContent = `+${coins}`;
  document.getElementById('reward-level').hidden = !levelsGained;
  document.getElementById('reward-level').textContent = `Level up! You are now level ${level}`;
  document.getElementById('reward-note').hidden = !note;
  document.getElementById('reward-note').textContent = note;
  rewardEl.classList.toggle('is-big', grand);

  // Hiding and re-showing restarts the animations if a reward is already on screen.
  rewardEl.hidden = true;
  void rewardEl.offsetWidth;
  rewardEl.hidden = false;
  clearTimeout(rewardTimer);
  rewardTimer = setTimeout(() => {
    rewardEl.hidden = true;
  }, grand ? 3800 : 2000);

  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  sparks(document.getElementById('reward-sparks'), {
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.36,
    count: grand ? 110 : 46,
    colours: grand ? ['#ffc94d', '#fff3c4', accent, '#ffffff'] : [accent, '#ffffff', '#ffc94d'],
  });
  shake(grand);
  buzz(grand ? [40, 60, 40, 60, 140] : [18, 30, 36]);

  play(sound);
  if (coins) play('coins');
  if (levelsGained) play('levelUp');
  else if (big) play('allClear');
}

// ---------- A soldier rises ----------

const ariseEl = document.getElementById('arise');

// Plays the summoning: the soldier climbs out of a pool of shadow under the
// word ARISE. Resolves when it is over.
function arise({ sprite, name }) {
  if (calm()) return Promise.resolve();
  document.getElementById('arise-art').src = sprite;
  document.getElementById('arise-name').textContent = name;
  ariseEl.hidden = false;
  shake();
  buzz([30, 50, 30, 50, 120]);
  return new Promise((resolve) => {
    setTimeout(() => {
      ariseEl.hidden = true;
      resolve();
    }, 2600);
  });
}

// What each screen is handed so it can move around and talk to the user.
const app = {
  go,
  lock,
  register,
  celebrate,
  arise,
  shake,
  notify: (text, title) => showNotice({ text, title }),
  // Like notify, for when something is refused: it opens with a low buzz.
  deny: (text, title) => showNotice({ text, title, sound: 'deny' }),
  // Opens one of the bottom sheets.
  openSheet(sheet) {
    play('open');
    sheet.showModal();
  },
  confirm: (text, title, { yes = 'Yes', no = 'No' } = {}) => showNotice({ text, title, yes, no }),
};

initIntro(app);
initSetup(app);
initToday(app);
initFocus(app);
initShop(app);
initBattleground(app);
initSettings(app);
initPenalty(app);

// Offline support and "Add to Home Screen" both need the service worker (sw.js).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

applyAccent(getState().settings.accent);

// The first tap: it lets the phone play sound, then the app opens.
document.getElementById('gate').addEventListener('click', () => {
  unlockAudio();
  startWatching();
  // Fetch every drawing now, so the Shop and the Battleground open without a wait.
  loadSprites([...CATALOG.map((item) => item.sprite), ...DEMON_SPRITES]).catch(() => {});

  // A brand-new player gets the Level 0 demo; everyone else goes home to Today.
  const next = getState().profile.setupDone ? 'today' : 'demo';
  if (enforcePenalty()) {
    go('penalty');
  } else if (calm()) {
    // Someone who has asked their device for less motion skips the intro.
    go(next);
    play('begin');
  } else {
    // The full intro is for a first visit. After that the app opens with a quick flash of it.
    go('intro', { next, quick: next === 'today' });
  }
});
