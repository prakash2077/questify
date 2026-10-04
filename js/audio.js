// Sound effects made in code with the Web Audio API, so there are no audio files.
// Phones only allow sound after a tap, so nothing plays until unlockAudio() has run.

import { getState } from './store.js';

let ctx = null;

// Call from a tap. Creates the sound engine, or wakes it if the phone paused it.
export function unlockAudio() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
}

// One note: a wave that can slide in pitch and fades out.
function tone({ type = 'sine', from, to = from, at = 0, dur, vol = 0.2 }) {
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + dur);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

const sounds = {
  // The System waking up: two quick rising notes.
  begin() {
    tone({ type: 'triangle', from: 440, to: 660, dur: 0.14, vol: 0.18 });
    tone({ type: 'sine', from: 880, dur: 0.4, at: 0.1, vol: 0.14 });
  },
  // Penalty Zone: two heavy falling hits with an uneasy hum on top.
  penalty() {
    for (const at of [0, 0.5]) {
      tone({ type: 'sawtooth', from: 130, to: 58, dur: 0.45, at, vol: 0.22 });
      tone({ type: 'sine', from: 65, to: 40, dur: 0.6, at, vol: 0.3 });
    }
    tone({ type: 'sine', from: 233, dur: 1.2, at: 0.05, vol: 0.05 });
    tone({ type: 'sine', from: 220, dur: 1.2, at: 0.05, vol: 0.05 });
  },
  // Penalty cleared: a small bright chord climbing home.
  cleared() {
    [523, 659, 784, 1047].forEach((from, i) => {
      tone({ type: 'triangle', from, dur: 0.5, at: i * 0.09, vol: 0.14 });
    });
  },
};

export function play(name) {
  if (!ctx || getState().settings.muted) return;
  sounds[name]();
}
