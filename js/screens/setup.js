// Setup: date of birth, lifespan, the goal and its first quests. Shown once.
// Also owns the "New quest" form, which Today reuses.

import { getState, update } from '../store.js';
import {
  DEFAULT_LIFESPAN_YEARS,
  MAX_LIFESPAN_YEARS,
  PENALTY_IDEAS,
  PRIORITIES,
  QUEST_LIMIT_MESSAGE,
} from '../config.js';
import { addQuest, canAddQuest, dateStr, deadlineTime, removeQuest } from '../quests.js';
import { weeksLeft, weeksTotal } from '../weeks-grid.js';

const $ = (id) => document.getElementById(id);

let app;

// ---------- Small shared pieces ----------

// Priority as one to three diamonds.
function priorityBadge(priority) {
  const badge = document.createElement('span');
  badge.className = 'pips';
  for (let i = 1; i <= PRIORITIES.length; i++) {
    const pip = document.createElement('span');
    pip.className = i <= priority ? 'pip is-on' : 'pip';
    badge.append(pip);
  }
  badge.setAttribute('aria-hidden', 'true');
  return badge;
}

function priorityLabel(priority) {
  return PRIORITIES.find((p) => p.value === priority)?.label ?? '';
}

// Deadline in the device's own clock style, e.g. 21:00 or 9:00 PM.
function formatTime(deadline) {
  const [hh, mm] = deadline.split(':').map(Number);
  return new Date(2000, 0, 1, hh, mm).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// The text half of a quest row: name, priority, then the deadline with any extras after it.
// Pass a date to show the deadline that applies on that day.
export function questSummary(quest, { date = null, extras = [] } = {}) {
  const body = document.createElement('div');
  body.className = 'quest__body';

  const name = document.createElement('span');
  name.className = 'quest__name';
  name.textContent = quest.name;

  const priority = document.createElement('span');
  priority.className = 'quest__meta';
  priority.append(priorityBadge(quest.priority), priorityLabel(quest.priority));

  const due = document.createElement('span');
  due.className = 'quest__meta';
  due.append(`Due ${formatTime(date ? deadlineTime(quest, date) : quest.deadline)}`, ...extras);

  body.append(name, priority, due);
  return body;
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = !message;
}

// ---------- The three steps ----------

function showStep(step) {
  for (const el of document.querySelectorAll('.setup-step')) {
    el.hidden = Number(el.dataset.step) !== step;
  }
  $('setup-progress').textContent = `Step ${step} of 3`;
  window.scrollTo(0, 0);
  if (step === 3) renderQuests();
}

// Returns { dob, lifespanYears } or { error }.
function readProfile() {
  const dob = $('setup-dob').value;
  const lifespanYears = Number($('setup-lifespan').value);
  if (!dob) return { error: 'Enter your date of birth.' };
  if (dob >= dateStr()) return { error: 'Your date of birth needs to be in the past.' };
  if (!Number.isInteger(lifespanYears) || lifespanYears < 1) return { error: 'Enter a lifespan in whole years.' };
  if (lifespanYears > MAX_LIFESPAN_YEARS) return { error: `Keep the lifespan to ${MAX_LIFESPAN_YEARS} years or less.` };
  if (weeksLeft({ dob, lifespanYears }) === 0) return { error: 'The lifespan needs to be longer than your age today.' };
  return { dob, lifespanYears };
}

function renderWeeks() {
  const profile = readProfile();
  const readout = $('setup-weeks');
  readout.hidden = Boolean(profile.error);
  if (profile.error) return;

  const left = document.createElement('strong');
  left.textContent = weeksLeft(profile).toLocaleString();
  readout.replaceChildren(
    'You have about ',
    left,
    ` weeks ahead of you, out of ${weeksTotal(profile.lifespanYears).toLocaleString()}. Let's make them count.`,
  );
}

function renderQuests() {
  const { quests } = getState();
  const rows = quests.map((quest) => {
    const row = document.createElement('li');
    row.className = 'quest';

    const body = questSummary(quest);
    const penalty = document.createElement('span');
    penalty.className = 'quest__penalty';
    penalty.textContent = `Penalty: ${quest.penalty}`;
    body.append(penalty);

    const remove = document.createElement('button');
    remove.className = 'icon-btn';
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove quest: ${quest.name}`);
    remove.addEventListener('click', () => {
      update((state) => removeQuest(state, quest.id));
      renderQuests();
    });

    row.append(body, remove);
    return row;
  });

  $('setup-quests').replaceChildren(...rows);
  $('setup-finish').disabled = quests.length === 0;
}

// ---------- The "New quest" form ----------

let afterAdd = null;

// Opens the form, or explains the three-quest limit. Calls onAdded once a quest is saved.
export async function openQuestSheet(onAdded) {
  if (!canAddQuest(getState())) {
    await app.notify(QUEST_LIMIT_MESSAGE);
    return;
  }
  afterAdd = onAdded;
  $('quest-form').reset();
  showError($('quest-error'), '');
  $('quest-sheet').showModal();
}

async function submitQuest(event) {
  event.preventDefault();
  let result;
  update((state) => {
    result = addQuest(state, {
      name: $('quest-name').value,
      deadline: $('quest-deadline').value,
      priority: new FormData($('quest-form')).get('priority'),
      penalty: $('quest-penalty').value,
    });
  });

  if (!result.ok && result.reason === 'invalid') {
    showError($('quest-error'), 'Give the quest a name, a deadline and a penalty.');
    return;
  }
  $('quest-sheet').close();
  if (!result.ok) {
    await app.notify(QUEST_LIMIT_MESSAGE);
    return;
  }
  if (result.quest.startsOn > dateStr()) {
    await app.notify('That deadline has already passed today, so this quest starts tomorrow.');
  }
  afterAdd?.(result.quest);
}

function buildQuestForm() {
  // Priority choices, Medium picked by default.
  const options = PRIORITIES.flatMap(({ value, label }) => {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'priority';
    input.id = `quest-priority-${value}`;
    input.value = value;
    input.defaultChecked = value === 2;
    const option = document.createElement('label');
    option.htmlFor = input.id;
    option.append(priorityBadge(value), label);
    return [input, option];
  });
  $('quest-priority').append(...options);

  // Tapping an idea fills in the penalty.
  const ideas = PENALTY_IDEAS.map((idea) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.textContent = idea;
    chip.addEventListener('click', () => {
      $('quest-penalty').value = idea;
    });
    return chip;
  });
  $('quest-penalty-ideas').append(...ideas);

  $('quest-form').addEventListener('submit', submitQuest);
  $('quest-cancel').addEventListener('click', () => $('quest-sheet').close());
}

// ---------- Wiring ----------

export function initSetup(theApp) {
  app = theApp;
  buildQuestForm();

  app.register('setup', {
    enter() {
      // Pick up where a half-finished setup left off.
      const { profile, goal } = getState();
      $('setup-dob').value = profile.dob ?? '';
      $('setup-dob').max = dateStr();
      $('setup-lifespan').value = profile.lifespanYears ?? DEFAULT_LIFESPAN_YEARS;
      $('setup-goal').value = goal?.name ?? '';
      renderWeeks();
      showStep(1);
    },
  });

  for (const id of ['setup-dob', 'setup-lifespan']) {
    $(id).addEventListener('input', () => {
      showError($('setup-error-1'), '');
      renderWeeks();
    });
  }

  const [stepOne, stepTwo] = document.querySelectorAll('form.setup-step');

  stepOne.addEventListener('submit', (event) => {
    event.preventDefault();
    const profile = readProfile();
    showError($('setup-error-1'), profile.error ?? '');
    if (profile.error) return;
    update((state) => Object.assign(state.profile, profile));
    showStep(2);
  });

  stepTwo.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('setup-goal').value.trim();
    showError($('setup-error-2'), name ? '' : 'Give your goal a name.');
    if (!name) return;
    update((state) => {
      state.goal = { id: state.goal?.id ?? 'goal-1', name };
    });
    showStep(3);
  });

  for (const back of document.querySelectorAll('[data-back]')) {
    back.addEventListener('click', () => {
      showStep(Number(back.closest('.setup-step').dataset.step) - 1);
    });
  }

  $('setup-add-quest').addEventListener('click', () => openQuestSheet(renderQuests));

  $('setup-finish').addEventListener('click', () => {
    update((state) => {
      state.profile.setupDone = true;
    });
    app.go('today');
  });
}
