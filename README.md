# Questify

A daily-quest app that turns your real goals into a game, in the style of *Solo Leveling*. Finish your quests before their deadlines. Miss one and the whole app locks into the **Penalty Zone** until you do the hard penalty you chose in advance and prove it with a photo.

Live: https://questifynow.vercel.app

It is a phone-sized web app. On a phone, open the link in Chrome, tap the menu, then **Add to Home Screen**, and it opens full-screen from its own icon, with or without internet.

## What works today

- **Setup**: date of birth, expected lifespan, one goal, and up to three daily quests, each with a deadline, a priority and a penalty.
- **Today**: your quests in priority order with the time left on each. They come back every day on their own.
- **Penalty Zone**: a missed deadline locks every other screen. The red screen shows your penalty, your goal, your remaining weeks as a grid, and a quote. A photo unlocks it; reloading does not.
- **Proof Gallery**: every penalty photo is kept, with its date, under Settings.
- **Installable and offline**: add it to your home screen and it opens without a connection.

Still to come: Focus mode with the bonfire, coins, XP and levels, the Shop and the Battleground, and the intro.

## Try the Penalty Zone in a minute

Open **Settings**, then under **Demo tools** tap **Make my next quest due in 1 minute**. Go back to Today and wait.

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

This checks the app's rules (the three-quest limit, priority order, what counts as a missed deadline, and more) without opening a browser.

## How it is built

- Plain HTML, CSS and JavaScript modules. No framework and no packages.
- Everything you enter stays on your device: the app's state in `localStorage`, penalty photos in `IndexedDB`. There are no accounts and no server.
- Sounds are made in code with the Web Audio API.

| Where | What |
|---|---|
| `index.html` | Every screen, as one section each |
| `js/main.js` | Starts the app and switches screens |
| `js/store.js` | Saves and loads everything |
| `js/quests.js` | The rules for quests and missed deadlines |
| `js/penalty.js` | The Penalty Zone: watching deadlines, locking, unlocking |
| `js/screens/` | One file per screen |
| `css/` | The black System look |
| `sw.js`, `manifest.webmanifest` | Offline support and Add to Home Screen |
| `devpost/` | The planning documents this was built from, and learning notes |

Built for the Build With AI: Basics hackathon on Devpost.
