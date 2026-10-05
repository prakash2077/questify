// The Penalty Zone: watches deadlines, locks the app when one is missed, and
// unlocks it again once the penalty is cleared with a photo (or the fallback).

import { getState, savePhoto, update } from './store.js';
import { FALLBACK_HOLD_MS, FALLBACK_PHRASE, PENALTY_CHECK_MS, TENSION_CRITICAL_MS, TENSION_NEAR_MS } from './config.js';
import { dateStr, deadlineAt, findMissed, newId, nextDeadline } from './quests.js';
import { drawWeeksGrid, weeksLeft, weeksLived } from './weeks-grid.js';
import { buzz, play } from './audio.js';
import { QUOTES } from '../data/quotes.js';

const $ = (id) => document.getElementById(id);

let app;
let exactTimer = null;

// ---------- Watching deadlines ----------

// Looks for a missed quest and saves it as state.penalty, which is what keeps the
// app locked across reloads. Returns true while a penalty is waiting to be cleared.
export function enforcePenalty() {
  const state = getState();
  if (!state.profile.setupDone) return false;

  // A penalty for a quest that no longer exists cannot be cleared, so drop it.
  if (state.penalty && !state.quests.some((q) => q.id === state.penalty.questId)) {
    update((s) => {
      s.penalty = null;
    });
  }
  if (!state.penalty) {
    const [missed] = findMissed(state);
    if (missed) {
      update((s) => {
        s.penalty = missed;
      });
    }
  }

  wakeAtNextDeadline();
  return Boolean(state.penalty);
}

function lockIfMissed() {
  if (enforcePenalty()) app.lock();
}

// The regular check runs every 15 seconds. This extra timer fires right as the
// next deadline passes, so the lock does not lag behind the clock.
function wakeAtNextDeadline() {
  clearTimeout(exactTimer);
  const next = nextDeadline(getState());
  if (next) exactTimer = setTimeout(lockIfMissed, next - new Date() + 50);
}

// Once a second: how close is the next deadline? In the last ten minutes the
// edges of the screen glow red on every screen, and in the last minute a clock
// ticks, faster for the final ten seconds.
function feelTension() {
  const msLeft = showTension();
  if (msLeft <= TENSION_CRITICAL_MS) play(msLeft <= 10 * 1000 ? 'tickFast' : 'tick');
}

// Sets the mood the whole app can see (body[data-tension]) and returns the time left.
function showTension() {
  const state = getState();
  const next = state.profile.setupDone && !state.penalty ? nextDeadline(state) : null;
  const msLeft = next ? next - new Date() : Infinity;
  const tension = msLeft <= TENSION_CRITICAL_MS ? 'critical' : msLeft <= TENSION_NEAR_MS ? 'near' : 'none';
  if (document.body.dataset.tension !== tension) document.body.dataset.tension = tension;
  return msLeft;
}

export function startWatching() {
  setInterval(lockIfMissed, PENALTY_CHECK_MS);
  setInterval(feelTension, 1000);
  // Phones pause timers while the app is in the background, so check on return.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lockIfMissed();
  });
}

// ---------- The red screen ----------

function render() {
  const state = getState();
  const { penalty, profile } = state;
  const quest = state.quests.find((q) => q.id === penalty.questId);
  const due = deadlineAt(quest, penalty.date);
  const sameDay = penalty.date === dateStr();

  $('penalty-quest').textContent = quest.name;
  $('penalty-when').textContent = `Was due ${sameDay ? 'today' : due.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })} at ${due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  $('penalty-task').textContent = quest.penalty;
  $('penalty-goal').textContent = state.goal?.name ?? '';

  drawWeeksGrid($('penalty-weeks'), profile);
  $('penalty-weeks-caption').textContent =
    `Each dot is one week. ${weeksLived(profile.dob).toLocaleString()} lived, ${weeksLeft(profile).toLocaleString()} still ahead. This one is still yours.`;

  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  $('penalty-quote').textContent = quote.text;
  $('penalty-quote-author').textContent = quote.author;

  resetFallback();
  $('penalty-fallback').hidden = true;
  $('penalty-photo').value = '';
}

// Records the proof, clears the penalty, and either shows the next one or unlocks.
async function clearPenalty(photo) {
  const state = getState();
  const { penalty } = state;
  const quest = state.quests.find((q) => q.id === penalty.questId);
  const id = newId();

  let hasPhoto = false;
  if (photo) {
    try {
      await savePhoto(id, photo);
      hasPhoto = true;
    } catch {
      // The photo could not be stored on this device; the penalty still counts as cleared.
    }
  }

  update((s) => {
    s.proofs.push({
      id,
      date: penalty.date,
      questId: penalty.questId,
      questName: quest.name,
      penalty: quest.penalty,
      clearedOn: dateStr(),
      hasPhoto,
    });
    s.penalty = null;
  });
  play('cleared');

  if (enforcePenalty()) {
    await app.notify('Penalty cleared. One more quest was missed, so one more to go.', 'Cleared');
    render();
    window.scrollTo(0, 0);
    return;
  }
  await app.notify('Penalty cleared. Welcome back, Player.', 'Unlocked');
  app.go('today');
}

// ---------- No-camera fallback: type the phrase, then hold for 5 seconds ----------

let holdTimer = null;

function phraseTyped() {
  return $('penalty-fallback-text').value.trim().toLowerCase() === FALLBACK_PHRASE.toLowerCase();
}

function stopHold() {
  clearTimeout(holdTimer);
  holdTimer = null;
  $('penalty-fallback-hold').classList.remove('is-holding');
}

function resetFallback() {
  stopHold();
  $('penalty-fallback-text').value = '';
  $('penalty-fallback-hold').disabled = true;
}

function startHold() {
  if (!phraseTyped() || holdTimer) return;
  $('penalty-fallback-hold').classList.add('is-holding');
  holdTimer = setTimeout(() => {
    stopHold();
    clearPenalty(null);
  }, FALLBACK_HOLD_MS);
}

// ---------- Wiring ----------

export function initPenalty(theApp) {
  app = theApp;

  app.register('penalty', {
    enter() {
      render();
      showTension(); // the waiting is over: stop the red pulse and the ticking at once
      play('penalty');
      app.shake(true);
      buzz([200, 90, 200, 90, 320]);
    },
  });

  $('penalty-photo').addEventListener('change', (event) => {
    const [photo] = event.target.files;
    if (photo) clearPenalty(photo);
  });

  $('penalty-no-camera').addEventListener('click', () => {
    $('penalty-fallback').hidden = false;
    $('penalty-fallback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  $('penalty-fallback-text').addEventListener('input', () => {
    $('penalty-fallback-hold').disabled = !phraseTyped();
  });

  const hold = $('penalty-fallback-hold');
  hold.style.setProperty('--hold-ms', `${FALLBACK_HOLD_MS}ms`);
  hold.addEventListener('pointerdown', startHold);
  for (const type of ['pointerup', 'pointerleave', 'pointercancel']) hold.addEventListener(type, stopHold);
  hold.addEventListener('contextmenu', (event) => event.preventDefault());
}
