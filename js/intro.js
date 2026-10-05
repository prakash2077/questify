// The opening: a short animated intro with sound, and for a brand-new player the
// Level 0 demo, a few cards that explain the app using sample data.
// Nothing in the demo is ever saved: this file never touches the app's memory.

import { INTRO_MS, INTRO_QUICK_MS } from './config.js';
import { play } from './audio.js';
import { lightFire } from './fire.js';

const $ = (id) => document.getElementById(id);

let app;

// ---------- Intro ----------

let introTimer = null;
let afterIntro = null;

function endIntro() {
  if (!afterIntro) return;
  const next = afterIntro;
  afterIntro = null;
  clearTimeout(introTimer);
  app.go(next);
}

// ---------- Level 0 demo ----------

const FIRE_CARD = 2;
let card = 1;
let putOutFire = null;

function cards() {
  return [...document.querySelectorAll('.demo-card')];
}

function showCard(number) {
  const all = cards();
  card = Math.min(Math.max(number, 1), all.length);
  for (const el of all) el.hidden = Number(el.dataset.card) !== card;

  $('demo-step').textContent = `${card} of ${all.length}`;
  $('demo-prev').hidden = card === 1;
  $('demo-next').textContent = card === all.length ? 'Begin setup' : 'Next';

  // The sample fire only burns while its card is showing.
  putOutFire?.();
  putOutFire = card === FIRE_CARD ? lightFire($('demo-fire')) : null;
  window.scrollTo(0, 0);
}

// ---------- Wiring ----------

export function initIntro(theApp) {
  app = theApp;

  app.register('intro', {
    // `next` is the screen to open once the intro has played.
    // `quick` plays the short version: the emblem, a bell, and straight in.
    enter({ next, quick = false }) {
      afterIntro = next;
      $('intro').classList.toggle('is-quick', quick);
      play(quick ? 'begin' : 'intro');
      introTimer = setTimeout(endIntro, quick ? INTRO_QUICK_MS : INTRO_MS);
    },
    leave() {
      clearTimeout(introTimer);
      afterIntro = null;
    },
  });
  // A tap skips the rest of the intro.
  $('intro').addEventListener('click', endIntro);

  app.register('demo', {
    enter() {
      showCard(1);
    },
    leave() {
      putOutFire?.();
      putOutFire = null;
    },
  });
  $('demo-skip').addEventListener('click', () => app.go('setup'));
  $('demo-prev').addEventListener('click', () => showCard(card - 1));
  $('demo-next').addEventListener('click', () => {
    if (card === cards().length) app.go('setup');
    else showCard(card + 1);
  });
}
