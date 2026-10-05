// The Battleground: your fire at the bottom, your named soldiers gathered round
// it, weapons planted in the ground, and demons looming behind that grow with
// your level. Nothing here fights; everything just breathes in a loop.

import { getState } from './store.js';
import { demonsForLevel, soundLayersFor } from './config.js';
import { armyOf } from './rewards.js';
import { createFire } from './fire.js';
import { drawSprite, loadSprites } from './sprites.js';
import { startArmySound, startFireSound, stopArmySound, stopFireSound } from './audio.js';
import { CATALOG, DEMON_SPRITES } from '../data/catalog.js';

const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;

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
  const groundY = height * 0.7;
  const onOval = (angle, rx, ry) => {
    const a = (angle * Math.PI) / 180;
    return { x: cx + Math.cos(a) * rx * width, y: groundY + Math.sin(a) * ry * height };
  };

  // A bigger army stands a little smaller so everyone fits.
  const shown = soldiers.slice(0, MAX_SOLDIERS);
  const crowd = shown.length > 16 ? 0.7 : shown.length > 6 ? 0.84 : 1;
  const soldierHeight = Math.min(width * 0.2, height * 0.105) * crowd;

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
      height: soldierHeight * 0.74,
    });
  });
  // Whatever stands further back is drawn first, so nearer things overlap it.
  figures.sort((a, b) => a.y - b.y);

  const horde = demonsForLevel(state.level);
  const demonHeight = Math.min(width * 0.34, height * 0.2) * horde.scale;
  const demons = Array.from({ length: horde.count }, (_, i) => ({
    x: (width * (i + 0.5)) / horde.count,
    y: height * (0.4 + (i % 2) * 0.045),
    sprite: DEMON_SPRITES[i % DEMON_SPRITES.length],
    height: demonHeight * (i % 2 ? 0.9 : 1),
    phase: i * 2.1,
  })).sort((a, b) => a.y - b.y);

  return {
    cx,
    groundY,
    fireSize: Math.min(width * 0.44, height * 0.26),
    figures,
    demons,
    soldierCount: soldiers.length,
    names: shown.map((soldier) => soldier.name),
    hidden: soldiers.length - shown.length,
    weaponCount: weapons.length,
  };
}

function drawScene(ctx, width, height, scene, sprites, fire, time) {
  ctx.clearRect(0, 0, width, height);

  // A red haze where the demons gather, and firelight spreading over the ground.
  if (scene.demons.length) {
    const haze = ctx.createRadialGradient(scene.cx, height * 0.3, 0, scene.cx, height * 0.3, width * 0.8);
    haze.addColorStop(0, 'rgba(170, 16, 28, 0.26)');
    haze.addColorStop(1, 'rgba(170, 16, 28, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height * 0.7);
  }
  for (const demon of scene.demons) {
    const sway = Math.sin(time * 0.7 + demon.phase);
    drawSprite(ctx, demon.sprite, sprites[demon.sprite], demon.x + sway * 3, demon.y + Math.cos(time * 0.9 + demon.phase) * 4, demon.height);
  }
  // A veil of darkness over all of them at once, thickest near the ground, so the
  // demons loom in the distance instead of standing in the firelight.
  const dusk = ctx.createLinearGradient(0, 0, 0, height * 0.48);
  dusk.addColorStop(0, 'rgba(0, 0, 0, 0.34)');
  dusk.addColorStop(0.62, 'rgba(0, 0, 0, 0.34)');
  dusk.addColorStop(1, 'rgba(0, 0, 0, 0.94)');
  ctx.fillStyle = dusk;
  ctx.fillRect(0, 0, width, height * 0.5);

  const drawFigure = (figure) => {
    // Soldiers have a phase and bob gently; weapons stay put.
    const bob = figure.phase === undefined ? 0 : Math.abs(Math.sin(time * 1.8 + figure.phase)) * figure.height * 0.035;
    drawSprite(ctx, figure.sprite, sprites[figure.sprite], figure.x, figure.y - bob, figure.height);
  };

  // Everything behind the fire, then the fire, then everything in front of it.
  scene.figures.filter((figure) => figure.y < scene.groundY).forEach(drawFigure);
  fire.draw(ctx, scene.cx, scene.groundY, scene.fireSize);
  scene.figures.filter((figure) => figure.y >= scene.groundY).forEach(drawFigure);

  // Names go on last, over everything, so no soldier hides another's name.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#eaf2ff';
  for (const figure of scene.figures) {
    if (!figure.name) continue;
    ctx.font = `600 ${Math.max(10.5, figure.height * 0.17)}px Rajdhani, 'Segoe UI', sans-serif`;
    ctx.strokeText(figure.name, figure.x, figure.y + 2);
    ctx.fillText(figure.name, figure.x, figure.y + 2);
  }
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
  function fit() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    scene = arrange(width, height, state);
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
    drawScene(ctx, width, height, scene, sprites, fire, time);
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
