---
doc: spec
status: approved
---

# Solo Leveling-Style Life App (working title) — Technical Spec

Blueprint for `prd.md` (approved) and `scope.md > The POC Boundary`. Learner choices are marked **[you chose]**; things I derived from those choices are marked **[derived]**; things I proposed that you accepted are marked **[accepted]**.

## How This Works, In Plain Language
The app is a **website that behaves like a phone app**. It is called a Progressive Web App (PWA): a normal website you open on your phone and tap "Add to Home Screen" for, after which it opens full-screen with no browser bar and its own icon.

It is built from three plain ingredients, with no framework and no server:
- **HTML, CSS and JavaScript** for the screens (Today, Focus, Shop, Battleground, Penalty Zone, Settings). Each screen is one section of the page, and JavaScript shows one at a time.
- **A canvas** (a drawing surface the browser animates 60 times a second) for the bonfire, the soldiers and the demons.
- **The phone's own storage** as the memory. Your quests, coins, XP, level and soldiers are saved as a small text note (`localStorage`, a sticky note the browser keeps for this site). The Penalty Zone photos are kept in `IndexedDB`, a bigger drawer in the browser for files. Nothing leaves the phone. There are no accounts and no database.

Vercel (a free hosting service) keeps a copy of the app at a web link so your phone can open it. Every time you push new code to GitHub, Vercel updates the link.

Why this shape and not something bigger: your proof of concept is about the feel of the loop (quest, fire, coins, army, Penalty Zone), not about accounts or syncing. Keeping everything on the device means there are no keys, no extra services and nothing to break during the demo.

If you later want a real Android app, the same files can be wrapped with **Capacitor** (a tool that puts a web app inside an Android app shell, opened in your Android Studio). That is a later step, not part of this build.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **First open.** The browser loads `index.html`. A black "Tap to begin" screen appears first, because phones only allow sound after a tap. Your tap starts the intro animation and sound (`intro.js`). The app sees nothing saved in storage, so it goes on to the Level 0 demo and Setup. *(`prd.md > Screens and Layout`)*
2. **Sign-up and first goal.** You enter date of birth and expected lifespan and name a goal with quests (name, deadline time, priority, penalty). `store.js` writes it all into `localStorage`. The weeks left are calculated from those two numbers.
3. **Today.** Each time the app opens, `quests.js` looks at your recurring quests and lists today's (max 3) ordered by priority, each with a deadline.
4. **Focus.** Tapping Focus shows the black screen with the quest name. `fire.js` draws the animated bonfire on the canvas.
5. **Finish.** Checking off marks the quest done for today in storage. `rewards.js` adds coins and XP (more XP for higher priority), `audio.js` plays the sound, and the level is recalculated.
6. **Grow the army.** In the Shop you spend coins. `store.js` subtracts the coins and saves the new soldier with the name you typed. The Battleground reads the soldier list and draws each one around the fire.
7. **Level up.** When XP passes the threshold, the level goes up. The Battleground reads the level and draws bigger or more demons.
8. **Miss a quest.** A timer (`penalty.js`) checks every 15 seconds while the app is open, and once on every open. If a deadline time has passed with no check-off, it saves a `penalty` note in storage and shows the red Penalty Zone, which blocks all other screens. Because the note is saved, closing or reloading the app does not escape it.
9. **Clear it.** You do the penalty and take a photo. The photo is saved in `IndexedDB`, the `penalty` note is cleared, and the app unlocks.

## Stack
| Piece | Choice | Why / tradeoff |
|---|---|---|
| App type | **Progressive Web App**, installable via "Add to Home Screen" **[you chose]** | Fastest path to seeing it on your phone, and no Kotlin to learn. Tradeoff: feels very close to native but cannot send reliable background notifications. |
| Language | Plain **JavaScript (ES modules)**, HTML, CSS **[derived]** | No build step and no framework, so errors are readable and every file is in your repo as written. |
| Animation | **HTML canvas** (2D) **[derived]** | Handles a bonfire particle effect and a handful of sprites smoothly on a phone. |
| Sprites | Hand-made **SVG** files, drawn onto the canvas **[derived]** | Dark silhouettes with glowing eyes scale crisply on any phone. The AI writes them as code (`tools/make-sprites.cjs`); you direct the look. |
| Sound | **Web Audio API**, with sounds synthesized in code **[derived]** | No audio files to find or license. A generated reverb and layered instruments make them cinematic rather than beeps. Real audio files can still be added later in `assets/sounds/`. |
| Saved data | `localStorage` (state) + `IndexedDB` (photos) **[you chose: data stays on device]** | No accounts, nothing to configure. Tradeoff: clearing the browser data wipes it, and there is no sync across devices. |
| Offline | A small **service worker** and `manifest.webmanifest` **[derived]** | Makes it installable and lets it open without internet. |
| Hosting | **Vercel** static site, deployed from the GitHub repo **[you chose]** | Free, gives an `https` link (needed for install and camera). |
| Camera | `<input type="file" accept="image/*" capture="environment">` **[derived]** | Opens the phone's camera app with no permission pop-up code. Simplest and most reliable. |

Docs:
- PWA basics: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- Web app manifest: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest
- Service worker: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- Canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- Web Audio: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- `capture` attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture
- Vercel static deploys: https://vercel.com/docs/deployments/overview
- Capacitor (later): https://capacitorjs.com/docs

**Not verified yet, check early in the build:** (1) that `capture` opens the camera on your phone's browser, (2) that sound plays after the first tap on your phone, (3) that "Add to Home Screen" gives a full-screen app. I reasoned these from general knowledge and did not look them up.

## Where It Runs and How Someone Tries It
- **Runtime:** the phone's browser (Chrome on Android recommended), or a desktop browser at phone size for quick testing.
- **No API keys and no accounts** are needed in the app.
- **Local testing on the computer:** run `npx serve .` (or `python -m http.server 8000`) in the project folder and open `http://localhost:3000` (or `:8000`) in the browser, using the browser's phone-size mode. `localhost` is treated as secure, so the camera and service worker work.
- **On your phone:** open the Vercel link, tap the browser menu, then "Add to Home Screen". Open the app from the new icon.
- **Required demo recording:** screen-record the phone while running the Core Journey. Show the intro, add a quest, Focus, check-off, Shop purchase, the Battleground, then let a short deadline pass to show the Penalty Zone and photo unlock. A **Settings > Demo tools** button (for example "Make my next quest due in 1 minute") will make this practical. It is labelled as a demo aid.
- **Submission needs both** the demo video and a **public GitHub repository** **[you chose: public]**. The Vercel link is an extra, not a replacement.
- **Deploy steps (Vercel):** push the repo to GitHub, then on vercel.com choose "Add New Project", import the repo, pick the "Other" preset with no build command and the root as the output directory, and click Deploy. The free Hobby plan is enough.

## Look and Feel
Carried forward from `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`, with no new design interview.
- **Colours:** true black `#000000` background (AMOLED). Default accent electric blue, switchable in Settings. The Penalty Zone is red. Colours are CSS variables (`--accent`, `--danger`) so the accent switch changes every screen at once.
- **Typography:** a clean, sharp, System-window-style look close to the *Solo Leveling* System UI: wide-tracked uppercase headings, thin glowing borders on panels, and a small caps feel. Fonts come from Google Fonts, picked during the build to match the anime. A system fallback font is used if offline. **Your call on the final font in review of the build.**
- **Energy:** cinematic and game-like, but each screen is simple with one clear action. Phone-first, a single column, large tap targets.
- **Characters:** dark silhouettes lit along one edge, with glowing eyes. Shadow soldiers carry a cold blue-violet aura; demons are horned busts with red eyes that rise against a blood moon. No cartoon outlines. The drawings are generated by `tools/make-sprites.cjs`, which is the place to change them.
- **Windows:** dark glass with cut corners inside a thin glowing frame, a title plate with a line trailing off either side, and buttons with corner brackets. Coins are small cut gold gems.
- **Fire:** a crackling bonfire, with particles and a flickering glow drawn on the canvas. It is the centrepiece of Focus and the Battleground.
- **Sound:** cinematic, still synthesized in code. Everything passes through a reverb and a compressor. The effects are built from a few instruments (impact, bell, pad, low brass, choir) and play at key moments (intro, check-off, coins, level-up, purchase, Penalty Zone). The Battleground adds a layer per few soldiers: drone, a second note, wind, war drums.
- **Copy tone:** motivating and heartwarming, never shaming.
- **What the stack can't do:** it cannot match a native 3D intro. The "3D-looking" intro will be a CSS/canvas effect (text scaling out of black with depth and glow), not true 3D.

## Components
Each heading below is what `5-build` will point at.

### App Shell and Screen Router
Loads `index.html`, shows exactly one screen at a time, handles the "Tap to begin" gate, and enforces the lock: if `state.penalty` exists, only the Penalty Zone can be shown. Registers the service worker.
PRD ref: `prd.md > Screens and Layout`.

### Intro and Level 0 Demo
A short animated open with sound (after the tap) on every open, skippable with a tap and skipped entirely for a locked player or when the device asks for reduced motion. On first use it is followed by a five-card walkthrough (quests, Focus, army, Penalty Zone) using clearly labelled **sample data** that is never saved as real progress. Level 0 ends in Setup.
PRD ref: `prd.md > The Core Journey` (step 1), `prd.md > States and Boundaries > First use`.

### Setup (Sign-up and First Goal)
Collects date of birth, expected lifespan (years), a goal name, and its quests. Shown once. Weeks left = `(lifespan * 52) - weeks lived`.
PRD ref: `prd.md > The Core Journey`, `prd.md > Goals and Quests`.

### Goals and Quests
A goal holds recurring daily quests, each with name, deadline time (`HH:MM`), priority (1 to 3), and a penalty task. The limit is **3 active quests in total**, which gives a maximum of 3 per day. Adding a fourth shows the message "Three is the most you can do consistently. Remove one first." Quests repeat every day automatically; a quest created after its deadline today begins tomorrow. There is no edit or delete screen beyond a small remove button.
PRD ref: `prd.md > Features and Behavior > Goals and Quests`.

### Today Screen
Lists today's quests ordered by priority with deadline, a Focus button, and a done tick. The header shows coins, XP bar and level. It has buttons to the Shop, Battleground and Settings, and a **Check in** button (see Rewards). If there are no quests, it shows a prompt to add one.
PRD ref: `prd.md > Screens and Layout > Today`, `prd.md > States and Boundaries > No quests yet today`.

### Tension and Big Moments
Added in the final review. None of it changes a rule; it changes how the rules feel.
- **Tension** comes from one place: `feelTension` in `penalty.js` runs once a second, finds the next deadline, and sets `body[data-tension]` to `none`, `near` (last ten minutes) or `critical` (last minute). CSS turns that into a red glow at the screen edges on every screen; in the last minute it also plays a ticking sound. The thresholds are `TENSION_*` in `config.js`.
- **Today** updates each open quest's countdown, time bar and mood (`data-urgency`) in place once a second, without rebuilding the list.
- **The reward sequence** is `celebrate` in `main.js`: flash, ring, sparks on a canvas, a shake of `#app`, a vibration, and the sounds. `big` selects the gold version.
- **Arise** is `arise` in `main.js`, shown for about two and a half seconds before the "joined your army" message.
- **Reduced motion:** anyone whose device asks for less motion gets none of the shaking, sparks or Arise sequence.
PRD ref: `prd.md > Look and Feel`.

### Focus Mode
Full-screen true black with only the quest name, the canvas bonfire, and a check-off control. It reuses `fire.js`.
PRD ref: `prd.md > Features and Behavior > Focus Mode`.

### Rewards: Coins, XP and Levels
Check-off awards coins and XP, with a sound and a small animation.
- **XP per quest:** priority 1 = 10, priority 2 = 20, priority 3 = 30. **Coins:** priority 1 = 5, 2 = 10, 3 = 15.
- **Daily check-in** **[accepted]**: the first tap each day gives 5 XP, less than any quest. Once per day.
- **Level curve** **[derived]:** XP needed to go from level `n` to `n+1` is `round(50 * 1.33^(n-1))`. That gives Level 1 to 2 in 50 XP (under a day) and Level 10 to 11 in about 650 XP, which is about ten days of steady work at roughly 60 XP a day. These numbers are tunable in `config.js` and will be checked in the build.
- Missing a quest never removes XP or coins.
PRD ref: `prd.md > Features and Behavior > Coins, XP and Levels`.

### Shop and Army
A list from `catalog.js` of soldiers and weapons with coin prices: Shadow Swordsman 20, Archer 35, Mage 50, Knight 80; Iron Sword 10, War Spear 15, Battle Axe 25. The first soldier you buy is offered the name **Sung Jinwoo**, which you can change. Buying checks coins (blocks with a message if short), asks for a name for soldiers, saves the item, and plays a sound. **Weapons** are stuck into the ground around the fire on the Battleground.
PRD ref: `prd.md > Features and Behavior > Shop and Army`.

### Battleground
Full-screen canvas: fire at the bottom, owned soldiers placed in a ring around it with their names, demons in the background. The demon count and size grow with level (`demonsForLevel(level)` in `config.js`). Everything is an ambient loop (bobbing, swaying); there is no combat. At the start only the fire shows: level 1 has no demons, one arrives per level up to six, and after that they keep growing. `audio.js` adds a sound layer for every few soldiers.
PRD ref: `prd.md > Features and Behavior > Battleground`.

### Penalty Zone
Triggered by `penalty.js` when a quest's deadline time passes without a check-off today, or when the app opens and finds a deadline missed on an earlier day while closed. It saves `state.penalty = {questId, date}` and then locks the app. The red full-screen shows:
- the pre-chosen penalty task,
- the goal name,
- the **weeks-left grid**, a canvas of 52 columns by lifespan-years rows, with lived weeks dim and remaining weeks lit,
- a random quote from `quotes.js`,
- **Submit photo proof**, which opens the camera input; on a photo the image is stored in `IndexedDB`, the penalty clears, and the app unlocks.
- **Fallback (no camera)** **[accepted]**: a small link, "Can't use the camera?", asks the user to type "I did it" and hold a button for 5 seconds, which also clears the penalty (recorded as "no photo").
- If several quests were missed, they are handled one after another.
- A quest missed on several days in a row while the app was closed gives **one** penalty, for the most recent missed day. Clearing it also answers for the days before it. **[derived, learner to confirm]**
- A tick only counts before the deadline. Tapping the tick after the deadline has passed locks the app instead.
- While the app is open it checks every 15 seconds, and also at the exact moment the next deadline passes and whenever the app comes back to the foreground.
PRD ref: `prd.md > Features and Behavior > Penalty Zone`, `prd.md > States and Boundaries > Camera unavailable or permission denied`.

### Proof Gallery
Under Settings, a simple grid of past penalty photos with their dates, so "the photo is kept and can be seen afterwards" is met.
PRD ref: `prd.md > Features and Behavior > Penalty Zone` (last criterion).

### Settings
Accent colour picker with six colours (sets `--accent` and saves it), a sound on/off switch, the Proof Gallery, and **Demo tools** (labelled): set the next quest due in 1 minute, add test coins, and reset all data.
PRD ref: `prd.md > Screens and Layout > Settings`, `prd.md > Look and Feel`.

### Audio
`audio.js` builds each effect from the Web Audio API (oscillators and noise), starts only after the first tap, and has a mute option in Settings.
PRD ref: `prd.md > Look and Feel` (sound effects).

### Fire and Sprite Rendering
`fire.js` is a particle bonfire reused by Focus and the Battleground. `sprites.js` loads the SVG soldiers and demons and draws them on the Battleground canvas with a looping bob animation.
PRD ref: `prd.md > Look and Feel`, `prd.md > Features and Behavior > Battleground`.

## Data Model
All state is one object saved in `localStorage` under the key `lifeApp.v1`. It is read on open and written after every change. Photos are separate.

```js
{
  profile:  { dob: "2005-03-14", lifespanYears: 80, setupDone: true },
  goal:     { id, name },
  quests:   [ { id, name, deadline: "21:00", priority: 2, penalty: "Write 100 lines", createdOn: "2026-10-04", startsOn: "2026-10-04" } ],
  days:     { "2026-10-04": { done: [questId], checkedIn: true } },
  coins: 0, xp: 0, level: 1,
  army:     [ { id, catalogId, name } ],
  settings: { accent: "#2f7bff", muted: false },
  penalty:  null | { questId, date },
  proofs:   [ { id, date, questId, questName, penalty, clearedOn, hasPhoto: true } ]
}
```
- **`proofs`** also keep the quest's name and penalty text as they were at the time, so the Proof Gallery can still caption a photo after the quest is removed.
- **`quest.demo`** (`{ date, time }`) exists only after the Demo tool "make my next quest due in 1 minute" is used. It moves the deadline for that one day and leaves the real daily deadline alone.
- **Where it lives / how it updates / when you return:** state is in `localStorage`, updated by `store.js` on every action, and fully restored on reopen. This includes a pending `penalty`, which keeps the lock. Level is recomputed from XP.
- **Photos:** `IndexedDB` database `lifeAppProofs`, store `photos`, one record per proof `{ id, blob }`, linked by `id` from `state.proofs`.
- **Dates** are the device's local date as `YYYY-MM-DD`. Deadlines are local times.
- **`startsOn`** is the first day a quest counts. It is today, or tomorrow when the quest was created after its deadline had already passed.
- **Data flow:** your input, to `store.js`, to `localStorage` (or `IndexedDB`), to the screens that read it. Nothing is sent to a server.

## File Structure
```
life-app/                        # repo root; also the Vercel output directory
├── index.html                   # the single page; holds every screen as a section
├── manifest.webmanifest         # app name, icons, black theme: makes it installable
├── sw.js                        # service worker: caches files so it opens offline
├── css/
│   ├── base.css                 # black theme, CSS variables (--accent, --danger), type
│   └── screens.css              # layout for each screen
├── js/
│   ├── main.js                  # starts the app, router, registers service worker
│   ├── store.js                 # load/save state (localStorage), photo storage (IndexedDB)
│   ├── config.js                # XP/coin values, level curve, demon growth numbers
│   ├── quests.js                # goals, recurring quests, 3-per-day rule, today's list
│   ├── rewards.js               # coins, XP, levels, daily check-in
│   ├── penalty.js               # deadline timer, lock, photo proof, fallback
│   ├── fire.js                  # canvas bonfire particles
│   ├── battleground.js          # draws fire, soldiers, weapons, demons
│   ├── sprites.js               # loads SVG sprites for canvas drawing
│   ├── audio.js                 # synthesized sound effects (Web Audio)
│   ├── intro.js                 # intro animation + Level 0 demo cards
│   ├── weeks-grid.js            # weeks-left grid for the Penalty Zone
│   └── screens/                 # one file per screen's behaviour
│       ├── setup.js
│       ├── today.js
│       ├── focus.js
│       ├── shop.js
│       ├── settings.js
│       └── gallery.js
├── data/
│   ├── catalog.js               # shop items: soldiers, weapons, prices
│   └── quotes.js                # ~20 quotes with authors
├── assets/
│   ├── sprites/                 # SVG soldiers, demons, weapons (drawn by the AI, you direct)
│   ├── icons/                   # app icons (192px, 512px) for Add to Home Screen
│   └── sounds/                  # optional real audio files later (empty at first)
├── tools/
│   └── make-sprites.cjs         # draws every sprite in assets/sprites/: node tools/make-sprites.cjs
├── tests/
│   └── check-logic.mjs          # checks the app's rules without a browser: node tests/check-logic.mjs
├── devpost/                     # Devpost learning workspace
├── README.md                    # what it is + how to run (needed for the public repo)
├── .vercelignore                # keeps devpost/, tests/ and the course skills off the live site
└── .gitignore
```

## External Services and Dependencies
- **GitHub** (public repo), required for submission. Free. https://docs.github.com
- **Vercel** (hosting), free Hobby plan, no keys needed in the app. Deploys on every push. https://vercel.com/docs
- **Google Fonts** (optional, for the System-style font). Loaded by a CSS link; falls back to a system font offline. https://fonts.google.com
- **No other services, APIs, keys or paid dependencies.** There are no npm packages in the app. `npx serve` is only a local helper.

## Important Failure Modes
- **No sound, because the browser blocks audio before a tap** → the "Tap to begin" screen unlocks audio first. A mute toggle is in Settings.
- **Camera does not open or the user cancels** → the "Can't use the camera?" fallback (type "I did it" and hold 5 seconds) clears the penalty.
- **Storage is empty or cleared** (new phone, cleared browser data) → the app shows the first-use flow again. Settings > Demo tools has a reset. There is no backup in this version.
- **Deadline passes while the app is closed** → on next open, `penalty.js` checks missed deadlines and locks immediately. The app cannot lock at that moment, since a PWA cannot run in the background.
- **Phone clock changes** → the app trusts the device time, the same trust model as the rest of the PRD (`prd.md > States and Boundaries > Trust`).

## What Was Simplified and Why
- **Everything stored on the device** instead of accounts and a database. This keeps the build free of keys and failure points. The fuller version would add sign-in and a hosted database.
- **Synthesized sound** instead of recorded audio. It avoids licensing and file hunting. Real sound files can be dropped in later.
- **Ambient loop Battleground** instead of real combat, as already decided in the PRD.
- **Three active quests in total** as the way to enforce "max 3 per day" with recurring quests. A fuller version would let quests have specific days.
- **No background alerts.** A PWA cannot reliably notify when closed. Capacitor on Android would add this.
- **Quotes baked into a file** instead of fetched from the internet.
- **Level 0 demo uses sample data** and does not touch real progress.

## Decisions and Open Issues
**Decisions**
- **Progressive Web App now, Capacitor Android later** **[you chose]**. Tradeoff: no native feel or background alerts yet; no Kotlin learning needed.
- **Vercel hosting, public GitHub repo** **[you chose]**.
- **Screen-recording the phone for the demo** **[you chose]**.
- **Data stays on the device** **[you chose, from the PRD assumption]**.
- **No-camera fallback: type "I did it" and hold 5 seconds** **[accepted]**.
- **Daily check-in: one tap per day, 5 XP** **[accepted]**.
- **About 20 baked-in real quotes** **[accepted]**.
- **Plain JS, canvas, SVG sprites, synthesized sound, `capture` input for the camera** **[derived]** from the above. They follow from the PWA choice and are implementation details.

**Learner uncertainty:** none was identified during planning. You were comfortable with the PWA tradeoff and the data approach. The one question you raised (whether you can move to Android later) was answered: yes, via Capacitor, which reuses this code.

**Open / to check**
- The three unverified phone behaviours listed under Stack, tested in the first build step.
- The exact XP and coin numbers and the level curve; tune during the build so levels 1-3 come in about a day.
- The final font, the intro's exact look, and the list of soldiers and weapons with prices (catalog). The look is your call as the build goes.
- **Project name** is still the working title (`prd.md > Open Questions`).
- Where the 20 quotes come from; the AI will propose a set with authors, and you can accept or swap them.
- Level 0 demo: the exact cards are decided in the build.
