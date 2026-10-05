---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast. The learner also asked for learning notes to study later: add a section to `devpost/learning-notes.md` for every slice as it is built.

Resume note: all six slices are built. Final review: round 1 (dark look, cinematic sound) is accepted and live. A round 2 "intensity" pass was built on a guess, disliked ("vague and annoying"), and reverted; the app is back at the accepted version. Do not add effects or mechanics on a vague request again: the open item is the learner's answer to "name one concrete moment you find cool". The three phone questions (full-screen, sound after first tap, camera) are still unanswered. The learner pushes to GitHub themselves; the live link is https://questifynow.vercel.app.

## Slices

- [x] **1. You can set up your goal and quests and see them on Today**
  Becomes usable: Open the app, tap to begin, enter your date of birth, expected lifespan, a goal and up to three quests (name, deadline, priority, penalty). Today lists them highest priority first with their deadlines, you can tick one done, and it is all still there after closing and reopening.
  Why now: Everything else hangs off real quests. The Penalty Zone cannot be proven without a quest that has a deadline and a penalty, a goal, and a date of birth. This step also sets the black System look once, so every later screen inherits it.
  PRD ref: `prd.md > The Core Journey` (steps 1-3), `prd.md > Features and Behavior > Goals and Quests`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components > App Shell and Screen Router`, `spec.md > Components > Setup (Sign-up and First Goal)`, `spec.md > Components > Goals and Quests`, `spec.md > Components > Today Screen`, `spec.md > Data Model`, `spec.md > File Structure`, `spec.md > Look and Feel`
  Build: Scaffold the project per the spec's file structure (`index.html`, `css/base.css`, `css/screens.css`, `js/main.js`, `js/store.js`, `js/config.js`, `js/quests.js`, `js/screens/setup.js`, `js/screens/today.js`). Add the "Tap to begin" gate, the one-screen-at-a-time router, the Setup form, the three-quest limit with its message, add and remove quest, the Today list ordered by priority with a done tick, the "no quests yet" prompt, saving to `localStorage` under `lifeApp.v1`, and the black theme with System-style type and the `--accent` / `--danger` variables.
  Verify (mechanical): Run a Node check of `js/quests.js` (priority order, three-quest limit, a quest created after its deadline starts tomorrow). Serve the folder locally and drive it in headless Chrome at phone size: complete Setup, confirm Today shows the quests in priority order with deadlines, tick one, reload and confirm everything persisted, try a fourth quest and confirm the limit message, and confirm there are no console errors.
  Learner check: Run `npx serve .` in the project folder, open `http://localhost:3000` in your browser's phone-size mode, tap to begin, fill in Setup with a goal and two or three quests, then close the tab and open it again. Your quests should still be on Today in priority order. Say how the look and the font feel to you.
  Commit: `Add setup, quests and Today screen`

- [x] **2. Missing a quest locks the app into the Penalty Zone**
  Becomes usable: When a quest's deadline passes without a tick, the red Penalty Zone takes over the whole app and shows your penalty task, your goal, the weeks-left grid and a real quote. Reloading does not escape it. Submitting a photo (or the no-camera fallback) unlocks the app, and the photo can be found afterwards in Settings under Proof Gallery.
  Why now: This is the unique kernel, so it comes second, not last. It also carries the riskiest machinery (the deadline timer, a lock that survives a reload, the camera input, photo storage), and bad news about any of those should arrive now.
  PRD ref: `prd.md > The Core Journey` (step 8), `prd.md > Features and Behavior > Penalty Zone`, `prd.md > States and Boundaries` (Camera unavailable or permission denied)
  Spec ref: `spec.md > Components > Penalty Zone`, `spec.md > Components > Proof Gallery`, `spec.md > Components > Settings`, `spec.md > Components > Audio`, `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: Add `js/penalty.js` (check every 15 seconds and on every open, including deadlines missed on earlier days while closed, several misses handled one after another), the router lock while `state.penalty` exists, the red Penalty Zone screen, `js/weeks-grid.js`, `data/quotes.js` with about 20 real quotes and authors, the camera input with the photo saved to `IndexedDB`, the fallback (type "I did it" and hold for 5 seconds), the `proofs` record, a Settings screen with the Proof Gallery (`js/screens/settings.js`, `js/screens/gallery.js`) and labelled Demo tools ("make my next quest due in 1 minute", "reset all data"), and `js/audio.js` with the Penalty Zone sound.
  Verify (mechanical): Run a Node check of the missed-deadline logic (deadline passed and not ticked gives a penalty; ticked gives none; a miss on an earlier day while closed gives a penalty; a quest created after its deadline is not missed today). In headless Chrome: seed a quest whose deadline has passed and confirm the Penalty Zone shows the penalty task, goal, weeks grid and a quote; confirm no other screen can be reached and a reload stays locked; feed an image file to the camera input and confirm the app unlocks and the photo appears in the Proof Gallery from `IndexedDB`; confirm the fallback clears a penalty and is recorded as "no photo".
  Learner check: Open Settings, find Demo tools and tap "make my next quest due in 1 minute". Go back to Today, wait, and watch the app lock. Try reloading to escape. Then submit a photo and look for it in the Proof Gallery. Say whether the Penalty Zone feels motivating and heartwarming rather than harsh, and whether the quotes are ones you would want.
  Commit: `Add Penalty Zone with photo proof`

- [x] **3. The app is on your phone**
  Becomes usable: A real web link. On your phone you open it, tap "Add to Home Screen", and it opens full-screen from its own icon, even without internet. The camera opens for photo proof and sound plays after the first tap.
  Why now: The spec lists three phone behaviours it assumed but never checked, and the kernel leans on one of them (the camera). Proving them right after the kernel exists means that if the phone disagrees, the plan changes before four more screens are built on a wrong assumption. From here on, every check can happen on the real phone.
  PRD ref: `prd.md > What We're Building` (phone-sized web app), `prd.md > Features and Behavior > Penalty Zone`
  Spec ref: `spec.md > Stack`, `spec.md > Where It Runs and How Someone Tries It`, `spec.md > External Services and Dependencies`, `spec.md > Decisions and Open Issues`
  Build: Add `manifest.webmanifest`, the app icons in `assets/icons/`, `sw.js` (network first, falling back to the saved copy when offline, so new versions always show up), service worker registration in `js/main.js`, `README.md`, and a `.vercelignore` so the planning workspace is not served on the live site. The repo is already on GitHub (`prakash2077/questify`); the learner imports it into Vercel on their own account as described in the spec.
  Verify (mechanical): Fetch the live link and confirm `index.html`, `manifest.webmanifest`, `sw.js` and both icons return successfully with the right content types; confirm the manifest declares standalone display, the black theme and both icons; in headless Chrome on the live link confirm the service worker registers and the app still loads with the network switched off.
  Learner check: On your phone, open the link in Chrome, tap the menu, then "Add to Home Screen", and open the app from the new icon. Check three things: does it open full-screen with no browser bar, do you hear sound after tapping to begin, and does "Submit photo proof" open the camera when you trigger a penalty with the Demo tool?
  Commit: `Make the app installable and ready to deploy`

- [x] **4. Focus on a quest by the fire, finish it, and get rewarded**
  Becomes usable: Tapping Focus on a quest opens a true-black screen with only the quest name and a crackling bonfire. Checking it off awards coins and XP with sound and animation, the XP bar fills, and the level rises. A daily Check in gives a small XP bonus once a day.
  Why now: This is the reward half of the daily loop, and it produces the coins the Shop needs. The bonfire is the centrepiece of the whole app, so it is built once here and reused by the Battleground in the next step.
  PRD ref: `prd.md > The Core Journey` (steps 4, 5, 7), `prd.md > Features and Behavior > Focus Mode`, `prd.md > Features and Behavior > Coins, XP and Levels`
  Spec ref: `spec.md > Components > Focus Mode`, `spec.md > Components > Rewards: Coins, XP and Levels`, `spec.md > Components > Audio`, `spec.md > Components > Fire and Sprite Rendering`, `spec.md > Look and Feel`
  Build: Add `js/fire.js` (canvas particle bonfire with a flickering glow), `js/screens/focus.js`, `js/rewards.js` (coins and XP by priority, daily check-in, level worked out from XP using the curve in `js/config.js`), the coins / XP bar / level header on Today, the Check in button, the reward animation, and the check-off, coin and level-up sounds in `js/audio.js`.
  Verify (mechanical): Run a Node check of `js/rewards.js` (XP 10/20/30 and coins 5/10/15 by priority, check-in gives 5 XP once per day, level 1 to 2 needs 50 XP, each later level needs more than the one before, nothing is removed on a miss). In headless Chrome: tap Focus and confirm the screen shows only the quest name and a fire canvas whose pixels change between two frames; check the quest off and confirm coins and XP rise on screen and in storage; seed XP just under a threshold and confirm the level number increases.
  Learner check: Tap Focus on a quest and watch the fire for a few seconds. Check the quest off and listen for the reward. Tap Check in once, then again. Say whether the fire feels like a real bonfire, and what you would change about how it looks, moves or sounds.
  Commit: `Add Focus mode, bonfire and rewards`

- [x] **5. Spend coins on soldiers and watch your army gather on the Battleground**
  Becomes usable: The Shop lists soldiers and weapons with coin prices and blocks a purchase you cannot afford. You buy a soldier, name it, and it stands by your fire on the Battleground with its name. Weapons stick in the ground around the fire, demons loom behind and grow with your level, and the sound gets richer as the army grows.
  Why now: It needs the coins and the bonfire from the step before. It completes the core loop, so after this the whole day (quest, focus, reward, army, penalty) can be run end to end.
  PRD ref: `prd.md > The Core Journey` (steps 6-7), `prd.md > Features and Behavior > Shop and Army`, `prd.md > Features and Behavior > Battleground`
  Spec ref: `spec.md > Components > Shop and Army`, `spec.md > Components > Battleground`, `spec.md > Components > Fire and Sprite Rendering`, `spec.md > Components > Audio`, `spec.md > Look and Feel`
  Build: Add `data/catalog.js` (first soldier Sung Jinwoo), `js/screens/shop.js` with the soldier naming step, the SVG soldiers, weapons and demons in `assets/sprites/`, `js/sprites.js`, `js/battleground.js` (fire at the bottom, soldiers in a ring with names, weapons, demons, ambient bobbing loop), `demonsForLevel(level)` in `js/config.js`, the purchase sound and the Battleground sound layers, and an "add test coins" Demo tool in Settings.
  Verify (mechanical): Run a Node check of the purchase rules (blocked with too few coins, coins subtracted, soldier saved with its name) and of `demonsForLevel` (more or bigger demons at a higher level). In headless Chrome: with an empty army confirm the Battleground shows only the fire; try to buy with too few coins and confirm the message; add coins, buy and name a soldier and confirm it is saved and drawn; take screenshots at a low and a high level and inspect them for more soldiers after more purchases and larger or more demons at the higher level.
  Learner check: Use the Demo tool to add test coins, open the Shop, buy a soldier, name it, and open the Battleground. Buy one or two more and a weapon, and look again. Say how the soldiers and demons look and what you would change.
  Commit: `Add Shop, army and Battleground`

- [x] **6. First open feels like a game: intro, Level 0 demo and your accent colour**
  Becomes usable: A brand-new user taps to begin, sees the intro pop out of black with sound, swipes through a short Level 0 demo that uses sample data, and lands in Setup. In Settings you can change the accent colour for the whole app and mute the sound.
  Why now: The demo cards show the finished screens, so they can only be honest once those screens exist, and nothing earlier depends on them. This is the first impression for the demo video.
  PRD ref: `prd.md > The Core Journey` (step 1), `prd.md > Screens and Layout`, `prd.md > Look and Feel`, `prd.md > States and Boundaries` (First use)
  Spec ref: `spec.md > Components > Intro and Level 0 Demo`, `spec.md > Components > Settings`, `spec.md > Components > Audio`, `spec.md > Look and Feel`
  Build: Add `js/intro.js` (the intro animation and sound, then four or five demo cards with clearly labelled sample data that is never saved), the accent colour picker (sets `--accent` and saves it), the mute toggle, and update the service worker's file list and `README.md` for the finished app.
  Verify (mechanical): In headless Chrome with empty storage: tap to begin and confirm the intro, then the demo cards, then Setup, and that storage holds no progress after the demo. With Setup already done, confirm reopening goes to Today. Change the accent and confirm the `--accent` value changes and survives a reload. Then run the whole core journey front to back (setup, focus, check-off, shop, Battleground, missed quest, photo unlock) and confirm there are no console errors.
  Learner check: In Settings use "reset all data", then open the app as if for the first time and go through the intro and the demo. Pick a different accent colour and look at a few screens. Say whether the first ten seconds feel the way you pictured.
  Commit: `Add intro, Level 0 demo and accent setting`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 3, on your phone: Setup, Today, the Penalty Zone with photo proof, and the overall look and font
- [ ] Fire and reward feel explored — after slice 4, before the Battleground and intro are built around the same bonfire and sound style
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

Verification before the review: `node tests/check-logic.mjs` passes 39 rule checks, and the headless-Chrome walkthroughs pass 261 checks on localhost, including the whole core journey in one run. Slices 1 to 5 are live and the live link passes its install and offline checks; slice 6 is committed and waits for the learner to push.

Still unproven, because only a real phone can show them: the installed app opening full-screen, sound after the first tap, and the camera opening for photo proof.

Decisions made in the build that the learner has not confirmed yet: one penalty per quest after a long absence; the 21 quotes and their authors (written from memory, not looked up); the Shop catalog and prices; the intro playing on every open; the font (Rajdhani) and the name Questify.

Round 1 feedback from the learner: "the app looks like some small kids game"; make it aesthetic, take inspiration from Pinterest, get the best designs and sprites possible, and make the sound cinematic.

- [x] Restyle from cute to dark and cinematic — soldiers, demons and weapons redrawn as silhouettes with glowing eyes; Battleground gains a blood moon, fog, dust and a rising aura; the bonfire loses its cartoon outlines; windows become cut-corner glass in glowing frames; coins become gold gems. Implemented, 261 browser checks pass, committed. The learner pushed it, tried it live and replied "GREAT WORK!".
- [x] Cinematic sound — every sound rebuilt from impacts, bells, pads, low brass and a choir through a generated reverb; all nine effects and the ambience were rendered offline and measured as audible and below clipping. Committed, pushed and accepted by the learner with the restyle.

Round 2 feedback from the learner: "GREAT WORK! NOW CAN WE MAKE THIS EVEN MORE GAMIFIED AND INTENSE!!"

- [x] An "intensity" pass was built without first asking what intense meant (commit `6c85fc9`): full-screen reward sequence with flash, sparks, screen shake and vibration; red glowing screen edges and a ticking clock near a deadline; an Arise sequence; lightning. It passed every check and was pushed.

Round 3 feedback from the learner: "the things feel vague and annoying now, do something cool".

- [x] The intensity pass was reverted in full — the app is back to exactly the version the learner approved in round 1 (`721e330`), confirmed file for file and by rerunning every check. The reverted work is still in git history if any single piece is wanted back.
- [ ] "Do something cool" — not built. Two vague requests in a row produced one miss, so the learner was asked for one concrete moment they find cool before anything else is made.

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: not started
Route and stops: not started
Edit outcome: not started
Reflection: not started
Activity mode: not started

## Revisions

- Slice 3 no longer creates the GitHub repo, and the Vercel import is the learner's own step — the learner created the public repo `prakash2077/questify` and pushed a first commit before the build began, and chose to do the Vercel hosting themselves.
- Each quest now also stores `startsOn` (`spec.md > Data Model`) — the rule "a quest created after its deadline begins tomorrow" cannot be worked out from `createdOn` alone, because that holds only the date, not the time of day.
- Added `tests/check-logic.mjs` (`spec.md > File Structure`) — every slice's "Node check" needs somewhere to live, and keeping it in the repo lets it be rerun after later slices change the same rules. It uses Node's built-in `assert`; no packages.
- The app shows the name "Questify" on the opening screen and browser tab — taken from the repo name the learner chose; the PRD and spec titles still say "working title" until the learner confirms it.
- A quest missed several days in a row while the app was closed gives one penalty per quest (the most recent missed day), not one per day — the spec did not say what happens after a long absence, and a queue of penalties on return would work against the kernel's "motivate without being harsh". Recorded in `spec.md > Components > Penalty Zone` as derived; the learner still needs to confirm it.
- The Demo tool moves only today's deadline (`quest.demo`) instead of rewriting the quest — otherwise using it once would leave a real quest permanently due at an odd time. Proof records also keep the quest name and penalty text (`spec.md > Data Model`).
- The app also checks at the exact moment the next deadline passes, on top of the 15-second check — the lock otherwise lagged the deadline by up to 15 seconds, which reads as a bug in a demo.
- Slice 3 was verified on localhost first and committed before its live-link check — the live link only updates after a push, and pushing is the learner's step, so the live check and the phone check happen together at the hands-on checkpoint.
- The early phone check is being done together with the fire checkpoint after slice 4 instead of straight after slice 3 — the learner pushed, the live link passed, and they asked to keep building before trying the phone; the checkpoint box stays unticked until they report.
- The two mid-build hands-on checkpoints (phone after slice 3, fire after slice 4) are folded into the final review — the learner chose fast mode to finish quickly and, when each pause came up, asked to continue. Their boxes are ticked only when the learner reports on those items.
- The level curve keeps the spec's numbers (50 XP for level 1, 1.33 times more per level) — checked in the build: a full first day reaches level 2 and level 10 takes about ten days. The spec's other note, "levels 1 to 3 in about a day", conflicts with the ten-day target under one formula, so it was not applied; both numbers are in `js/config.js`.
- The Shop catalog was proposed in the build, as the spec left it open: four soldiers (20, 35, 50, 80 coins) and three weapons (10, 15, 25) — priced against the 30 coins a full day of quests earns, so the first soldier is reachable on day one. The learner can change any of it in `data/catalog.js`.
- "The first soldier is Sung Jinwoo" is implemented as the suggested name for the first soldier bought, which the learner can overtype — the spec did not say whether it was a soldier type or a name, and naming every soldier is a PRD requirement.
- Level 1 has no demons; one arrives per level up to six, then they keep growing — needed so the PRD criterion "at the start, only the fire is shown" and "demons are larger or more numerous at a higher level" both hold.
- Check in, Shop and Battleground sit in one row of buttons under the coins and XP on Today — three separate buttons pushed the quest list below the fold on a phone.
- The intro plays on every open (not only the first) and can be skipped with a tap; a locked player goes straight to the Penalty Zone; anyone who has set "reduce motion" on their device skips it — the PRD lists the intro as a screen that leads "onward to Today", and the spec did not say what a returning or locked player sees.
- The accent picker offers six fixed colours rather than a free colour wheel — a free choice can pick colours that are unreadable on black; six tested ones cannot. They are a list in `js/config.js`.
- The look changed from "thick, clean, Duolingo-style, cute" to dark silhouettes and cinematic sound — on seeing the built app the learner said it looked like a small children's game. `prd.md > Look and Feel`, `prd.md > Product Decisions`, `spec.md > Look and Feel`, `spec.md > Stack` and one line of `scope.md > Inspiration & Identity` were updated to match. The unique kernel is untouched.
- Pinterest could not be browsed for references as the learner asked — it requires signing in, which the agent cannot do. The direction was taken from the pins visible behind the sign-in wall (dark glass System windows in glowing frames) and the learner's own scope notes. The learner can paste links to specific pins if they want something closer.
- The sprites are now generated by `tools/make-sprites.cjs` (`spec.md > File Structure`) — the four soldiers share a body, eyes and gradients, and one script is easier to restyle than nine hand-edited files. The app still only loads the finished SVG files; there is no build step.
- An intensity pass (commit `6c85fc9`) was built and then reverted — it was built from the single word "intense" without asking what the learner pictured, and the result felt "vague and annoying" to them. The agent should have asked first, as the final-review step says. Reverting cost one commit because every step had been committed separately.
- New game mechanics were still not added on the strength of "more gamified" or "do something cool" — each would be a new rule in the PRD, and the scope document already parks mini-games, attacks and online challenges under Later. The learner has been asked for one concrete moment to build toward.
