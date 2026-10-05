// Every sound in the app, made in code with the Web Audio API. There are no audio files.
// Phones only allow sound after a tap, so nothing plays until unlockAudio() has run.
//
// How it is put together:
//   1. Raw material: tone() makes a pitched note, rush() makes a sweep of filtered noise.
//   2. Instruments built from those: boom, bell, pad, braam, choir.
//   3. The app's sounds (intro, done, penalty...) are short scores for those instruments.
// Everything leaves through one output chain with a reverb, which is what makes a
// handful of simple waves sound like they are in a huge dark hall.

import { getState } from './store.js';

let ctx = null;
let out = null; // every sound ends up here
let hall = null; // sounds send a share of themselves here to be given an echo

// ---------- The output chain ----------

// Call from a tap. Creates the sound engine, or wakes it if the phone paused it.
export function unlockAudio() {
  if (!ctx) {
    ctx = new AudioContext();
    buildOutput();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function buildOutput() {
  // A compressor turns loud peaks down, so layered sounds do not crackle.
  const squeeze = ctx.createDynamicsCompressor();
  squeeze.threshold.value = -18;
  squeeze.knee.value = 20;
  squeeze.ratio.value = 5;
  squeeze.attack.value = 0.004;
  squeeze.release.value = 0.3;
  out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(squeeze).connect(ctx.destination);

  // Reverb. The echo of a big room is, roughly, a burst of noise fading away.
  // So: make three seconds of fading noise, and let the browser smear every
  // sound through it (that is what a "convolver" does).
  const length = Math.floor(ctx.sampleRate * 3.2);
  const echo = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let side = 0; side < 2; side++) {
    const samples = echo.getChannelData(side);
    for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.6;
  }
  const room = ctx.createConvolver();
  room.buffer = echo;
  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 3800;
  hall = ctx.createGain();
  hall.connect(room).connect(soften).connect(out);
}

// Connects a finished sound to the output, with `wet` of it sent to the hall.
function send(node, wet) {
  node.connect(out);
  if (wet > 0) {
    const share = ctx.createGain();
    share.gain.value = wet;
    node.connect(share).connect(hall);
  }
}

// ---------- Raw material ----------

// One note: a wave that can slide in pitch, swell in, and fade out.
// `spread` adds a second, slightly out-of-tune copy, which thickens the sound.
// `cutoff` muffles it by removing everything above that frequency.
function tone({ type = 'sine', from, to = from, at = 0, dur, vol = 0.2, attack = 0.012, wet = 0, spread = 0, cutoff = null }) {
  const start = ctx.currentTime + at;
  const level = ctx.createGain();
  level.gain.setValueAtTime(0.0001, start);
  level.gain.exponentialRampToValueAtTime(vol, start + attack);
  level.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  let last = level;
  if (cutoff) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff[0], start);
    filter.frequency.exponentialRampToValueAtTime(cutoff[1] ?? cutoff[0], start + dur);
    level.connect(filter);
    last = filter;
  }
  send(last, wet);

  for (const cents of spread ? [-spread, spread] : [0]) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.detune.value = cents;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + dur);
    osc.connect(level);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }
}

let noiseData = null;

// Two seconds of random static: the raw material for wind, whooshes, crackles and thuds.
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

// A sweep of filtered noise. Sliding the filter upward is a rising whoosh;
// downward is something falling away. `swell` is the share of the time spent building up.
function rush({ from, to = from, at = 0, dur, vol = 0.1, swell = 0.5, wet = 0.3, type = 'bandpass', q = 1.2 }) {
  const start = ctx.currentTime + at;
  const source = noise();
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + dur);
  const level = ctx.createGain();
  level.gain.setValueAtTime(0.0001, start);
  level.gain.exponentialRampToValueAtTime(vol, start + Math.max(0.01, dur * swell));
  level.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  source.connect(filter).connect(level);
  send(level, wet);
  source.start(start, Math.random() * 1.5);
  source.stop(start + dur + 0.05);
}

// ---------- Instruments ----------

// A deep impact: a low note dropping fast, with a dull thud of noise on top.
function boom(at = 0, vol = 0.5) {
  tone({ from: 120, to: 30, at, dur: 1.3, vol, attack: 0.006, wet: 0.35 });
  rush({ from: 900, to: 60, at, dur: 0.5, vol: vol * 0.5, swell: 0.02, type: 'lowpass', wet: 0.5 });
}

// A bell: one note plus quieter, higher partials that are deliberately not in tune
// with it. That slight clash is what makes metal sound like metal.
function bell(freq, at = 0, vol = 0.1, dur = 2) {
  [[1, 1], [2.01, 0.5], [2.76, 0.32], [4.07, 0.18], [5.4, 0.1]].forEach(([ratio, share], i) => {
    tone({ from: freq * ratio, at, dur: dur / (1 + i * 0.45), vol: vol * share, attack: 0.004, wet: 0.7 });
  });
}

// A pad: soft, slow, thick chords, like strings holding a note.
function pad(freqs, at, dur, vol = 0.05) {
  for (const from of freqs) {
    tone({ type: 'sawtooth', from, at, dur, vol, attack: dur * 0.35, spread: 9, cutoff: [700, 2000], wet: 0.8 });
  }
}

// A braam: the huge, growling low brass hit of a film trailer.
function braam(freq, at, dur, vol = 0.2) {
  tone({ type: 'sawtooth', from: freq, at, dur, vol, attack: 0.05, spread: 14, cutoff: [1500, 220], wet: 0.6 });
  tone({ type: 'sawtooth', from: freq / 2, at, dur, vol: vol * 0.8, attack: 0.05, spread: 6, cutoff: [600, 140], wet: 0.4 });
  tone({ type: 'square', from: freq * 2, at, dur: dur * 0.6, vol: vol * 0.18, attack: 0.08, spread: 10, cutoff: [2400, 500], wet: 0.7 });
}

// A choir: the same buzzing notes pushed through three narrow filters set to the
// resonances of a mouth singing "aah".
function choir(freqs, at, dur, vol = 0.08) {
  const start = ctx.currentTime + at;
  const level = ctx.createGain();
  level.gain.setValueAtTime(0.0001, start);
  level.gain.exponentialRampToValueAtTime(vol, start + dur * 0.4);
  level.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  send(level, 0.9);

  const mouth = [700, 1150, 2700].map((formant) => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = formant;
    filter.Q.value = 7;
    filter.connect(level);
    return filter;
  });
  for (const from of freqs) {
    for (const cents of [-11, 11]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = from;
      osc.detune.value = cents;
      for (const filter of mouth) osc.connect(filter);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    }
  }
}

// ---------- The app's sounds ----------

const sounds = {
  // The intro: a rush out of the dark, an impact with a low brass roar, then
  // bells and a held chord ringing out into the hall.
  intro() {
    rush({ from: 180, to: 7000, dur: 0.78, vol: 0.14, swell: 0.95, wet: 0.5 });
    tone({ type: 'sawtooth', from: 38, to: 150, dur: 0.78, vol: 0.14, attack: 0.5, cutoff: [300, 1400], wet: 0.3 });
    boom(0.76, 0.6);
    braam(55, 0.76, 2.6, 0.2);
    braam(82.4, 0.78, 2.2, 0.1);
    pad([220, 329.6, 440], 0.9, 2.8, 0.04);
    [880, 1318.5, 1760].forEach((freq, i) => bell(freq, 1.15 + i * 0.16, 0.06, 2.4));
  },
  // The System waking up, for people who skip the intro: one bell over a soft low note.
  begin() {
    bell(880, 0, 0.15, 1.8);
    tone({ from: 110, to: 55, dur: 0.6, vol: 0.26, wet: 0.3 });
  },
  // Quest complete: a warm bell, a second one answering above it, a soft thump below.
  done() {
    bell(659.3, 0, 0.21, 1.9);
    bell(987.8, 0.08, 0.13, 1.7);
    tone({ from: 196, to: 82, dur: 0.4, vol: 0.26, attack: 0.005, wet: 0.2 });
    rush({ from: 5000, to: 9000, dur: 0.5, vol: 0.02, swell: 0.1, wet: 0.6 });
  },
  // Coins landing: three small bright chimes, just after the bell.
  coins() {
    [2093, 2637, 3136].forEach((freq, i) => {
      tone({ from: freq, at: 0.3 + i * 0.075, dur: 0.5, vol: 0.085, attack: 0.003, wet: 0.6 });
      tone({ from: freq * 2.4, at: 0.3 + i * 0.075, dur: 0.25, vol: 0.028, attack: 0.003, wet: 0.6 });
    });
  },
  // Level up: a rush upward, an impact, then a rising run of bells over a wide chord.
  levelUp() {
    rush({ from: 300, to: 6000, at: 0.1, dur: 0.5, vol: 0.09, swell: 0.95, wet: 0.5 });
    boom(0.58, 0.5);
    braam(65.4, 0.58, 2, 0.13);
    pad([261.6, 329.6, 392, 523.3], 0.58, 3, 0.05);
    [523.3, 659.3, 784, 1046.5, 1318.5].forEach((freq, i) => bell(freq, 0.62 + i * 0.1, 0.09, 2.4));
  },
  // The last minute before a deadline: a clock's tick over a heartbeat.
  tick() {
    tone({ type: 'square', from: 1700, dur: 0.06, vol: 0.1, attack: 0.002, wet: 0.5 });
    tone({ from: 96, to: 52, dur: 0.34, vol: 0.5, attack: 0.008, wet: 0.2 });
  },
  // The last ten seconds: the same, higher and with a second beat.
  tickFast() {
    tone({ type: 'square', from: 2300, dur: 0.06, vol: 0.12, attack: 0.002, wet: 0.5 });
    tone({ from: 112, to: 58, dur: 0.3, vol: 0.55, attack: 0.008, wet: 0.2 });
    tone({ from: 104, to: 54, dur: 0.3, at: 0.26, vol: 0.42, attack: 0.008, wet: 0.2 });
  },
  // Lightning over the Battleground: a crack, then a long roll.
  thunder() {
    rush({ from: 3200, to: 300, dur: 0.25, vol: 0.12, swell: 0.02, type: 'lowpass', wet: 0.7 });
    rush({ from: 500, to: 50, at: 0.12, dur: 2.4, vol: 0.16, swell: 0.08, type: 'lowpass', wet: 0.9 });
    tone({ from: 70, to: 30, at: 0.12, dur: 1.8, vol: 0.3, wet: 0.5 });
  },
  // Every quest of the day cleared: brass, a wide major chord, bells climbing.
  allClear() {
    boom(0.5, 0.45);
    braam(73.4, 0.5, 2.2, 0.12);
    pad([293.7, 370, 440, 587.3], 0.5, 3, 0.05);
    [587.3, 740, 880, 1174.7, 1480].forEach((freq, i) => bell(freq, 0.56 + i * 0.1, 0.09, 2.4));
  },
  // ---- The small sounds: one for every touch ----
  // Any button pressed: a soft, short click.
  tap() {
    tone({ from: 720, to: 520, dur: 0.09, vol: 0.34, attack: 0.004, wet: 0.2 });
  },
  // Moving between screens: a breath of air.
  nav() {
    rush({ from: 700, to: 2600, dur: 0.22, vol: 0.5, swell: 0.4, wet: 0.4 });
  },
  // A window or sheet opening: two quick rising notes.
  open() {
    tone({ from: 520, dur: 0.1, vol: 0.22, attack: 0.005, wet: 0.4 });
    tone({ from: 780, dur: 0.16, at: 0.06, vol: 0.22, attack: 0.005, wet: 0.5 });
  },
  // Something refused: two low, flat buzzes.
  deny() {
    tone({ type: 'square', from: 150, dur: 0.1, vol: 0.14, attack: 0.004, cutoff: [600, 400], wet: 0.2 });
    tone({ type: 'square', from: 140, dur: 0.14, at: 0.12, vol: 0.14, attack: 0.004, cutoff: [600, 400], wet: 0.2 });
  },
  // Something added or saved: a small bright chime.
  add() {
    bell(880, 0, 0.09, 1);
    bell(1318.5, 0.07, 0.06, 0.9);
  },
  // Something removed: a note falling away.
  remove() {
    tone({ from: 520, to: 170, dur: 0.26, vol: 0.3, wet: 0.4 });
    rush({ from: 2400, to: 500, dur: 0.2, vol: 0.2, swell: 0.05, wet: 0.4 });
  },
  // A switch or a choice changed: one clean high tick.
  toggle() {
    tone({ from: 1040, dur: 0.09, vol: 0.26, attack: 0.004, wet: 0.4 });
    tone({ from: 1560, dur: 0.14, at: 0.05, vol: 0.16, attack: 0.004, wet: 0.5 });
  },
  // Daily check-in: a single soft bell.
  checkIn() {
    bell(784, 0, 0.17, 1.4);
  },
  // Penalty Zone: everything falls away, then two low notes a semitone apart
  // (the most uneasy interval there is) roar together over a heavy impact.
  penalty() {
    rush({ from: 5000, to: 90, dur: 1, vol: 0.14, swell: 0.05, type: 'lowpass', wet: 0.6 });
    boom(0, 0.6);
    braam(46.25, 0.02, 3, 0.26);
    braam(49, 0.02, 3, 0.15);
    boom(1.05, 0.38);
    bell(1244.5, 0.2, 0.025, 3);
    bell(1318.5, 0.2, 0.025, 3);
  },
  // Penalty cleared: the tension lets go into a major chord and rising bells.
  cleared() {
    pad([293.7, 370, 440], 0, 2.6, 0.05);
    tone({ from: 147, to: 73, dur: 0.6, vol: 0.2, wet: 0.3 });
    [587.3, 740, 880, 1174.7].forEach((freq, i) => bell(freq, 0.08 + i * 0.11, 0.09, 2.2));
  },
  // A soldier rises: a whoosh from below, an impact, and a choir out of the dark.
  purchase() {
    rush({ from: 250, to: 3200, dur: 0.5, vol: 0.11, swell: 0.9, wet: 0.5 });
    tone({ from: 46, to: 110, dur: 0.55, vol: 0.26, attack: 0.3, wet: 0.3 });
    boom(0.42, 0.4);
    choir([220, 261.6, 329.6], 0.4, 2.4, 0.07);
    bell(1318.5, 0.55, 0.05, 2.2);
  },
};

export function play(name) {
  if (!ctx || getState().settings.muted) return;
  sounds[name]();
}

// Vibrates the phone, where the phone allows it. The sound switch silences this too.
export function buzz(pattern) {
  if (getState().settings.muted) return;
  navigator.vibrate?.(pattern);
}

// ---------- The crackling fire ----------
// A fire is mostly noise: a low steady roar that wavers, with sharp little pops on top.

function crackle() {
  const now = ctx.currentTime;
  const source = noise();
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1400 + Math.random() * 3600;
  band.Q.value = 1.5;
  const level = ctx.createGain();
  // Mostly small ticks, now and then a louder pop.
  const loud = Math.random() < 0.12 ? 0.16 : 0.02 + Math.random() * 0.06;
  level.gain.setValueAtTime(loud, now);
  level.gain.exponentialRampToValueAtTime(0.0001, now + 0.025 + Math.random() * 0.06);
  source.connect(band).connect(level);
  send(level, 0.15);
  source.start(now, Math.random() * 1.5);
  source.stop(now + 0.12);
}

let fireSound = null;

export function startFireSound() {
  if (!ctx || fireSound || getState().settings.muted) return;
  const now = ctx.currentTime;
  const roar = noise();
  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 380;
  const level = ctx.createGain();
  level.gain.setValueAtTime(0.0001, now);
  level.gain.exponentialRampToValueAtTime(0.11, now + 1.4);
  // The roar wavers, the way flames do.
  const waver = ctx.createOscillator();
  waver.frequency.value = 0.37;
  const depth = ctx.createGain();
  depth.gain.value = 0.035;
  waver.connect(depth).connect(level.gain);
  roar.connect(low).connect(level);
  send(level, 0.1);
  roar.start();
  waver.start();
  const pops = setInterval(() => {
    if (Math.random() < 0.55) crackle();
  }, 120);
  fireSound = { roar, waver, level, pops };
}

export function stopFireSound() {
  if (!fireSound) return;
  const { roar, waver, level, pops } = fireSound;
  fireSound = null;
  clearInterval(pops);
  level.gain.cancelScheduledValues(ctx.currentTime);
  level.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
  roar.stop(ctx.currentTime + 0.7);
  waver.stop(ctx.currentTime + 0.7);
}

// ---------- The army's presence on the Battleground ----------
// One layer of sound per few soldiers, so a bigger army sounds bigger:
// a deep drone, then a note above it, then wind and a distant choir, then war drums.

let armySound = null;

export function startArmySound(layers) {
  if (!ctx || armySound || layers < 1 || getState().settings.muted) return;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1, now + 2.5);
  send(master, 0.5);

  const running = [];
  // A held note: two slightly out-of-tune waves, muffled, slowly swelling and fading.
  const drone = (type, freq, vol, cutoff, wobble) => {
    const level = ctx.createGain();
    level.gain.value = vol;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    filter.connect(level).connect(master);
    const swell = ctx.createOscillator();
    swell.frequency.value = wobble;
    const depth = ctx.createGain();
    depth.gain.value = vol * 0.5;
    swell.connect(depth).connect(level.gain);
    swell.start();
    running.push(swell);
    for (const cents of [-8, 8]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = cents;
      osc.connect(filter);
      osc.start();
      running.push(osc);
    }
  };

  drone('sawtooth', 55, 0.065, 170, 0.11);
  if (layers >= 2) drone('sawtooth', 82.4, 0.036, 320, 0.17);
  if (layers >= 3) {
    drone('sawtooth', 220, 0.012, 900, 0.07);
    // Wind: a narrow band of noise whose pitch drifts.
    const wind = noise();
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 520;
    band.Q.value = 3;
    const gust = ctx.createOscillator();
    gust.frequency.value = 0.09;
    const reach = ctx.createGain();
    reach.gain.value = 260;
    gust.connect(reach).connect(band.frequency);
    const level = ctx.createGain();
    level.gain.value = 0.05;
    wind.connect(band).connect(level).connect(master);
    wind.start();
    gust.start();
    running.push(wind, gust);
  }

  // The fourth layer: slow war drums, far away.
  let drums = null;
  if (layers >= 4) {
    const beat = () => {
      boom(0, 0.3);
      boom(0.32, 0.2);
    };
    beat();
    drums = setInterval(beat, 2600);
  }
  armySound = { master, running, drums };
}

export function stopArmySound() {
  if (!armySound) return;
  const { master, running, drums } = armySound;
  armySound = null;
  clearInterval(drums);
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
  for (const node of running) node.stop(ctx.currentTime + 1.2);
}
