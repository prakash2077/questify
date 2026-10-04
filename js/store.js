// The app's memory. Everything is one object kept in the browser's localStorage,
// read once when the app opens and written after every change.

import { DEFAULT_ACCENT } from './config.js';

const KEY = 'lifeApp.v1';

function freshState() {
  return {
    profile: { dob: null, lifespanYears: null, setupDone: false },
    goal: null,
    quests: [],
    days: {},
    coins: 0,
    xp: 0,
    level: 1,
    army: [],
    settings: { accent: DEFAULT_ACCENT, muted: false },
    penalty: null,
    proofs: [],
  };
}

function load() {
  const fresh = freshState();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved === 'object') {
      return {
        ...fresh,
        ...saved,
        profile: { ...fresh.profile, ...saved.profile },
        settings: { ...fresh.settings, ...saved.settings },
      };
    }
  } catch {
    // Nothing saved yet, or the save is unreadable: start from the first-use flow.
  }
  return fresh;
}

let state = load();

export function getState() {
  return state;
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

// Make a change to the state and save it straight away.
export function update(change) {
  change(state);
  save();
}
