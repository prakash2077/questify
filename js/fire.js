// The bonfire: a canvas fire made of a few hundred soft glowing particles, with
// charred logs, a ring of dark stones, sparks and a flickering glow on the ground.
// Focus uses it now; the Battleground will draw the same fire.
//
// Sizes are in "fire units": 1 unit is the width of the fire. x runs left to
// right with 0 at the centre, y runs upward from the ground.

const TAU = Math.PI * 2;
const rand = (min, max) => min + Math.random() * (max - min);

// ---------- Glow stamps ----------
// A soft round blob of colour, drawn once and then stamped for every particle.
// Stamps add their light together, so where many overlap the fire turns white-hot.

export function makeStamp(core, edge) {
  const size = 64;
  const stamp = document.createElement('canvas');
  stamp.width = stamp.height = size;
  const ctx = stamp.getContext('2d');
  const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  glow.addColorStop(0, core);
  glow.addColorStop(0.45, edge);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  return stamp;
}

// From the hot base of a flame to its cooling tip.
let stamps = null;
function getStamps() {
  stamps ??= [
    makeStamp('rgba(255, 232, 160, 0.5)', 'rgba(255, 170, 50, 0.26)'),
    makeStamp('rgba(255, 176, 56, 0.46)', 'rgba(255, 112, 22, 0.24)'),
    makeStamp('rgba(255, 104, 26, 0.42)', 'rgba(214, 44, 12, 0.2)'),
    makeStamp('rgba(196, 40, 14, 0.3)', 'rgba(110, 16, 8, 0.12)'),
  ];
  return stamps;
}

// ---------- The fire ----------

const FLAMES_PER_SECOND = 190;
const SPARKS_PER_SECOND = 7;
// Three tongues of flame: where each starts, and how strong it burns.
const TONGUES = [
  { x: -0.13, power: 0.62 },
  { x: 0, power: 1 },
  { x: 0.12, power: 0.72 },
];

// `density` thins the fire out where it is drawn small: 1 is full, 0.5 is half the particles.
export function createFire(density = 1) {
  const flames = [];
  const sparks = [];
  let time = 0;
  let flameDebt = 0;
  let sparkDebt = 0;

  function addFlame(heat = 0) {
    const tongue = TONGUES[Math.floor(Math.random() * TONGUES.length)];
    flames.push({
      x: tongue.x + rand(-0.07, 0.07) + Math.sin(time * 2.3 + tongue.x * 20) * 0.03,
      y: rand(0.03, 0.1),
      rise: rand(0.95, 1.75) * tongue.power * (1 + heat * 0.3),
      sway: rand(2, 5),
      phase: rand(0, TAU),
      size: rand(0.26, 0.42),
      age: 0,
      life: rand(0.6, 1.2) * (0.55 + 0.45 * tongue.power),
    });
  }

  function addSpark() {
    sparks.push({
      x: rand(-0.14, 0.14),
      y: rand(0.2, 0.5),
      drift: rand(-0.22, 0.22),
      rise: rand(0.8, 1.5),
      phase: rand(0, TAU),
      age: 0,
      life: rand(0.9, 2),
    });
  }

  // Move the fire forward by dt seconds. `heat` runs from 0 (a steady fire) to 1
  // (roaring): more flame, taller, and many more sparks.
  function step(dt, heat = 0) {
    time += dt;

    // The fire breathes: it burns a little harder and softer over time.
    const breath = 0.82 + 0.18 * Math.sin(time * 2.6) * Math.sin(time * 1.1 + 1);
    for (flameDebt += dt * FLAMES_PER_SECOND * density * breath * (1 + heat * 0.7); flameDebt >= 1; flameDebt -= 1) addFlame(heat);
    for (sparkDebt += dt * SPARKS_PER_SECOND * (1 + heat * 5); sparkDebt >= 1; sparkDebt -= 1) addSpark();

    for (const f of flames) {
      f.age += dt;
      f.x += Math.sin(f.age * f.sway + f.phase) * 0.22 * dt;
      f.x -= f.x * 1.5 * dt; // lean toward the centre, so the fire comes to a point
      f.y += f.rise * dt;
    }
    for (const s of sparks) {
      s.age += dt;
      s.x += (s.drift + Math.sin(s.age * 6 + s.phase) * 0.18) * dt;
      s.y += s.rise * dt;
    }
    for (let i = flames.length - 1; i >= 0; i--) if (flames[i].age >= flames[i].life) flames.splice(i, 1);
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].age >= sparks[i].life) sparks.splice(i, 1);
  }

  // Draw the fire with its base centred at (cx, groundY), `size` pixels wide.
  function draw(ctx, cx, groundY, size) {
    const flicker = 0.85 + 0.15 * Math.sin(time * 11) * Math.sin(time * 7.3);
    const px = (x) => cx + x * size;
    const py = (y) => groundY - y * size;

    const base = baseFor(size);
    drawGroundGlow(ctx, cx, groundY, size, flicker);
    ctx.drawImage(base.back, cx - base.x, groundY - base.y, base.width, base.height);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // The bed of embers the flames grow out of.
    const embers = ctx.createRadialGradient(cx, py(0.07), 0, cx, py(0.07), size * 0.34);
    embers.addColorStop(0, `rgba(255, 190, 80, ${0.75 * flicker})`);
    embers.addColorStop(0.5, 'rgba(255, 90, 20, 0.35)');
    embers.addColorStop(1, 'rgba(255, 60, 0, 0)');
    ctx.fillStyle = embers;
    ctx.fillRect(px(-0.4), py(0.42), size * 0.8, size * 0.5);

    const [hot, warm, cool, dying] = getStamps();
    for (const f of flames) {
      const t = f.age / f.life;
      const stamp = t < 0.22 ? hot : t < 0.5 ? warm : t < 0.78 ? cool : dying;
      // A thinner fire uses slightly larger blobs, so it still looks full.
      const width = f.size * size * (1 - t * 0.78) * (1.3 - 0.3 * density);
      ctx.globalAlpha = (t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88) * 0.9;
      // Taller than wide, so the blobs read as licks of flame.
      ctx.drawImage(stamp, px(f.x) - width / 2, py(f.y) - width * 0.75, width, width * 1.5);
    }

    for (const s of sparks) {
      const t = s.age / s.life;
      ctx.globalAlpha = (1 - t) * (0.6 + 0.4 * Math.sin(s.age * 30 + s.phase));
      ctx.fillStyle = t < 0.5 ? '#ffd27a' : '#ff8a3c';
      ctx.beginPath();
      ctx.arc(px(s.x), py(s.y), Math.max(1, size * 0.008), 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    ctx.drawImage(base.front, cx - base.x, groundY - base.y, base.width, base.height);
  }

  return { step, draw };
}

// ---------- The parts that do not move ----------

// The warm haze in the air round the fire: one soft picture, stretched to fit.
let airGlow = null;
function getAirGlow() {
  if (!airGlow) {
    airGlow = document.createElement('canvas');
    airGlow.width = airGlow.height = 128;
    const ctx = airGlow.getContext('2d');
    const haze = ctx.createRadialGradient(64, 64, 0, 64, 64, 61);
    haze.addColorStop(0, 'rgba(255, 120, 30, 0.16)');
    haze.addColorStop(1, 'rgba(255, 80, 0, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, 128, 128);
  }
  return airGlow;
}

// Warm light spilling onto the ground and into the air around the fire.
function drawGroundGlow(ctx, cx, groundY, size, flicker) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  ctx.globalAlpha = flicker;
  ctx.drawImage(getAirGlow(), cx - size * 1.3, groundY - size * 1.75, size * 2.6, size * 2.6);
  ctx.globalAlpha = 1;

  ctx.translate(cx, groundY + size * 0.02);
  ctx.scale(1, 0.22); // squash a circle into a pool of light lying on the ground
  const ground = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.05);
  ground.addColorStop(0, `rgba(255, 140, 40, ${0.42 * flicker})`);
  ground.addColorStop(1, 'rgba(255, 90, 0, 0)');
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.arc(0, 0, size * 1.05, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Two crossed logs, charred black, with fire glowing through the cracks.
function drawLogs(ctx, cx, groundY, size) {
  for (const tilt of [-0.3, 0.3]) {
    ctx.save();
    ctx.translate(cx, groundY - size * 0.07);
    ctx.rotate(tilt);
    const length = size * 0.8;
    const thick = size * 0.11;

    const wood = ctx.createLinearGradient(0, -thick / 2, 0, thick / 2);
    wood.addColorStop(0, '#3b2315');
    wood.addColorStop(0.45, '#1a0d07');
    wood.addColorStop(1, '#070302');
    ctx.fillStyle = wood;
    ctx.beginPath();
    ctx.roundRect(-length / 2, -thick / 2, length, thick, thick * 0.35);
    ctx.fill();

    // Embers showing through the bark, brightest near the middle of the fire.
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1, size * 0.008);
    ctx.shadowColor = '#ff6a1a';
    ctx.shadowBlur = size * 0.04;
    ctx.strokeStyle = 'rgba(255, 150, 60, 0.9)';
    ctx.beginPath();
    for (const [x, w] of [[-0.2, 0.1], [-0.04, 0.12], [0.12, 0.08]]) {
      ctx.moveTo(length * x, thick * 0.05);
      ctx.lineTo(length * (x + w * 0.4), -thick * 0.12);
      ctx.lineTo(length * (x + w), thick * 0.1);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// A ring of dark stones. The back half is drawn before the fire and the front
// half after it, so the fire sits inside the ring.
const STONES = [
  { angle: 200, r: 0.07 }, { angle: 232, r: 0.085 }, { angle: 270, r: 0.075 }, { angle: 308, r: 0.085 }, { angle: 340, r: 0.07 },
  { angle: 20, r: 0.075 }, { angle: 55, r: 0.09 }, { angle: 90, r: 0.08 }, { angle: 125, r: 0.09 }, { angle: 160, r: 0.075 },
];

function drawStones(ctx, px, py, size, front) {
  for (const stone of STONES) {
    const angle = (stone.angle * Math.PI) / 180;
    const isFront = Math.sin(angle) > 0;
    if (isFront !== front) continue;
    // A circle of stones seen from the side is a flat oval.
    const x = px(Math.cos(angle) * 0.5);
    const y = py(0.02 - Math.sin(angle) * 0.11);
    const r = stone.r * size;

    // Lit from the fire's side, falling away into black on the other.
    const towardFire = -Math.cos(angle);
    const rock = ctx.createLinearGradient(x + towardFire * r, y - r * 0.6, x - towardFire * r, y + r * 0.6);
    rock.addColorStop(0, front ? '#5a3a26' : '#6b3d1f');
    rock.addColorStop(0.35, '#1d1c22');
    rock.addColorStop(1, '#050507');
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, 0, 0, TAU);
    ctx.fill();
  }
}

// The logs and stones never move. Painting them (especially the glow in the
// logs' cracks) is slow, so it is done once for each size of fire and the two
// finished pictures are stamped on every frame: one behind the flames, one in front.
const bases = new Map();

function baseFor(size) {
  const key = Math.round(size);
  if (!bases.has(key)) {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const width = size * 1.5;
    const height = size * 0.72;
    const x = width / 2; // where the centre of the fire sits inside the picture
    const y = size * 0.44;
    const picture = (paint) => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      paint(ctx, (ux) => x + ux * size, (uy) => y - uy * size);
      return canvas;
    };
    bases.set(key, {
      width,
      height,
      x,
      y,
      back: picture((ctx, px, py) => {
        drawStones(ctx, px, py, size, false);
        drawLogs(ctx, x, y, size);
      }),
      front: picture((ctx, px, py) => drawStones(ctx, px, py, size, true)),
    });
  }
  return bases.get(key);
}

// ---------- Running a fire on its own canvas ----------

// Fills the canvas with a burning fire. Returns a function that puts it out.
// `heat`, if given, is asked every frame how hard the fire should burn (0 to 1).
export function lightFire(canvas, heat = () => 0) {
  const fire = createFire();
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let frame = null;
  let last = null;

  function fit() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function tick(now) {
    // Cap the step so a paused tab does not make the fire jump when it returns.
    const dt = Math.min((now - (last ?? now)) / 1000, 0.05);
    last = now;
    fire.step(dt, heat());
    ctx.clearRect(0, 0, width, height);
    fire.draw(ctx, width / 2, height * 0.86, Math.min(width * 0.8, height * 0.5));
    frame = requestAnimationFrame(tick);
  }

  fit();
  window.addEventListener('resize', fit);
  // Start with a fire already burning rather than one that has to catch.
  for (let i = 0; i < 60; i++) fire.step(1 / 60);
  frame = requestAnimationFrame(tick);

  return function putOut() {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', fit);
  };
}
