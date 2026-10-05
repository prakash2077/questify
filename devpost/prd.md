---
doc: prd
status: approved
---

# Solo Leveling-Style Life App (working title) — Product Requirements

A phone-sized web app that turns a student's real daily goals into quests, grows a shadow army as they finish them, and locks the whole app into a Penalty Zone when they miss one.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`, `scope.md > The POC Boundary`.

## The Core Journey
1. **First open (Level 0, the demo).** A short sleek intro pops out of black with a satisfying sound. A brief guided demo explains the app. At sign-up the user enters their date of birth and expected lifespan, and the app works out the weeks they have left.
2. **Set a goal.** The user names a big goal (e.g. "Get into Google or Microsoft") and adds daily sub-quests under it. Each quest has a name, deadline, priority, and a hard penalty task chosen *now*, in advance (e.g. "write an essay", "write the punishment line 100 times", "stare at a wall for an hour").
3. **Level 1 begins.** Each morning, today's quests (at most three) appear on the Today screen, ordered by priority, with deadlines.
4. **Focus.** The user taps **Focus** on a quest. A full-screen true-black screen opens with the quest name and an animated fire.
5. **Finish.** The user checks the quest off. Coins and XP are awarded with sound and animation.
6. **Grow the army.** The user opens the Shop and spends coins on a soldier or weapon, names the soldier, and sees it appear on the Battleground around their fire.
7. **Level up.** XP fills; at each level the demons on the Battleground get bigger and tougher while the army grows.
8. **Miss a quest.** If a deadline passes without a check-off, the app locks into the Penalty Zone. The user must do the hard penalty they chose and submit photo proof. Then the app unlocks.
9. **Success looks like:** the user finishes a day of quests, watches the army grow, and has felt the Penalty Zone once and come back to the app anyway.

## Screens and Layout
- **Intro** — the short animated open, then onward to Today.
- **Sign-up / Setup** — date of birth, expected lifespan, first goal and quests. Shown once on first use.
- **Today** — today's quests (max 3) with deadline, priority, and a Focus button on each; coin, XP, and level shown at the top. Buttons to reach the Shop and Battleground.
- **Focus screen** — full-screen true black, quest name, animated fire, a check-off control.
- **Shop** — simple list of soldiers and weapons with coin prices.
- **Battleground** — full-screen 2D scene. The user's fire burns at the bottom as the core of their life; soldiers stand around it; demons loom in the background and grow with the level.
- **Penalty Zone** — full-screen red lock screen: the hard penalty task, the user's goal, the weeks-left grid, a real quote, and a button to submit photo proof.
- **Settings** — accent colour choice (see Look and Feel).

Navigation: Today is home. A tab bar at the bottom of the screen switches between Today, the Shop, the Battleground (Army) and Settings, as in a native phone app. Focus opens from a quest and returns to Today. The Penalty Zone takes over everything until cleared, and the tab bar disappears with it.

## Look and Feel
- Black (AMOLED) background, close to the *Solo Leveling* System UI in typography and styling, with a "fire plus cool" feel; dark, cinematic, and not generic. Windows are panes of dark glass with cut corners in thin glowing frames.
- Default accent is blue; the Penalty Zone is red to signal danger and importance. The user can switch the accent colour in Settings.
- The intro is short, sleek, and 3D-looking, popping out of the black with a satisfying sound.
- The fire is a real bonfire: a crackling, burning flame, like one you'd keep going while building or cooking something. That is the theme of the whole app. It is shown on Focus and on the Battleground, and the animation should look great.
- Characters are 2D sprites drawn from scratch as dark silhouettes: tall shadow soldiers with glowing eyes and a cold aura, and demons as huge horned shapes with burning red eyes against a blood moon. Sleek and cinematic, not cartoon. (Changed in the final review: the first version was thick, cute and Duolingo-style, and read as a small children's game.)
- Sound is cinematic: deep impacts, bells, low brass and a choir in a large reverberant space, not beeps. Sound effects are important at key moments: intro, check-off, coins, buying a soldier, the Battleground, the Penalty Zone. The Battleground gets richer in sound as the army grows.
- Intensity: the key moments are staged, not just shown. Finishing a quest plays a flash, a shockwave, sparks, a jolt of the screen and a vibration; a level-up or the last quest of the day plays a bigger gold version. A soldier joining rises out of a pool of shadow under the word ARISE. The Penalty Zone arrives with a red flash and a hard jolt. Lightning cracks over the demons.
- Tension: a deadline is felt before it hits. In its last hour a quest's row turns amber; in the last ten minutes it turns red, counts down in seconds, and the edges of every screen glow red; in the last minute a clock ticks. The bonfire in Focus burns harder as the deadline nears.
- Native feel: it should behave like an app installed from a store, not like a web page. Screens slide in from the side, forms rise from the bottom edge as sheets, every button sinks and brightens under the finger, nothing can be accidentally selected or bounced, and a returning player gets in within a second.
- Sound everywhere: every touch has a sound. A soft click for any button, a breath of air between screens, a rising pair of notes when a window opens, a low buzz when something is refused, a chime when something is added, a falling note when something is removed.
- Motivating: Today greets the player, says how the day is going in words ("1 down, 2 to go. Keep the fire burning."), shows one real quote a day, and counts every quest ever cleared. Every reward names the player's own goal.
- Tone: motivating and heartwarming, not harsh. The drama is in the staging; the words stay kind.

## Features and Behavior

### Goals and Quests
- A goal holds recurring daily sub-quests, entered once and appearing each day automatically (the workaround for typing tasks every morning).
- Each quest has: name, deadline, priority (set by the user), and a pre-chosen hard penalty task.
- A maximum of three quests per day, to keep the list consistently doable.
- Acceptance criteria:
  - [ ] A goal and its quests can be created, and the quests appear on Today the next day without being re-entered.
  - [ ] Each quest on Today shows its name, deadline, and priority.
  - [ ] A fourth quest cannot be added to a day, and the user is told why.

### Focus Mode
- Tapping Focus on a quest opens the black screen with the quest name and animated fire.
- Acceptance criteria:
  - [ ] Tapping Focus shows only the quest name and a moving fire on a true-black background.
  - [ ] The user can check the quest off from this screen.

### Coins, XP and Levels
- Finishing a quest awards coins and XP, with sound and animation. Higher-priority quests give more XP. A small amount of XP also comes from other activity such as a daily check-in; quests remain the main source. Missing a quest never removes XP or coins.
- Levels get steeper: the first few levels come within about a day; a later level (e.g. 10 to 11) takes about ten days of steady work.
- Level 0 is the demo/tutorial; real quests begin at Level 1.
- Acceptance criteria:
  - [ ] Checking off a quest visibly and audibly increases coins and XP.
  - [ ] A daily check-in gives a small amount of XP, less than a finished quest.
  - [ ] The XP bar fills and the level number increases when the threshold is reached.
  - [ ] Early levels rise quickly; later levels visibly need more XP than earlier ones.

### Shop and Army
- The Shop lists soldiers and weapons with coin prices. Buying one spends coins, asks the user to name the soldier, and places it on the Battleground. The first soldier is Sung Jinwoo.
- Acceptance criteria:
  - [ ] A purchase is blocked, with a clear message, when the user lacks the coins.
  - [ ] After buying and naming a soldier, it appears on the Battleground with a name.
  - [ ] The Battleground shows more soldiers after more purchases.

### Battleground
- A full-screen 2D scene: fire at the bottom, soldiers around it, demons in the background. Higher levels bring more and tougher demons. Soldiers and demons are animated in a looping ambient way; they do not fight in a way the user plays. (Assumption: see Open Questions.)
- Acceptance criteria:
  - [ ] At the start, only the fire is shown.
  - [ ] Demons are larger or more numerous at a higher level than at a lower one.
  - [ ] Sound builds up as more soldiers are present.

### Penalty Zone
- Triggers when a quest's deadline passes without a check-off. The rest of the app is locked.
- Shows: the pre-chosen hard penalty, the user's goal, a weeks-left grid (lived weeks filled, remaining weeks lit, based on date of birth and expected lifespan), and a real, influential quote.
- To clear it, the user does the penalty and submits a photo as proof using the camera (e.g. a photo of the writing, or of a wall and clock). The app then unlocks.
- Acceptance criteria:
  - [ ] Letting a deadline pass locks the app so no other screen is reachable.
  - [ ] The screen shows the penalty task, the goal, the weeks-left grid, and a quote, in a red look.
  - [ ] The app unlocks only after a photo is submitted, except when the camera can't be used, where the fallback clears it.
  - [ ] The submitted photo is kept and can be seen afterwards.

## States and Boundaries
- **First use** — intro, then Level 0 demo and sign-up, then the first goal and quests. The Battleground shows only the fire.
- **No quests yet today** — Today shows a clear prompt to add or set up quests.
- **Coins too low** — the Shop blocks the purchase and says so.
- **Camera unavailable or permission denied** — the penalty can still be cleared without a photo. This is a fallback only; photo proof is the normal path and should work in most cases.
- **Persistence** — quests, coins, XP, level, soldiers and their names, and settings remain after closing and reopening. (Assumption: kept on the device only; no accounts.)
- **Trust** — the app trusts the user to be honest; checking for cheating is deferred.

## Product Decisions
- Penalty Zone is the heart of the app — it comes from the scope kernel: motivate without being harsh, so people don't uninstall.
- Photo proof is in the first version — "tap I did it" is too easy for a penalty; proof adds accountability.
- Penalty is chosen in advance, when the quest is created — so the user decides while calm.
- Maximum three quests a day — more is not consistently doable.
- Weeks left comes from date of birth plus an expected lifespan the user enters — an honest, visual reminder that time is limited.
- Goals contain recurring sub-quests entered once — typing tasks daily would be a pain; this replaces the AI planner for now.
- Levels get steeper over time — early wins feel fast, later levels feel earned.
- Soldiers and demons are 2D, from-scratch sprites drawn as dark silhouettes with glowing eyes — the cute Duolingo-style first version was replaced in the final review because it looked like a children's game.
- Missed means the deadline passes without a check-off.
- Without a camera, the penalty can still be cleared — a rare fallback that exists so the user is never stuck.
- XP mainly comes from finishing quests, plus a small amount from other things like a daily check-in.
- The fire is a burning bonfire — it represents building something.

## What We're Building
- Intro animation and sound, a Level 0 demo, and sign-up (date of birth, lifespan).
- Goals with recurring daily quests (name, deadline, priority, pre-chosen penalty), max three per day.
- Today screen with Focus mode (black screen, quest name, animated fire).
- Check-off with coins, XP, levels, and sound.
- Shop for soldiers and weapons, soldier naming, and a Battleground with fire, soldiers and growing demons (ambient animation).
- Penalty Zone with photo proof, weeks-left grid, goal, and a quote.
- Accent colour setting.
- Phone-sized web app.

## Deferred From the POC
- AI that interviews the user and suggests a plan (needs AI connection, a chat screen, and plan generation; recurring manual quests are the workaround).
- Cheating prevention for ticking off tasks (needs checks beyond trust).
- Real fighting between soldiers and demons (expensive to build well).
- Accounts or syncing across devices (not needed for one person's proof).

## Possible Later Enhancements
- Mini-games, AI-assigned priority, a phone home-screen widget, Clash of Clans-style attacks, online challenges against others.

## Non-Goals
- Real-life offers and rewards — depends on outside partners.
- Losing rank, level, or XP on a miss — the Penalty Zone is the consequence.
- Harsh or shaming tone — the goal is to motivate, not make people uninstall.

## Open Questions
- **Daily check-in and other small XP sources (can wait for 4-spec):** what exactly counts as a check-in, and what else gives small XP, is not yet decided.
- **Assumption, fighting (can wait):** demons and soldiers animate in a loop, with no playable combat.
- **Camera fallback (can wait for 4-spec):** the exact form of the no-camera fallback is not yet decided.
- **Assumption, persistence (before 4-spec):** data stays on the device.
- **Level 0 demo (can wait):** exactly what the demo shows is not yet decided.
- **Project name (can wait):** still the working title.
- **Quotes (can wait):** where the real quotes come from, and how many to include.
