// The Battleground: your fire at the bottom, your named shadow soldiers gathered
// round it, weapons planted in the ground, and demons rising against a blood moon
// that grow with your level. Nothing here fights; everything just breathes in a loop.

import { getState } from './store.js';
import { demonsForLevel, soundLayersFor } from './config.js';
import { armyOf } from './rewards.js';
import { createFire, makeStamp } from './fire.js';
import { drawSprite, loadSprites } from './sprites.js';
import { play, startArmySound, startFireSound, stopArmySound, stopFireSound } from './audio.js';
import { CATALOG, DEMON_SPRITES } from '../data/catalog.js';

const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;
const rand = (min, max) => min + Math.random() * (max - min);

// Soldiers stand on rings around the fire. Each ring is an oval (a circle seen
// from the side), given as a share of the screen's width and height.
// `turn` rotates a ring so its soldiers stand in the gaps of the ring inside it.
const RINGS = [
  { slots: 6, rx: 0.33, ry: 0.07, turn: 0 },
  { slots: 10, rx: 0.42, ry: 0.14, turn: 18 },
  { slots: 14, rx: 0.44, ry: 0.21, turn: 0 },
];
const MAX_SOLDIERS = RINGS.reduce((sum, ring) => sum + ring.slots, 0);
// Weapons are planted between the soldiers of the first ring, front first.
const WEAPON_ANGLES = [90, 30, 150, 210, 330, 270, 55, 125];
const HORIZON = 0.5; // how far down the screen the ground begins
const AURA_BUDGET = 110; // wisps of shadow per second, shared by the whole army
const MOTES = 26; // specks of dust drifting in the firelight

let app;
let stopScene = null;
let visit = 0; // goes up each time the screen is entered or left

// Angles for a ring, ordered so the front fills first and the sides alternate.
function ringAngles({ slots, turn }) {
  return Array.from({ length: slots }, (_, i) => turn + (i * 360) / slots).sort(
    (a, b) => Math.sin((b * Math.PI) / 180) - Math.sin((a * Math.PI) / 180),
  );
}

// Works out where everything stands for this screen size. Done once per visit.
function arrange(width, height, state) {
  const { soldiers, weapons } = armyOf(state);
  const cx = width / 2;
  const groundY = height * 0.72;
  const onOval = (angle, rx, ry) => {
    const a = (angle * Math.PI) / 180;
    return { x: cx + Math.cos(a) * rx * width, y: groundY + Math.sin(a) * ry * height };
  };

  // A bigger army stands a little smaller so everyone fits.
  const shown = soldiers.slice(0, MAX_SOLDIERS);
  const crowd = shown.length > 16 ? 0.68 : shown.length > 6 ? 0.82 : 1;
  const soldierHeight = Math.min(width * 0.3, height * 0.15) * crowd;

  const figures = [];
  let next = 0;
  for (const ring of RINGS) {
    for (const angle of ringAngles(ring)) {
      if (next >= shown.length) break;
      const soldier = shown[next++];
      figures.push({
        ...onOval(angle, ring.rx, ring.ry),
        sprite: soldier.item.sprite,
        name: soldier.name,
        height: soldierHeight,
        phase: next * 1.7,
      });
    }
  }
  weapons.slice(0, WEAPON_ANGLES.length).forEach((weapon, i) => {
    figures.push({
      ...onOval(WEAPON_ANGLES[i], 0.25, 0.062),
      sprite: weapon.item.sprite,
      height: soldierHeight * 0.8,
    });
  });
  // Whatever stands further back is drawn first, so nearer things overlap it.
  figures.sort((a, b) => a.y - b.y);

  // Demons rise from behind the horizon, shoulder to shoulder.
  const horde = demonsForLevel(state.level);
  const demonHeight = Math.min(width * 0.5, height * 0.25) * horde.scale;
  const demons = Array.from({ length: horde.count }, (_, i) => ({
    x: cx + (i - (horde.count - 1) / 2) * Math.min(width / horde.count, width * 0.3),
    y: height * (HORIZON + 0.02 + (i % 2) * 0.025),
    sprite: DEMON_SPRITES[i % DEMON_SPRITES.length],
    height: demonHeight * (i % 2 ? 0.88 : 1),
    phase: i * 2.1,
  })).sort((a, b) => a.y - b.y);

  return {
    cx,
    groundY,
    fireSize: Math.min(width * 0.42, height * 0.24),
    figures,
    soldiers: figures.filter((figure) => figure.name),
    demons,
    soldierCount: soldiers.length,
    names: shown.map((soldier) => soldier.name),
    hidden: soldiers.length - shown.length,
    weaponCount: weapons.length,
  };
}

// ---------- Things that drift: the soldiers' aura, dust, fog ----------

function makeAir(width, height) {
  return {
    wisps: [], // shadow rising off the soldiers
    debt: 0,
    flash: 0, // how bright the sky is from lightning right now, 1 to 0
    nextStrike: rand(3, 7), // seconds until the next lightning
    motes: Array.from({ length: MOTES }, () => ({
      x: rand(0, width),
      y: rand(height * HORIZON, height),
      drift: rand(-6, 6),
      rise: rand(4, 14),
      size: rand(0.6, 1.6),
      phase: rand(0, TAU),
    })),
    fog: Array.from({ length: 5 }, (_, i) => ({
      x: rand(0, width),
      y: height * (HORIZON + rand(-0.02, 0.06)),
      r: width * rand(0.3, 0.55),
      speed: rand(3, 9) * (i % 2 ? 1 : -1),
    })),
  };
}

let auraStamps = null;
function getAuraStamps() {
  auraStamps ??= [
    makeStamp('rgba(150, 180, 255, 0.34)', 'rgba(70, 96, 235, 0.15)'),
    makeStamp('rgba(160, 120, 255, 0.3)', 'rgba(96, 56, 225, 0.12)'),
  ];
  return auraStamps;
}

function stepAir(air, scene, width, height, dt) {
  // Each soldier sheds a few wisps a second; a large army shares one budget.
  if (scene.soldiers.length) {
    for (air.debt += dt * Math.min(AURA_BUDGET, scene.soldiers.length * 12); air.debt >= 1; air.debt -= 1) {
      const from = scene.soldiers[Math.floor(Math.random() * scene.soldiers.length)];
      air.wisps.push({
        x: from.x + rand(-0.22, 0.22) * from.height,
        y: from.y - rand(0.05, 0.75) * from.height,
        rise: rand(10, 26),
        size: from.height * rand(0.22, 0.42),
        stamp: Math.random() < 0.6 ? 0 : 1,
        phase: rand(0, TAU),
        age: 0,
        life: rand(0.9, 1.9),
      });
    }
  }
  for (const w of air.wisps) {
    w.age += dt;
    w.y -= w.rise * dt;
    w.x += Math.sin(w.age * 2.4 + w.phase) * 6 * dt;
  }
  for (let i = air.wisps.length - 1; i >= 0; i--) if (air.wisps[i].age >= air.wisps[i].life) air.wisps.splice(i, 1);

  for (const m of air.motes) {
    m.y -= m.rise * dt;
    m.x += (m.drift + Math.sin(m.y * 0.03 + m.phase) * 5) * dt;
    if (m.y < height * HORIZON) {
      m.y = height;
      m.x = rand(0, width);
    }
  }
  // Lightning: only once the demons have come. A strike, then a weaker second flicker.
  air.flash = Math.max(0, air.flash - dt * 3.2);
  if (scene.demons.length) {
    air.nextStrike -= dt;
    if (air.nextStrike <= 0) {
      air.flash = 1;
      air.nextStrike = rand(6, 13);
      play('thunder');
      setTimeout(() => {
        air.flash = Math.max(air.flash, 0.7);
      }, 140);
    }
  }

  for (const f of air.fog) {
    f.x += f.speed * dt;
    if (f.x - f.r > width) f.x = -f.r;
    if (f.x + f.r < 0) f.x = width + f.r;
  }
}

// ---------- Drawing ----------

// The blood moon the demons stand against. It only rises once they are here.
function drawMoon(ctx, scene, width, height, time) {
  const x = scene.cx;
  const y = height * 0.25;
  const r = Math.min(width * 0.36, height * 0.2);
  const pulse = 0.9 + 0.1 * Math.sin(time * 0.6);

  const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.6);
  halo.addColorStop(0, `rgba(190, 22, 34, ${0.5 * pulse})`);
  halo.addColorStop(0.45, 'rgba(120, 10, 22, 0.16)');
  halo.addColorStop(1, 'rgba(120, 10, 22, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height * 0.75);

  const disc = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
  disc.addColorStop(0, '#8f1420');
  disc.addColorStop(0.7, '#4a070f');
  disc.addColorStop(1, '#2a0409');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = `rgba(255, 96, 80, ${0.75 * pulse})`;
  ctx.stroke();
}

function drawScene(ctx, width, height, scene, sprites, fire, air, time) {
  ctx.clearRect(0, 0, width, height);
  const horizonY = height * HORIZON;

  if (scene.demons.length) {
    drawMoon(ctx, scene, width, height, time);
    for (const demon of scene.demons) {
      const breathe = Math.sin(time * 0.7 + demon.phase);
      drawSprite(ctx, demon.sprite, sprites[demon.sprite], demon.x + breathe * 2, demon.y + Math.cos(time * 0.5 + demon.phase) * 3, demon.height);
    }
  }

  // Lightning lights the whole sky for an instant, behind the ground.
  if (air.flash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255, 150, 140, ${air.flash * 0.34})`;
    ctx.fillRect(0, 0, width, horizonY + height * 0.04);
    ctx.restore();
  }

  // The ground: black, with the sky fading into it at the horizon.
  const ground = ctx.createLinearGradient(0, horizonY - height * 0.04, 0, horizonY + height * 0.1);
  ground.addColorStop(0, 'rgba(0, 0, 0, 0)');
  ground.addColorStop(0.45, 'rgba(0, 0, 0, 0.96)');
  ground.addColorStop(1, '#000');
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizonY - height * 0.04, width, height);

  // Fog lying along the horizon, drifting.
  for (const f of air.fog) {
    const mist = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
    mist.addColorStop(0, scene.demons.length ? 'rgba(70, 14, 24, 0.2)' : 'rgba(30, 40, 80, 0.2)');
    mist.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(1, 0.16); // squash each round cloud into a low bank of mist
    ctx.translate(-f.x, -f.y);
    ctx.fillStyle = mist;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // Shadow rising off the soldiers, drawn behind all of them.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const stamps = getAuraStamps();
  for (const w of air.wisps) {
    const t = w.age / w.life;
    const size = w.size * (1 - t * 0.5);
    ctx.globalAlpha = (t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8) * 0.8;
    ctx.drawImage(stamps[w.stamp], w.x - size / 2, w.y - size * 0.8, size, size * 1.6);
  }
  ctx.restore();

  const drawFigure = (figure) => {
    // Soldiers have a phase and rise and settle as if breathing; weapons stay put.
    const lift = figure.phase === undefined ? 0 : (Math.sin(time * 1.3 + figure.phase) + 1) * figure.height * 0.008;
    drawSprite(ctx, figure.sprite, sprites[figure.sprite], figure.x, figure.y - lift, figure.height);
  };

  // Everything behind the fire, then the fire, then everything in front of it.
  scene.figures.filter((figure) => figure.y < scene.groundY).forEach(drawFigure);
  fire.draw(ctx, scene.cx, scene.groundY, scene.fireSize);
  scene.figures.filter((figure) => figure.y >= scene.groundY).forEach(drawFigure);

  // Dust catching the firelight.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const m of air.motes) {
    const near = 1 - Math.min(1, Math.hypot(m.x - scene.cx, m.y - scene.groundY) / (width * 0.75));
    ctx.globalAlpha = (0.15 + 0.55 * near) * (0.6 + 0.4 * Math.sin(time * 2 + m.phase));
    ctx.fillStyle = '#ffb46b';
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // Darkness closing in at the edges.
  const vignette = ctx.createRadialGradient(scene.cx, height * 0.55, height * 0.3, scene.cx, height * 0.55, height * 0.75);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Names go on last, over everything, so no soldier hides another's name.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillStyle = '#cfe0ff';
  ctx.shadowColor = '#5b8cff';
  for (const figure of scene.soldiers) {
    ctx.font = `600 ${Math.max(10, figure.height * 0.105)}px Rajdhani, 'Segoe UI', sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '1.5px';
    const label = figure.name.toUpperCase();
    ctx.shadowBlur = 0;
    ctx.strokeText(label, figure.x, figure.y + 4);
    ctx.shadowBlur = 8;
    ctx.fillText(label, figure.x, figure.y + 4);
  }
  ctx.shadowBlur = 0;
}

// In words, what the scene shows: for screen readers, and for the captions.
function describe(scene, level) {
  const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  return `Level ${level} · ${count(scene.soldierCount, 'soldier')} · ${count(scene.weaponCount, 'weapon')} · ${count(scene.demons.length, 'demon')}`;
}

async function enter() {
  const state = getState();
  const canvas = $('battle-scene');
  const ctx = canvas.getContext('2d');
  const fire = createFire();
  for (let i = 0; i < 60; i++) fire.step(1 / 60);

  const thisVisit = ++visit;
  const sprites = await loadSprites([...CATALOG.map((item) => item.sprite), ...DEMON_SPRITES]);
  // The drawings load in the background. If the screen was left meanwhile, stop here.
  if (thisVisit !== visit) return;

  let width = 0;
  let height = 0;
  let scene = null;
  let air = null;
  function fit() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    scene = arrange(width, height, state);
    air = makeAir(width, height);
  }
  fit();
  window.addEventListener('resize', fit);

  const summary = describe(scene, state.level);
  canvas.setAttribute('aria-label', `Battleground. ${summary}. Soldiers: ${scene.names.join(', ') || 'none yet'}.`);
  $('battle-caption').textContent = `Level ${state.level} · Army ${scene.soldierCount} · Demons ${scene.demons.length}`;
  $('battle-hint').textContent = scene.soldierCount
    ? scene.hidden > 0 ? `${scene.hidden} more soldiers wait in reserve.` : ''
    : 'Only your fire, for now. Finish quests, earn coins, and raise an army in the Shop.';

  let frame = null;
  let last = null;
  let time = 0;
  function tick(now) {
    const dt = Math.min((now - (last ?? now)) / 1000, 0.05);
    last = now;
    time += dt;
    fire.step(dt);
    stepAir(air, scene, width, height, dt);
    drawScene(ctx, width, height, scene, sprites, fire, air, time);
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);

  startFireSound();
  startArmySound(soundLayersFor(scene.soldierCount));

  stopScene = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', fit);
    stopFireSound();
    stopArmySound();
  };
}

export function initBattleground(theApp) {
  app = theApp;

  app.register('battleground', {
    enter,
    leave() {
      visit += 1;
      stopScene?.();
      stopScene = null;
    },
  });

  $('battle-back').addEventListener('click', () => app.go('today'));
  $('battle-shop').addEventListener('click', () => app.go('shop'));
}
