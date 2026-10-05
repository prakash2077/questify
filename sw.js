// Service worker: a small script the browser keeps running beside the app.
// It saves a copy of the app's files so Questify still opens with no internet.
//
// Strategy: network first. With a connection you always get the newest version
// (and the saved copy is refreshed); without one you get the saved copy.

const CACHE = 'questify-v1';

// Every file the app needs to start. Add new files here as the app grows;
// tests/check-logic.mjs fails if one is missing.
const APP_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/base.css',
  'css/screens.css',
  'js/main.js',
  'js/store.js',
  'js/config.js',
  'js/quests.js',
  'js/rewards.js',
  'js/penalty.js',
  'js/weeks-grid.js',
  'js/fire.js',
  'js/sprites.js',
  'js/battleground.js',
  'js/audio.js',
  'js/screens/setup.js',
  'js/screens/today.js',
  'js/screens/focus.js',
  'js/screens/shop.js',
  'js/screens/settings.js',
  'js/screens/gallery.js',
  'data/quotes.js',
  'data/catalog.js',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'assets/sprites/soldier-swordsman.svg',
  'assets/sprites/soldier-archer.svg',
  'assets/sprites/soldier-mage.svg',
  'assets/sprites/soldier-knight.svg',
  'assets/sprites/weapon-sword.svg',
  'assets/sprites/weapon-spear.svg',
  'assets/sprites/weapon-axe.svg',
  'assets/sprites/demon-imp.svg',
  'assets/sprites/demon-brute.svg',
];

// On install: save every app file, then take over straight away.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting()),
  );
});

// On activate: throw away caches left by older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

// On every request: try the network, fall back to the saved copy.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 'opaque' is how the Google Fonts stylesheet arrives; it is fine to keep.
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const saved = await caches.match(request, { ignoreSearch: true });
        if (saved) return saved;
        // Opening the app offline at any address still gets the app itself.
        if (request.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      }),
  );
});
