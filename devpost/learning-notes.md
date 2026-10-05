# Questify learning notes

Written while the app was being built, one section per build step, so you can study it later at your own pace. Each section says what the step added, how it works, the ideas worth taking away, how it was checked, and a few small experiments to try yourself.

Read it next to the code. File names like `js/quests.js` are real files in this repo, and names like `findMissed` are functions you can search for.

## The method: how this was built with an AI agent

You described the app in an interview instead of writing code. That interview became four documents, each answering one question:

| Document | Question it answers |
|---|---|
| `devpost/scope.md` | What is the one idea, and what is left out? |
| `devpost/prd.md` | What does the user see and do? No code talk. |
| `devpost/spec.md` | How is it built: files, data, tools? |
| `devpost/checklist.md` | In what order, and how do we know each step works? |

The checklist is cut into **slices**. A slice is a thin piece of the app that works end to end and that you can try, such as "set up quests and see them on Today". The opposite would be building all the storage first, then all the screens, and only finding out at the end whether any of it fits together.

Every slice goes through the same loop:

1. **Build** it.
2. **Verify** it by running something, not by looking at the code and hoping.
3. **Commit** it, which saves a checkpoint in git that you can always return to.
4. **Record** anything that turned out different from the plan, in the checklist under Revisions.

Three git words you will keep meeting:

- **Commit**: save a checkpoint on your computer.
- **Push**: send your commits to GitHub.
- **Deploy**: Vercel notices the push and puts the new version on your live link.

The practice to reuse next time: decide what "working" means before building, then check exactly that.

---

## Step 1: set up your goal and quests, see them on Today

### What you can do now

Tap to begin, enter your date of birth and lifespan, name a goal, add up to three daily quests, and see them on Today in priority order. Tick one off. Close the app and it is all still there.

### How it works

- **`index.html`** holds every screen as a `<section>`. Only one has the class `is-active`, and CSS hides the rest.
- **`js/main.js`** is the traffic controller. Its `go(name)` function switches which section is active. This is called a router.
- **`js/store.js`** is the app's memory. Everything lives in one object (the "state") that is saved to the browser's `localStorage` after every change.
- **`js/quests.js`** holds the rules: the three-quest limit, priority order, which quests count today.
- **`js/screens/setup.js`** and **`js/screens/today.js`** draw the screens and react to taps. They ask `quests.js` for answers and `store.js` to save.
- **`css/base.css`** holds the look. **`css/screens.css`** holds each screen's layout.

Follow one action through the code, ticking a quest:

1. You tap the diamond. The click handler is in `questRow` in `js/screens/today.js`.
2. It calls `update(...)` from `js/store.js`, which runs `markDone` from `js/quests.js` and then saves.
3. `markDone` writes the quest's id into `state.days["2026-10-05"].done`.
4. `render()` redraws Today, and `isDone` now says yes for that quest.

### Ideas worth learning

**Keep the rules away from the screens.** `js/quests.js` never touches the page. It takes the state, answers a question, and returns. That makes the rules easy to check on their own, which is what `tests/check-logic.mjs` does in under a second with no browser.

**One state object, saved whole.** There is no database. `update(change)` in `js/store.js` makes a change and immediately writes the whole object to `localStorage` as text. Simple, and good enough for one person's data on one phone.

**Colours are variables.** At the top of `css/base.css`, `--accent` is the blue. Everything else (borders, glows, fills) is built from it, so changing one line recolours the whole app.

**Text from the user is added as text.** The screens use `textContent`, never `innerHTML`, to show quest names. If someone types `<script>` as a quest name, it shows up as those characters instead of running.

### How it was checked

- `node tests/check-logic.mjs` checks the rules: limit, ordering, "made after its deadline starts tomorrow", and so on.
- A script drove the real app in a hidden Chrome window at phone size: filled in Setup, added quests, tried a fourth, ticked one, reloaded, and jumped the clock to the next day.

### What changed from the plan

Each quest gained a `startsOn` date. The spec said a quest created after its deadline begins tomorrow, but it only stored the creation *date*, and you cannot tell "created at 10pm, after a 9pm deadline" from a date alone.

### Try it yourself

1. In `js/config.js`, change `MAX_QUESTS` from 3 to 4. Reload and add a fourth quest. Then run `node tests/check-logic.mjs` and read which check now describes the limit as 4.
2. In `css/base.css`, change `--accent: #2f7bff;` to `#22c55e`. Reload and watch the whole app turn green.
3. In your browser's developer tools, open Application, then Local Storage, and find `lifeApp.v1`. That text is your entire saved app.

---

## Step 2: the Penalty Zone

### What you can do now

Let a deadline pass without a tick and the whole app turns red and locks. The screen shows the penalty you chose, your goal, your weeks as a grid, and a quote. Reloading does not get you out. A photo unlocks it, and the photo is kept in Settings under Proof Gallery. If the camera will not work, you can type "I did it" and hold a button for five seconds instead.

To see it quickly: Settings, then Demo tools, then "Make my next quest due in 1 minute".

### How it works

- **`findMissed`** in `js/quests.js` decides what counts as missed.
- **`js/penalty.js`** watches the clock, draws the red screen, and clears the penalty.
- **`go(name)`** in `js/main.js` enforces the lock.
- **`js/weeks-grid.js`** draws the grid. **`data/quotes.js`** holds the quotes. **`js/audio.js`** makes the sounds.
- **`js/screens/settings.js`** has the Demo tools, and **`js/screens/gallery.js`** shows the photos.

Follow the lock through the code:

1. `startWatching` in `js/penalty.js` starts a check every 15 seconds.
2. Each check calls `enforcePenalty`, which asks `findMissed` whether any deadline passed without a tick.
3. If one did, it saves `state.penalty = { questId, date }`.
4. `go(name)` in `js/main.js` begins with `if (enforcePenalty()) name = 'penalty';`. Whatever screen was asked for, you get the Penalty Zone.
5. A photo calls `clearPenalty`, which stores the photo, adds a record to `state.proofs`, and sets `state.penalty` back to `null`.

### Ideas worth learning

**The lock is a saved fact, not a screen.** The red screen is only how the lock looks. The lock itself is `state.penalty` sitting in `localStorage`. That is why a reload cannot escape it: the app reads its memory, finds the penalty, and goes straight back. When you want something to survive a restart, save the fact and let the screen follow from it.

**One gate instead of many guards.** Every screen change passes through `go()`, so the lock rule is written once. If each button had its own "is the app locked?" check, one forgotten button would be a way out.

**Work it out from the data instead of keeping flags.** There is no "missed" switch stored on a quest. `findMissed` looks at three things that already exist (the deadline, the ticks in `state.days`, and the cleared penalties in `state.proofs`) and works out the answer fresh each time. Nothing can get out of sync because nothing is stored twice.

**Three ways the app notices time passing.** A check every 15 seconds; one extra timer aimed at the exact moment of the next deadline (`wakeAtNextDeadline`); and a check when the app comes back to the front (`visibilitychange`), because phones pause timers in the background. A closed app cannot check at all, so the first thing it does when opened is look for deadlines it slept through.

**Small things and big things are stored differently.** The state is small text, so it goes in `localStorage`. Photos are large files, so they go in `IndexedDB`, the browser's storage for files (`savePhoto` and `loadPhoto` in `js/store.js`). The two are linked by the proof's `id`.

**The camera is one line of HTML.** `<input type="file" accept="image/*" capture="environment">` asks the phone to open its own camera app and hand back the picture. There is no permission code to write.

**Sound needs a tap first.** Phones refuse to play sound until the user has touched the page. That is the whole reason for the "Tap to begin" screen: the tap calls `unlockAudio`. The sounds themselves are built from simple waves in `js/audio.js`; there are no audio files.

**A theme can be scoped to one part of the page.** The Penalty Zone section has the class `zone-danger`, which swaps `--accent` to red for everything inside it. The same panels and buttons, a different colour, no duplicate styles.

### How it was checked

- `tests/check-logic.mjs` grew ten checks for missed deadlines, including "a week away costs one penalty per quest".
- The browser script set a deadline three seconds ahead and waited for the app to lock by itself. It then tried to leave (other screens, the Escape key, a reload), gave the camera input a picture, found it in the gallery, used the no-camera fallback, used the Demo tool, and reset everything.

Two things the checking caught, both worth remembering:

- **An old check failed for a good reason.** After this step, the step 1 walkthrough failed at "the next day the quests appear". The app was right: the walkthrough had left two quests unticked overnight, so the next morning opened in the Penalty Zone. Rerunning old checks after new work is how you find out what a change touched.
- **A timing bug in the message window.** The app was waiting for the browser's "window closed" event before moving on, and that event arrives a moment late. The walkthrough was fast enough to notice. The fix was to act on the tap itself (`showNotice` in `js/main.js`).

### What changed from the plan

- **One penalty per quest after a long absence.** The spec did not say what happens if you stay away for a week. Seven penalties per quest on your return would be harsh, and the core idea is to motivate without making people uninstall, so only the most recent miss counts. This is your call; say so if you want it stricter.
- **The Demo tool moves today's deadline only**, so using it does not leave a real quest due at an odd time forever.
- **The exact-moment timer was added**, so the lock lands on the deadline instead of up to 15 seconds later.

### Try it yourself

1. Use the Demo tool, wait for the lock, then open developer tools, Application, Local Storage. Find `"penalty"` inside `lifeApp.v1`. Reload and watch the app read it back.
2. In `js/config.js`, change `FALLBACK_HOLD_MS` to `2000` and try the no-camera fallback. Change it back afterwards.
3. Add a quote of your own to `data/quotes.js`. Each one is `{ text, author }`.
4. In `css/screens.css`, find `--week-left` and change its colour. That is the colour of every week you still have.

---

## Step 3: the app on your phone

### What you can do now

Open the live link on your phone, choose "Add to Home Screen" (Chrome may call it "Install app"), and Questify gets its own icon and opens full-screen with no browser bar. It also opens with no internet.

### How it works

Three small files turn a website into something a phone treats as an app. Together this is called a Progressive Web App (PWA).

- **`manifest.webmanifest`** is the app's ID card: its name, its icons, the black colours, and `"display": "standalone"`, which means "no browser bar".
- **`sw.js`** is the service worker: a script the browser keeps running beside the app. It sits between the app and the internet and can answer requests from its own saved copies.
- **`assets/icons/`** holds the icons. They are drawn in `icon.svg` and rendered to PNG at 192 and 512 pixels. The "maskable" one has extra black margin, because Android crops icons into circles and rounded squares.

`js/main.js` switches the service worker on with one line: `navigator.serviceWorker.register('sw.js')`.

A service worker has three moments, and each is one block in `sw.js`:

1. **install**: it saves every file named in `APP_FILES`.
2. **activate**: it deletes saved copies left by older versions.
3. **fetch**: every time the app asks for a file, it decides where the answer comes from.

### Ideas worth learning

**Network first, saved copy second.** On each request `sw.js` tries the internet, and only if that fails does it use the saved copy. The other common choice is the reverse (saved copy first), which is faster but has a well-known trap: people keep seeing the old version after you publish a new one. While an app is changing every day, network first is the safer choice.

**Getting to your phone is a chain.** Commit (saved on your computer), push (sent to GitHub), deploy (Vercel sees the push and updates the link). If the phone shows an old version, ask which link in the chain did not happen.

**`https` is what unlocks phone features.** Service workers and installing only work on secure pages. Vercel gives you `https` for free, and `localhost` on your own computer counts as secure too. That is why testing locally worked at all.

**Not everything in the repo belongs on the site.** `.vercelignore` tells Vercel to skip the planning documents, the tests and the course skills. They stay in the repo for people reading the code, but the live link serves only the app.

**A list that must stay in step with the code should be checked by a machine.** `APP_FILES` in `sw.js` has to name every file the app loads, or that file is missing offline. Forgetting to add a new file is an easy mistake to make, so `tests/check-logic.mjs` compares the list with the real folders and fails if they differ.

### How it was checked

- Chrome has a built-in report of reasons a page cannot be installed. The check asked for that report and got an empty list.
- The script loaded the app, switched the network off, reloaded, and confirmed the app still opened and still ran.
- The same checks are run again against the live link after a push.

### What only a real phone can prove

The spec assumed three things without testing them, and a computer cannot settle any of them:

1. The installed app opens full-screen.
2. Sound plays after the first tap.
3. "Submit photo proof" opens the camera.

These are the three things to try on your phone.

### Try it yourself

1. On your computer, open the app, then developer tools, Application, Service workers. Tick "Offline" and reload. The app still opens.
2. In the same panel, open Cache storage and look inside `questify-v1`. Those are the saved copies.
3. In `manifest.webmanifest`, the `short_name` is the label under the icon on your home screen. Change it, push, and reinstall the app to see it.

---

## Step 4: Focus by the fire, finish a quest, get rewarded

### What you can do now

Each open quest on Today has a Focus button. It opens a true-black screen with only the quest name and a crackling bonfire. Tap "Quest complete" and you get XP and coins with a sound, the XP bar fills, and when it is full you level up. A daily "Check in" gives a small XP bonus once a day.

### How it works

- **`js/rewards.js`** holds the reward rules: how much a quest pays, the check-in, and how XP becomes a level.
- **`js/config.js`** holds the numbers those rules use.
- **`js/fire.js`** draws the bonfire. **`js/screens/focus.js`** is the Focus screen.
- **`js/screens/today.js`** shows the level, XP bar and coins (`renderHud`) and owns `finishQuest`.
- **`celebrate`** in `js/main.js` shows the reward pop-up and plays the sounds.

Follow finishing a quest through the code:

1. You tap "Quest complete" in Focus (or the diamond on Today). Both call `finishQuest` in `js/screens/today.js`.
2. `finishQuest` first asks `enforcePenalty()` whether a deadline was missed. If so, the app locks and nothing is paid.
3. Otherwise `completeQuest` in `js/rewards.js` marks the quest done, adds coins and XP, and works out the new level.
4. It returns a small report, such as `{ xp: 30, coins: 15, levelsGained: 0, level: 1 }`.
5. `celebrate` turns that report into the pop-up and the sounds, and `renderHud` redraws the bar.

### Ideas worth learning

**Rules report, screens react.** `completeQuest` does not play a sound or show anything. It changes the numbers and returns a report of what happened. The screen decides what to do with the report. Because of that split, the reward rules can be checked without a browser, and you could restyle the whole celebration without touching a rule.

**A level is not stored separately from XP; it is worked out.** `levelInfo(xp)` walks up from level 1, subtracting what each level costs, until the XP runs out. The cost of each level comes from one formula, `xpToNext` in `js/config.js`: 50 XP for the first level, and each level after costs 1.33 times the one before. Small multiplier, big effect: level 1 needs 50 XP and level 10 needs about 650.

**The fire is hundreds of blurry dots.** `js/fire.js` never draws a flame shape. About 190 times a second it creates a soft glowing dot at the base of the fire. Each dot rises, sways, drifts toward the middle, shrinks, changes from yellow to orange to red, and fades out in about a second. Your eye joins them into flames. This is called a particle system.

**Light that adds up.** The dots are drawn with `globalCompositeOperation = 'lighter'`, which adds colours together instead of painting over them. Where many dots overlap, at the heart of the fire, the sum reaches white. That is why the core looks hot without any code saying "make the middle white".

**Animation is a loop that runs every frame.** `lightFire` uses `requestAnimationFrame`: the browser calls `tick` about 60 times a second, and each time the fire moves forward by the time that has passed (`dt`) and is redrawn. Using real elapsed time means the fire burns at the same speed on a fast phone and a slow one. Leaving the screen calls `putOut`, which stops the loop so it does not drain the battery.

**A fire sound is mostly noise.** `startFireSound` in `js/audio.js` plays random static through a filter that keeps only the low rumble, then adds short sharp bursts of higher static at random moments for the crackles.

### How it was checked

- Eight new rule checks: the pay table, no double pay, the check-in, the level curve, and "missing a quest never removes coins, XP or levels".
- The browser script opened Focus and confirmed the screen holds only four things (name, fire, back, check-off) on a true-black background. It compared two frames of the fire to prove it moves, finished a quest, crossed the 50 XP line to level 2, and let a deadline pass *during* Focus to confirm the Penalty Zone still takes over and progress is untouched.
- The fire's look was tuned by eye from saved frames. The first version was short with a blown-out white base; the flames were made taller and each dot fainter so the colours could build up gradually.

One check did its job in an unexpected place: the offline file list from step 3 failed straight away, because three new files were not yet named in `sw.js`.

### What changed from the plan

Nothing in what you get. One open question from the spec was settled: with the spec's numbers, a full first day (three quests and a check-in, 65 XP) reaches level 2, and level 3 comes on day two. The spec had also floated "levels 1 to 3 in about a day"; that would mean halving the first number, which also halves how long level 10 takes. Both numbers are in `js/config.js` if you want it faster.

### Try it yourself

1. In `js/config.js`, change `LEVEL_BASE_XP` to `20` and finish a quest. You will level up at once. Run `node tests/check-logic.mjs` and read which checks fail; they are telling you what the change affected. Change it back.
2. In `js/fire.js`, change `FLAMES_PER_SECOND` to `40`, then `400`, and open Focus each time.
3. In `js/fire.js`, find `ctx.globalCompositeOperation = 'lighter';` inside `draw` and comment that line out. The white-hot core disappears.
4. In `js/audio.js`, find the `done()` sound and change `784` to `392`. Finish a quest and listen.

---

## Step 5: the Shop, your army and the Battleground

### What you can do now

Spend coins in the Shop on soldiers and weapons. You name each soldier as you buy it (the first one is offered the name Sung Jinwoo). On the Battleground your fire burns at the bottom, your named soldiers gather round it, weapons stand planted in the ground, and red demons loom behind. A new player sees only the fire. One demon arrives per level, and once there are six they keep getting bigger. The sound gets fuller as the army grows.

For a demo there is a shortcut: Settings, Demo tools, "Add 100 test coins".

### How it works

- **`data/catalog.js`** is the price list: every soldier and weapon, its price and its drawing.
- **`buyItem`** in `js/rewards.js` is the rule for spending coins.
- **`js/screens/shop.js`** is the Shop screen and the naming window.
- **`assets/sprites/`** holds the drawings, one SVG file each.
- **`js/sprites.js`** loads the drawings. **`js/battleground.js`** arranges and animates the scene.
- **`demonsForLevel`** in `js/config.js` decides how many demons there are and how big.

Follow buying a soldier through the code:

1. You tap a price in the Shop. `startPurchase` in `js/screens/shop.js` checks your coins first and, if you are short, says exactly how many you are missing.
2. For a soldier it opens the naming window. Submitting it calls `finishPurchase`.
3. `buyItem` takes the coins and adds `{ id, catalogId, name }` to `state.army`. That is all a soldier is in storage: which kind, and what you called it.
4. On the Battleground, `arrange` in `js/battleground.js` reads `state.army` and gives each soldier a place around the fire.

### Ideas worth learning

**Data in one file, behaviour in another.** The Shop screen has no soldier names or prices in it. It loops over `CATALOG`. To add a new soldier you draw one SVG and add one line to `data/catalog.js`; no screen code changes. When a list of things might grow, keep the list as data.

**A drawing can be code.** Each sprite is an SVG: a text file of shapes ("an ellipse here, a path there"). Open `assets/sprites/soldier-swordsman.svg` in a text editor and in a browser side by side. Every soldier shares the same body, visor and glowing eyes, and differs only in hat and gear, which is why they look like one family.

**Faking depth on a flat screen.** The Battleground uses three old tricks, all in `js/battleground.js`:

1. **An oval instead of a circle.** A ring of soldiers seen from the side looks like a flat oval, so `onOval` squashes the circle (`rx` wide, `ry` tall).
2. **Draw the far things first.** Everything is sorted by how low it is on screen, and drawn top to bottom, so nearer soldiers overlap further ones. The fire is drawn in the middle of that order: soldiers behind it, then the fire, then soldiers in front.
3. **Distance is darkness.** The demons are drawn normally, then a veil of darkness is painted over all of them, thickest near the ground. They read as far away and large.

**Work out the layout once, then only animate.** `arrange` runs once when you open the screen and decides where everything stands. The loop that runs 60 times a second (`drawScene`) does only the cheap part: a little bob, a little sway, and the fire.

**Turn each drawing into a picture once.** An SVG is a recipe, and following it for 25 characters, 60 times a second, is slow. `stampFor` in `js/sprites.js` follows the recipe once per size, keeps the result as a plain bitmap, and reuses it every frame. Doing expensive work once and keeping the result is called caching.

**Loading takes time, and the user does not wait.** The drawings load in the background. If you tapped Back before they arrived, the old code would have started an animation on a screen you had already left. `enter` in `js/battleground.js` takes a ticket number (`visit`) before waiting, and checks it afterwards; if the number has moved on, it stops.

**Layers of sound.** `startArmySound` in `js/audio.js` adds one layer for every two soldiers: a low hum, a note above it, a high shimmer, and at seven soldiers a slow drum.

### How it was checked

- Nine new rule checks: a blocked purchase changes nothing, a soldier needs a name and a weapon does not, level 1 has no demons, and demons never get fewer or smaller as the level rises.
- The browser script tried to buy with no coins, added test coins, bought and named two soldiers and a sword, and confirmed the Battleground's description of itself matched: "Level 1 · 2 soldiers · 1 weapon · 0 demons".
- Screenshots at level 2, 6 and 12 were inspected by eye. They showed three problems, all fixed: soldiers in front were hiding the names of soldiers behind (names are now drawn last, on top of everything), overlapping demons were see-through (they are now drawn solid and dimmed together), and soldiers in the second ring stood directly behind those in the first (the second ring is now turned so they stand in the gaps).

The practice to reuse: a check that passes tells you the logic is right, not that it looks right. For anything visual, look at it.

### What changed from the plan

Nothing in what you get, but three choices were made that the plan had left open. All are yours to change:

- **The catalog.** Four soldiers (Swordsman 20, Archer 35, Mage 50, Knight 80) and three weapons (Sword 10, Spear 15, Axe 25). A full day of quests earns 30 coins, so the first soldier is within reach on day one.
- **"The first soldier is Sung Jinwoo"** was read as: the first soldier you buy is offered that name, and you can change it.
- **No demons at level 1**, so that a new player really does see only the fire.

### Try it yourself

1. Add a soldier to the Shop without touching any screen: copy `assets/sprites/soldier-swordsman.svg` to `soldier-guard.svg`, change a colour in it, and add `{ id: 'guard', kind: 'soldier', label: 'Shadow Guard', price: 5, sprite: 'soldier-guard' }` to `data/catalog.js`. Then run `node tests/check-logic.mjs` and read why one check fails.
2. In `js/config.js`, change `demonsForLevel` so level 1 already has two demons. Which check objects, and why does the plan care?
3. In `js/battleground.js`, change the first ring's `ry` from `0.07` to `0.2`. The camp is now seen from above instead of from the side.

---

## Step 6: the intro, the Level 0 demo, and your accent colour

### What you can do now

The first tap plays a short intro: the emblem flies out of the dark with a sound and the name lands letter by letter. A brand-new player then gets Level 0, five cards that explain the app with clearly labelled sample data, and only then Setup. In Settings you can pick one of six accent colours for the whole app and switch the sound off.

### How it works

- **`js/intro.js`** runs the intro and the demo cards. It never imports `js/store.js`, which is how "the demo saves nothing" is guaranteed rather than promised.
- The intro's movement is all CSS, in `css/screens.css` under "Intro". JavaScript only starts a timer.
- **`applyAccent`** in `js/screens/settings.js` changes the colour.
- The gate's click handler at the bottom of `js/main.js` decides what a tap leads to.

That handler is worth reading. It is the whole "what happens when the app opens" decision in ten lines:

1. Is a penalty waiting? Go to the Penalty Zone. No intro gets in the way.
2. Has the person asked their device for less motion? Skip the intro.
3. Otherwise play the intro, then go to the demo (new player) or Today (returning player).

### Ideas worth learning

**Animation without JavaScript.** The intro uses CSS `@keyframes`: you describe the start and the end, and the browser draws everything in between. The "3D" look comes from one property, `perspective`, on the container. With it, moving something along the Z axis (`translateZ(-1500px)`) makes it small and far away, so animating back to zero makes it fly toward you.

**One animation, staggered.** All eight letters of the name share one animation. Each letter carries a number in a CSS variable (`--i: 0` to `--i: 7`) and starts a fraction later: `calc(0.78s + var(--i) * 0.055s)`. You do not write eight animations; you write one and a delay rule.

**The payoff of colours-as-variables.** Step 1's notes said every border, glow and fill is built from `--accent`. That choice is why the accent picker is one line: `document.documentElement.style.setProperty('--accent', colour)`. No screen was edited to support it. A decision made at the start to make something easy later is the kind of thing a spec is for.

**Sample data must look like sample data.** Each demo example sits in a dashed frame with a "Sample" tag, and is marked `inert` so it cannot be tapped. A demo that looks real makes people think their app already contains things it does not.

**Respect "reduce motion".** Phones and computers have a setting for people who get dizzy or distracted by animation. `window.matchMedia('(prefers-reduced-motion: reduce)')` reads it, and the app skips the intro for them. It costs two lines.

### How it was checked

- The browser script timed the real intro (2.9 seconds, then it moves on by itself), tapped to skip it, walked all five demo cards forward and back, and confirmed nothing was saved.
- It confirmed a locked player goes straight to the Penalty Zone with no intro.
- It changed the accent to purple and read the colour back from Settings, Today, the XP bar, the Shop and the opening screen, and confirmed the Penalty Zone stayed red.
- It muted the sound and confirmed that a reward, the fire and the Battleground all stayed silent.
- Last, it ran **the whole core journey in one go**: intro, demo, Setup, Focus, reward, Shop, naming a soldier, the Battleground, a missed quest, the Penalty Zone, a photo, and the gallery, with no errors.

Two things from the checking worth remembering:

- **A check that failed once and passed the next time is a problem with the check.** The "title has landed" check assumed the animation would be finished after a fixed wait. On a busy run it was not. The fix was to wait for the thing itself, not for a guessed amount of time. Tests that sometimes fail teach people to ignore failures.
- **A colour check failed for a reason that was not a bug.** Straight after changing the accent, the page still reported blue. The cause was the test's own "reduce motion" setting, under which every change takes one frame to settle. The colour was right a moment later. Before fixing code because a check failed, find out which of the two is wrong.

### What changed from the plan

- **The intro plays on every open, not only the first**, as the PRD's screen list says ("then onward to Today"). It is under three seconds and one tap skips it. Say so if you would rather returning players skip it.
- **A locked player skips the intro**, so the Penalty Zone is the first thing they see.
- **The six accent colours** were chosen in the build: System blue, Ice, Shadow purple, Emerald, Ember and Rose. They are a list in `js/config.js`.

### Try it yourself

1. In `js/config.js`, add `{ name: 'Blood', value: '#dc2626' }` to `ACCENTS`. A seventh swatch appears in Settings with no other change.
2. In `css/screens.css`, find `@keyframes intro-mark` and change `translateZ(-1500px)` to `translateZ(600px)`. The emblem now arrives from behind you. Then change `perspective: 700px` on `.intro` to `200px` and watch the depth exaggerate.
3. On your computer, turn on "reduce motion" in your system's accessibility settings, reload, and tap to begin. The intro is gone.

---

## What to take from all of this

Six steps, and each one could be tried the moment it was finished. A few practices did most of the work, and none of them are specific to this app:

1. **Say what "working" means before building.** Every step had a "this becomes usable" line and a way to check it, written before any code.
2. **Build the risky, important part early.** The Penalty Zone was step 2, not step 6. If it had not worked, the plan would have changed while that was still cheap.
3. **Check by running, and rerun old checks.** Twice, an earlier check caught something a later step changed.
4. **Keep rules apart from screens.** It is why the rules can be checked in a second, and why the look could change without touching them.
5. **Put numbers and lists in one place.** Rewards, the level curve, the Shop, the quotes and the accent colours are all data you can edit without reading screen code.
6. **Write down what changed and why.** The plan was wrong in small ways about ten times. Each time it was corrected in the checklist under Revisions, which is why the documents still describe the app you have.

---

## Final review, round 1: from cute to cinematic

### What happened

You tried the finished app and said it looked like a small kids' game. That was a fair hit on the plan, not only on the build: your PRD had asked for "thick, clean, Duolingo-style" characters that were "friendly and cute", and that is what got built. Seeing it was what told you it was wrong. This is normal, and it is the reason every plan in this process ends with a hands-on review.

So the look and the sound were redone, and the PRD and spec were changed to say what you now want.

### What changed

- **Characters.** Chunky cartoon soldiers became tall shadow knights: almost black, lit along one edge, with glowing eyes and a cold aura. Demons became huge horned shapes with burning eyes.
- **The Battleground.** A blood moon rises behind the demons, fog drifts along the horizon, dust catches the firelight, and shadow rises off every soldier.
- **The bonfire.** Charred logs with fire glowing through the cracks, and dark stones lit on the side facing the flames. No outlines.
- **Windows and buttons.** Dark glass with cut corners in a thin glowing frame. Coins are small gold gems.
- **Sound.** Every sound was rebuilt. Beeps became impacts, bells, low brass and a choir, in a big echoing space.

None of the rules changed. All 39 rule checks passed untouched, which is the payoff of keeping rules apart from screens.

### Ideas worth learning

**A silhouette needs less drawing and reads as more serious.** The cute soldiers had faces, bellies and feet, all outlined. The new ones are one dark shape, a thin line of light down one side (`stroke="url(#rim)"`), and two eyes. Your eye fills in the rest. Dark-on-dark only works with something bright behind or beside it, which is why the demons have a moon and the soldiers have an aura.

**Parts, not copies.** `tools/make-sprites.cjs` builds all four soldiers from shared pieces: `body()`, `eyes()`, `helmet()`, `arm()`. Change the eye colour in one place and run `node tools/make-sprites.cjs`, and every soldier changes. The app never runs this script; it only loads the SVG files it writes.

**The aura is the fire, recoloured.** `js/battleground.js` reuses the fire's trick (soft glowing dots that rise and fade, their light adding up) with blue and violet dots instead of orange. `makeStamp` was already written for the fire; it only had to be shared.

**Reverb is most of what "cinematic" means.** The old sounds went straight to the speaker. Now everything can pass through `hall` in `js/audio.js`, a reverb. The echo of a big room is roughly a burst of noise fading away, so `buildOutput` makes three seconds of fading noise and the browser smears each sound through it. A plain note becomes a note in a cathedral.

**Instruments are recipes made of two ingredients.** Everything is built from `tone()` (a pitched wave) and `rush()` (a sweep of filtered noise):

- a **boom** is a low note dropping fast plus a thud of noise;
- a **bell** is a note plus higher notes deliberately not in tune with it, which is what makes metal sound like metal;
- a **braam**, the trailer-brass roar, is buzzing low waves, slightly out of tune with each other, with the brightness filtered away as they fade;
- a **choir** is the same buzz pushed through three narrow filters set to the resonances of a mouth singing "aah".

Then each app sound is a short score: the intro is a rush, a boom, two braams, a pad and three bells.

**You can measure sound without hearing it.** The agent cannot listen. So each sound was rendered to memory with an `OfflineAudioContext` and measured: how loud is its peak (is it below 1.0, where it would distort?), and how long does it ring? That caught a real problem: the army's drone was several times louder than the quest bell. It cannot tell you whether the sound is *good*. Only your ears can.

**Checks should test what the user gets, not how it is built.** Four checks broke during the restyle though nothing was wrong: they asked "is the panel's border red?", and the new panels have no border, they have a frame drawn a different way. A check that says "the Penalty Zone is red" survives a redesign; one that names a CSS property does not.

**Inspiration is a direction, not a download.** Pinterest wanted a sign-in, which the agent cannot do, so only the pins visible behind the wall were seen. They were enough to take a direction from (dark glass, glowing frames). Nothing was copied, and every drawing here was made from scratch. That matters for a public repo: you can show it to anyone.

### Try it yourself

1. In `tools/make-sprites.cjs`, find `const eyes = (y, colour = '#cfe2ff', halo = '#5b8cff')` and change the halo to `'#ff5b5b'`. Run `node tools/make-sprites.cjs`, reload, and open the Shop.
2. In `js/audio.js`, find `soften.frequency.value = 3800;` in `buildOutput` and change it to `900`. The hall becomes dark and muffled. Then find `** 2.6` a few lines above and change it to `** 1.2` for a much longer echo.
3. In `js/battleground.js`, find `drawMoon` and change the three reds in `disc.addColorStop` to blues. A different night entirely.

---

## Final review, round 2: intensity

### What happened

You liked the new look and asked for the app to be "even more gamified and intense". Those are two different requests, and they were handled differently on purpose.

- **Intense** is about feel. The same rules, staged harder. That was built straight away.
- **Gamified** means new rules: ranks, streaks, bosses. Each one changes the PRD and is one more thing to build, test and show in a short demo. That is a scope decision, so it went back to you as a question instead of being guessed at.

The practice to reuse: when a request is vague, split it into the part that is safe to act on and the part that needs a decision, do the first, and ask about the second.

### What changed

- **Finishing a quest** now plays a sequence: a flash of light, a shockwave ring, sparks, a jolt of the screen, a vibration, and the bell. A level-up, or the last quest of the day, gets a bigger gold version.
- **Deadlines are felt before they hit.** In the last hour a quest's row turns amber. In the last ten minutes it turns red, counts down in seconds, and the edges of every screen glow red. In the last minute a clock ticks, faster for the final ten seconds.
- **The bonfire in Focus burns harder** as the deadline closes in: taller flames and five times the sparks.
- **A soldier joining** rises out of a pool of shadow under the word ARISE.
- **The Penalty Zone arrives** with a red flash and a hard jolt.
- **Lightning** cracks over the demons, with thunder.

### Ideas worth learning

**"Juice" is the word game makers use for this.** None of it changes what the app does. All of it changes how doing it feels. A reward that is a number going up is information; the same number with a flash, a sound and a jolt is a reward. Each effect on its own is small (`shake` in `js/main.js` is ten lines); the feeling comes from several firing in the same instant.

**One mood, set in one place, read by everything.** `feelTension` in `js/penalty.js` runs once a second and writes a single word onto the page: `<body data-tension="near">`. It does not know about any screen. The CSS then says "when the body has that word, glow the edges" (`body[data-tension='near']::after` in `css/base.css`). That is why the tension shows on every screen, including ones written before it existed, without touching any of them.

**Change the text, not the list.** Today's countdown ticks every second. Rebuilding the whole quest list each second would restart every animation and could swallow a tap. So `render` builds the rows once and remembers the pieces that change (`live` in `js/screens/today.js`), and `tickCountdowns` only rewrites those.

**Pass a question, not an answer.** `lightFire(canvas, heat)` takes `heat` as a function. The fire asks it "how hot now?" on every frame, and Focus answers from the clock. If it took a number, the fire would be stuck at whatever the heat was when the screen opened.

**Sparks are the fire, thrown outward.** `sparks` in `js/main.js` is the same particle idea as the bonfire: many dots, each with a speed, gravity pulling them down, air slowing them, fading out. Three places in this app now use that one idea.

**Respecting "reduce motion" was already paid for.** `shake`, `sparks` and `arise` each begin by asking `calm()`. People who get dizzy from motion get the reward without the jolt.

### How it was checked

- A new walkthrough runs with animation switched on. It moves the clock to five minutes, then 45 seconds, before a deadline and checks the mood words, the seconds countdown and the ticking; finishes quests and checks the jolt, the sparks and the vibration; buys a soldier and checks the Arise sequence; lets a deadline pass and checks the flash; and waits for lightning.
- The four new sounds were rendered and measured like the others. That caught one: the ticking clock measured about a third as loud as it needed to be, because a very short low note fades before it has finished one wave. It was made longer.
- Two of the new checks failed for the same reason as before: they looked for a half-second effect a moment too late. Checks on short-lived effects have to look immediately.

### Try it yourself

1. In `js/config.js`, change `TENSION_NEAR_MS` to `60 * 60 * 1000`. Now the last *hour* glows red and counts in seconds. Notice you changed one number and three places reacted.
2. In `js/main.js`, find `count: grand ? 110 : 46` and try `400`.
3. In `css/base.css`, find `@keyframes quake` and double every number.

---

## Final review, rounds 3 and 4: a misreading, then "make it feel native"

### What happened

1. After the intensity round you wrote: "the things feel vague and annoying now, do something cool".
2. The agent read that as "take the effects out", reverted the whole round on your computer, and asked what "cool" meant.
3. You answered: "noooo it's not annoying, the overall app should be more good". You wanted the effects kept and the *whole app* lifted: like a native app, smooth, sound effects everywhere, motivating.
4. The effects were put back, and those four things were built.

Two mistakes in a row, in opposite directions, and both came from the same place. In round 2 the agent built too much on one vague word. In round 3 it removed too much on another. Each time, one question first would have cost you ten seconds.

What saved it both times: every change was its own commit, and the removal had not been pushed. Your live app never changed. Putting the work back was one command.

**The practice to reuse:** when feedback could mean two opposite things, ask which before you add or remove anything. And push only when you are sure, because unpushed mistakes are free.

Your round 4 message is also a good example of a request that works. "Like some native app", "so smooth", "sound effects everywhere" and "motivating" are four things that can each be turned into a list and checked.

### What "like a native app" turned out to mean

Nobody can build "native". But it breaks down into small, concrete habits that phone apps share and web pages do not:

- **A tab bar at the bottom.** The main screens are always one tap away, and there are no Back buttons. `showTabs` in `js/main.js`, the `.tabbar` styles in `css/base.css`.
- **Screens slide.** A later screen comes in from the right, an earlier one from the left. `ORDER` in `js/main.js` is the list that decides which is which; the `screen-forward` and `screen-back` animations in `css/screens.css` do the moving.
- **Forms rise from the bottom** as sheets, attached to the edge of the screen. `.sheet` in `css/base.css`.
- **Every press is answered.** Anything you can touch sinks and brightens under your finger, in under a tenth of a second.
- **It does not behave like a document.** You cannot select the text, long-press an image, or drag the page until it bounces. Four lines of CSS near the top of `css/base.css` do this.
- **It opens fast.** The full intro plays the first time; after that, a one-second flash of it.

None of these is hard. Together they are most of the difference between "a website" and "an app".

### Smooth: measure first

The first attempt at "smooth" was a guess: the agent assumed the slow part of the Battleground was building colour gradients every frame, and moved those to be painted once. It then measured, and the screen was no faster.

So it measured properly, by skipping one kind of drawing at a time and timing the rest:

| Skipped | Frames per second |
|---|---|
| nothing | 45 |
| the glowing particles (fire and aura) | 59 |
| the big glow fills | 55 |
| the sprites and name labels | 54 |

The particles were the real cost, by a distance. With that known, the fix was obvious: fewer and larger aura wisps, a thinner fire where it is drawn small, the fire's glow painted once.

Result with the processor slowed four times to stand in for a phone: about 40 frames a second before with a full army, about 53 after, and about 59 with a normal-sized army.

**The practice to reuse:** do not optimise what you think is slow. Measure, change one thing, measure again. The first guess here was wrong, and only the measurement said so.

One honest limit: these numbers come from a test browser on a computer, not from your phone. They show the direction. Your phone is the real test.

### Sound everywhere, without it becoming noise

There is one line of code behind most of it. `js/main.js` listens for a touch anywhere on the page and, if it landed on a button, plays `tap`. No button needed changing. Screens that move play `nav` from inside `go()`, for the same reason: one place, every screen.

The sounds for small things are deliberately small: short, quiet, and high. The big sounds (a level-up, the Penalty Zone) stay rare. If everything is loud, nothing is.

### Motivating without adding a rule that can hurt

A streak counter is the usual way to motivate. It was left out on purpose: a streak that resets when you miss a day is a loss of progress, and your scope document rules that out ("the learner prefers the Penalty Zone approach"). So Today shows a count that can only go up, every quest you have ever cleared, plus how today is going, a quote a day, and your own goal named in every reward.

Checking a new idea against what you already decided to leave out is what the "Explicitly Cut" list is for.

### Try it yourself

1. In `js/main.js`, change the order of two names in `ORDER` and watch which way those screens now slide.
2. In `css/base.css`, find `.btn:active` and change `scale(0.95)` to `scale(0.8)`. Press any button.
3. In `js/audio.js`, find `tap()` and change `720` to `220`. Every button in the app now sounds different, from one line.
4. In `js/screens/today.js`, find `greeting` and write your own lines.
