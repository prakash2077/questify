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
