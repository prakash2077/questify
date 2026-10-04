// Weeks-left maths and the weeks-left grid: one dot per week of a life,
// 52 to a row, one row per year.

import { WEEKS_PER_YEAR } from './config.js';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function weeksTotal(lifespanYears) {
  return lifespanYears * WEEKS_PER_YEAR;
}

export function weeksLived(dob, now = new Date()) {
  const [y, m, d] = dob.split('-').map(Number);
  return Math.max(0, Math.floor((now - new Date(y, m - 1, d)) / MS_PER_WEEK));
}

export function weeksLeft(profile, now = new Date()) {
  return Math.max(0, weeksTotal(profile.lifespanYears) - weeksLived(profile.dob, now));
}

// Draws the grid: lived weeks dim, the current week bright, remaining weeks lit.
export function drawWeeksGrid(canvas, profile, now = new Date()) {
  const rows = profile.lifespanYears;
  const lived = Math.min(weeksLived(profile.dob, now), weeksTotal(rows));
  const cell = canvas.clientWidth / WEEKS_PER_YEAR;
  const dot = cell * 0.62;

  // Match the canvas to the screen's pixel density so the dots stay crisp.
  const scale = window.devicePixelRatio || 1;
  canvas.style.height = `${cell * rows}px`;
  canvas.width = Math.round(canvas.clientWidth * scale);
  canvas.height = Math.round(cell * rows * scale);

  const style = getComputedStyle(canvas);
  const colours = {
    lived: style.getPropertyValue('--week-lived'),
    left: style.getPropertyValue('--week-left'),
    now: style.getPropertyValue('--week-now'),
  };

  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  for (let week = 0; week < weeksTotal(rows); week++) {
    const x = (week % WEEKS_PER_YEAR) * cell + (cell - dot) / 2;
    const y = Math.floor(week / WEEKS_PER_YEAR) * cell + (cell - dot) / 2;
    if (week === lived) {
      ctx.fillStyle = colours.now;
      ctx.fillRect(x - dot * 0.3, y - dot * 0.3, dot * 1.6, dot * 1.6);
    } else {
      ctx.fillStyle = week < lived ? colours.lived : colours.left;
      ctx.fillRect(x, y, dot, dot);
    }
  }
}
