// Shop: spend coins on soldiers and weapons. Soldiers are named as they are bought.

import { getState, update } from '../store.js';
import { armyOf, buyItem } from '../rewards.js';
import { play } from '../audio.js';
import { CATALOG, FIRST_SOLDIER_NAME } from '../../data/catalog.js';

const $ = (id) => document.getElementById(id);

let app;
let naming = null; // the soldier being named, while the name window is open

function spritePath(item) {
  return `assets/sprites/${item.sprite}.svg`;
}

function itemRow(item) {
  const state = getState();
  const owned = state.army.filter((entry) => entry.catalogId === item.id).length;

  const row = document.createElement('li');
  row.className = 'shop-item';

  const art = document.createElement('img');
  art.className = 'shop-item__art';
  art.src = spritePath(item);
  art.alt = '';

  const body = document.createElement('div');
  body.className = 'shop-item__body';
  const name = document.createElement('span');
  name.className = 'shop-item__name';
  name.textContent = item.label;
  const have = document.createElement('span');
  have.className = 'shop-item__owned';
  have.textContent = owned ? `Owned: ${owned}` : 'Not owned yet';
  body.append(name, have);

  const buy = document.createElement('button');
  buy.className = 'btn btn--small shop-item__buy';
  buy.type = 'button';
  buy.classList.toggle('is-short', state.coins < item.price);
  buy.setAttribute('aria-label', `Buy ${item.label} for ${item.price} coins`);
  const coin = document.createElement('span');
  coin.className = 'coin';
  buy.append(coin, String(item.price));
  buy.addEventListener('click', () => startPurchase(item));

  row.append(art, body, buy);
  return row;
}

function render() {
  $('shop-coins').textContent = getState().coins.toLocaleString();
  $('shop-soldiers').replaceChildren(...CATALOG.filter((item) => item.kind === 'soldier').map(itemRow));
  $('shop-weapons').replaceChildren(...CATALOG.filter((item) => item.kind === 'weapon').map(itemRow));
}

function startPurchase(item) {
  const { coins } = getState();
  if (coins < item.price) {
    const short = item.price - coins;
    app.notify(`Not enough coins. ${item.label} costs ${item.price} and you have ${coins}. Finish a quest to earn ${short} more.`, 'Shop');
    return;
  }
  if (item.kind === 'weapon') {
    finishPurchase(item, null);
    return;
  }

  // Soldiers are named before they join. The very first one gets a suggestion.
  naming = item;
  $('name-art').src = spritePath(item);
  $('name-prompt').textContent = `Name your ${item.label}.`;
  $('name-input').value = armyOf(getState()).soldiers.length === 0 ? FIRST_SOLDIER_NAME : '';
  $('name-error').hidden = true;
  $('name-sheet').showModal();
  $('name-input').select();
}

async function finishPurchase(item, name) {
  let result;
  update((state) => {
    result = buyItem(state, item.id, name);
  });
  if (!result.ok) return result;

  play('purchase');
  render();
  if (result.owned.name) await app.arise({ sprite: spritePath(item), name: result.owned.name });
  const joined = result.owned.name ? `${result.owned.name} has joined your army.` : `${item.label} added to your camp.`;
  const look = await app.confirm(joined, 'Arise', { yes: 'See it', no: 'Keep shopping' });
  if (look) app.go('battleground');
  return result;
}

export function initShop(theApp) {
  app = theApp;
  app.register('shop', { enter: render });

  $('shop-back').addEventListener('click', () => app.go('today'));
  $('shop-battleground').addEventListener('click', () => app.go('battleground'));

  $('name-cancel').addEventListener('click', () => $('name-sheet').close());
  $('name-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = $('name-input').value.trim();
    $('name-error').hidden = Boolean(name);
    if (!name) return;
    $('name-sheet').close();
    finishPurchase(naming, name);
  });
}
