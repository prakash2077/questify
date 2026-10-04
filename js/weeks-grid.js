// Weeks-left maths, from date of birth and expected lifespan.

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
