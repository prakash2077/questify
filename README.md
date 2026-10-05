# Questify

A daily-quest app that turns your real goals into a game, in the style of *Solo Leveling*. Finish your quests before their deadlines to earn coins and XP, and spend the coins on a shadow army that gathers round your fire. Miss a quest and the whole app locks into the **Penalty Zone** until you do the hard penalty you chose in advance and prove it with a photo.

Live: https://questifynow.vercel.app

It is a phone-sized web app. On a phone, open the link in Chrome, tap the menu, then **Add to Home Screen**, and it opens full-screen from its own icon, with or without internet.

## What it does

- **Intro and Level 0**: a short animated open with sound, then a five-card demo for new players that uses sample data and saves nothing.
- **Setup**: date of birth, expected lifespan, one goal, and up to three daily quests, each with a deadline, a priority and a penalty.
- **Today**: your quests in priority order with the time left on each, plus your level, XP and coins. It greets you, says how the day is going, and shows a quote a day. Quests come back every day on their own.
- **Deadlines you can feel**: a quest turns amber in its last hour and red in its last ten minutes, when the countdown switches to seconds and the edges of every screen glow. In the last minute a clock ticks.
- **Focus**: a true-black screen with only the quest name and a crackling bonfire, which burns harder as the deadline nears.
- **Rewards**: finishing a quest pays XP and coins, with a flash, sparks, a jolt and a bell. Levels get steeper as you climb. A daily check-in gives a small bonus.
- **Shop and Battleground**: buy shadow soldiers and weapons, name each soldier, and watch them gather round your fire while demons rise against a blood moon and grow with your level.
- **Penalty Zone**: a missed deadline locks every other screen. The red screen shows your penalty, your goal, your remaining weeks as a grid, and a quote. A photo unlocks it; reloading does not.
- **Proof Gallery**: every penalty photo is kept, with its date, under Settings.
- **Settings**: six accent colours, a sound switch, and demo tools.
- **Feels like an app**: a tab bar, screens that slide, forms that rise from the bottom, and a sound for every touch.

## See everything in two minutes

Open **Settings** and use the **Demo tools**:

- **Add 100 test coins**, then visit the Shop and the Battleground.
- **Make my next quest due in 1 minute**, go back to Today, and wait for the Penalty Zone.
- **Reset all data** to start again from the intro.

## Run it on your computer

There is nothing to install and no build step.

```
npx serve .
```

Then open http://localhost:3000 and switch the browser to phone size.

## Check the rules

```
node tests/check-logic.mjs
```

This checks the app's rules (the three-quest limit, what counts as a missed deadline, rewards and levels, purchases, demon growth, and more) without opening a browser.

## How it is built

- Plain HTML, CSS and JavaScript modules. No framework, no packages, no build.
- Everything you enter stays on your device: the app's state in `localStorage`, penalty photos in `IndexedDB`. There are no accounts and no server.
- The bonfire is a particle system drawn on a canvas. The characters are hand-written SVG drawings.
- Every sound is made in code with the Web Audio API. There are no audio files.

| Where | What |
|---|---|
| `index.html` | Every screen, as one section each |
| `js/main.js` | Starts the app and switches screens |
| `js/store.js` | Saves and loads everything |
| `js/config.js` | Every tunable number: rewards, level curve, demons, timings |
| `js/quests.js` | The rules for quests and missed deadlines |
| `js/rewards.js` | The rules for coins, XP, levels and purchases |
| `js/penalty.js` | The Penalty Zone: watching deadlines, locking, unlocking |
| `js/fire.js` | The bonfire |
| `js/battleground.js` | The Battleground scene |
| `js/audio.js` | Every sound |
| `js/intro.js` | The intro and the Level 0 demo |
| `js/screens/` | One file per screen |
| `data/` | The Shop catalog and the quotes |
| `assets/sprites/` | The soldier, weapon and demon drawings |
| `tools/make-sprites.cjs` | Draws those sprites; run it after changing how they look |
| `css/` | The black System look |
| `sw.js`, `manifest.webmanifest` | Offline support and Add to Home Screen |
| `devpost/` | The planning documents this was built from, and learning notes |

Built for the Build With AI: Basics hackathon on Devpost.
