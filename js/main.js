// Starts the app and decides which screen is showing.

import { getState } from './store.js';
import { initSetup } from './screens/setup.js';
import { initToday } from './screens/today.js';

const screens = {}; // name -> { enter, leave }
let current = null;

function register(name, handlers) {
  screens[name] = handlers;
}

// Show exactly one screen at a time.
function go(name) {
  screens[current]?.leave?.();
  current = name;
  for (const el of document.querySelectorAll('.screen')) {
    el.classList.toggle('is-active', el.dataset.screen === name);
  }
  window.scrollTo(0, 0);
  screens[name]?.enter?.();
}

// ---------- System message window ----------

const noticeEl = document.getElementById('notice');
const noticeTitle = document.getElementById('notice-title');
const noticeText = document.getElementById('notice-text');
const noticeYes = document.getElementById('notice-yes');
const noticeNo = document.getElementById('notice-no');

// Shows a message and resolves with true (OK / Yes) or false (No / dismissed).
function showNotice({ text, title = 'Notification', yes = 'OK', no = null }) {
  return new Promise((resolve) => {
    noticeTitle.textContent = title;
    noticeText.textContent = text;
    noticeYes.textContent = yes;
    noticeNo.textContent = no ?? '';
    noticeNo.hidden = !no;

    const finish = (answer) => {
      noticeEl.close();
      resolve(answer);
    };
    noticeYes.onclick = () => finish(true);
    noticeNo.onclick = () => finish(false);
    noticeEl.oncancel = (event) => {
      event.preventDefault();
      finish(false);
    };
    noticeEl.showModal();
  });
}

// What each screen is handed so it can move around and talk to the user.
const app = {
  go,
  register,
  notify: (text, title) => showNotice({ text, title }),
  confirm: (text, title) => showNotice({ text, title, yes: 'Yes', no: 'No' }),
};

initSetup(app);
initToday(app);

document.getElementById('gate').addEventListener('click', () => {
  go(getState().profile.setupDone ? 'today' : 'setup');
});
