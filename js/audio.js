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
  // The intro: a rush out of the dark, an impact, then a bright chord left ringing.
  intro() {
    tone({ type: 'sawtooth', from: 48, to: 190, dur: 0.75, vol: 0.12 });
    tone({ type: 'sine', from: 180, to: 720, dur: 0.75, vol: 0.07 });
    tone({ type: 'sine', from: 120, to: 38, dur: 0.7, at: 0.72, vol: 0.4 });
    for (const from of [523, 784, 1047, 1568]) tone({ type: 'triangle', from, dur: 1.5, at: 0.74, vol: 0.09 });
    [2093, 2637, 3136].forEach((from, i) => {
      tone({ type: 'sine', from, dur: 0.5, at: 1.25 + i * 0.09, vol: 0.05 });
    });
  },
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
  // Quest ticked off: a bright "ding" with a shimmer above it.
  done() {
    tone({ type: 'triangle', from: 784, dur: 0.18, vol: 0.2 });
    tone({ type: 'sine', from: 1175, dur: 0.5, at: 0.09, vol: 0.18 });
    tone({ type: 'sine', from: 2350, dur: 0.35, at: 0.09, vol: 0.05 });
  },
  // Coins landing: three quick high pings, just after the ding.
  coins() {
    [1568, 1976, 2637].forEach((from, i) => {
      tone({ type: 'square', from, dur: 0.09, at: 0.3 + i * 0.07, vol: 0.05 });
    });
  },
  // Level up: a deep thump, a rising run, then a held chord.
  levelUp() {
    tone({ type: 'sine', from: 98, to: 49, dur: 0.5, at: 0.6, vol: 0.3 });
    [523, 659, 784, 1047].forEach((from, i) => {
      tone({ type: 'triangle', from, dur: 0.22, at: 0.6 + i * 0.1, vol: 0.18 });
    });
    for (const from of [1047, 1319, 1568]) tone({ type: 'sine', from, dur: 1.2, at: 1, vol: 0.09 });
  },
  // Buying in the Shop: coins paid out, then a shadow rising.
  purchase() {
    [2093, 1568, 1319].forEach((from, i) => {
      tone({ type: 'square', from, dur: 0.08, at: i * 0.06, vol: 0.05 });
    });
    tone({ type: 'sawtooth', from: 82, to: 330, dur: 0.6, at: 0.22, vol: 0.1 });
    tone({ type: 'triangle', from: 220, to: 880, dur: 0.6, at: 0.22, vol: 0.14 });
    tone({ type: 'sine', from: 1319, dur: 0.7, at: 0.75, vol: 0.12 });
  },
  // Daily check-in: one soft rising note.
  checkIn() {
    tone({ type: 'sine', from: 660, to: 880, dur: 0.18, vol: 0.14 });
  },
};

export function play(name) {
  if (!ctx || getState().settings.muted) return;
  sounds[name]();
}

// ---------- The crackling fire ----------
// A fire is mostly noise: a low steady roar, with short sharp pops on top.

let noiseData = null;

// Two seconds of random static, the raw material for both the roar and the pops.
function noise() {
  if (!noiseData) {
    noiseData = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const samples = noiseData.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = noiseData;
  source.loop = true;
  return source;
}

function crackle() {
  const now = ctx.currentTime;
  const source = noise();
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1500 + Math.random() * 3000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.02 + Math.random() * 0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03 + Math.random() * 0.05);
  source.connect(band).connect(gain).connect(ctx.destination);
  source.start(now, Math.random() * 1.5);
  source.stop(now + 0.1);
}

let fireSound = null;

export function startFireSound() {
  if (!ctx || fireSound || getState().settings.muted) return;
  const roar = noise();
  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 420;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 1.2);
  roar.connect(low).connect(gain).connect(ctx.destination);
  roar.start();
  const pops = setInterval(() => {
    if (Math.random() < 0.55) crackle();
  }, 130);
  fireSound = { roar, gain, pops };
}

export function stopFireSound() {
  if (!fireSound) return;
  const { roar, gain, pops } = fireSound;
  fireSound = null;
  clearInterval(pops);
  gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
  roar.stop(ctx.currentTime + 0.5);
}

// ---------- The army's presence on the Battleground ----------
// One layer of sound per few soldiers, so a bigger army sounds bigger:
// a low hum, then a note above it, then a high shimmer, then war drums.

const ARMY_LAYERS = [
  { type: 'sine', freq: 55, vol: 0.16, wobble: 0.13 },
  { type: 'triangle', freq: 82.4, vol: 0.07, wobble: 0.21 },
  { type: 'sine', freq: 220, vol: 0.03, wobble: 0.34 },
];

let armySound = null;

export function startArmySound(layers) {
  if (!ctx || armySound || layers < 1 || getState().settings.muted) return;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1, now + 2);
  master.connect(ctx.destination);

  const voices = [];
  for (const layer of ARMY_LAYERS.slice(0, layers)) {
    const voice = ctx.createOscillator();
    voice.type = layer.type;
    voice.frequency.value = layer.freq;
    const level = ctx.createGain();
    level.gain.value = layer.vol;
    // A slow wobble in loudness keeps the hum alive instead of flat.
    const wobble = ctx.createOscillator();
    wobble.frequency.value = layer.wobble;
    const depth = ctx.createGain();
    depth.gain.value = layer.vol * 0.5;
    wobble.connect(depth).connect(level.gain);
    voice.connect(level).connect(master);
    voice.start();
    wobble.start();
    voices.push(voice, wobble);
  }

  // The fourth layer: a slow double drum beat.
  let drums = null;
  if (layers > ARMY_LAYERS.length) {
    const beat = () => {
      tone({ type: 'sine', from: 90, to: 42, dur: 0.35, vol: 0.28 });
      tone({ type: 'sine', from: 90, to: 42, dur: 0.35, at: 0.28, vol: 0.2 });
    };
    beat();
    drums = setInterval(beat, 2400);
  }
  armySound = { master, voices, drums };
}

export function stopArmySound() {
  if (!armySound) return;
  const { master, voices, drums } = armySound;
  armySound = null;
  clearInterval(drums);
  master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
  for (const voice of voices) voice.stop(ctx.currentTime + 0.8);
}
