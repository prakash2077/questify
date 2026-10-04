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

// ---------- Penalty photos ----------
// Photos are too big for localStorage, so they live in IndexedDB, the browser's
// storage for files. Each record is { id, blob }, matched by id to state.proofs.

const PHOTO_DB = 'lifeAppProofs';
const PHOTO_STORE = 'photos';

function openPhotoDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePhoto(id, blob) {
  const db = await openPhotoDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put({ id, blob });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}

// Resolves with the photo's blob, or null if there is none.
export async function loadPhoto(id) {
  const db = await openPhotoDb();
  const record = await new Promise((resolve, reject) => {
    const request = db.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return record?.blob ?? null;
}

// Wipes everything the app has saved on this device, then starts over.
export async function resetAll() {
  localStorage.removeItem(KEY);
  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(PHOTO_DB);
    request.onsuccess = request.onerror = request.onblocked = resolve;
  });
  location.reload();
}
