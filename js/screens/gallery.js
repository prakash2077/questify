// Proof Gallery: every cleared penalty with its photo and date, newest first.

import { getState, loadPhoto } from '../store.js';

const $ = (id) => document.getElementById(id);

let photoUrls = [];

function formatDate(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

async function proofTile(proof) {
  const tile = document.createElement('li');
  tile.className = 'gallery__tile';
  const caption = `${formatDate(proof.date)} · ${proof.questName}`;

  const blob = proof.hasPhoto ? await loadPhoto(proof.id).catch(() => null) : null;
  if (blob) {
    const url = URL.createObjectURL(blob);
    photoUrls.push(url);
    const open = document.createElement('button');
    open.className = 'gallery__photo';
    open.type = 'button';
    open.setAttribute('aria-label', `Open photo: ${caption}`);
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    open.append(img);
    open.addEventListener('click', () => {
      $('photo-view-img').src = url;
      $('photo-view-img').alt = `Penalty proof, ${caption}`;
      $('photo-view-caption').textContent = `${caption}. Penalty: ${proof.penalty}`;
      $('photo-view').showModal();
    });
    tile.append(open);
  } else {
    const empty = document.createElement('div');
    empty.className = 'gallery__photo gallery__photo--none';
    empty.textContent = 'No photo';
    tile.append(empty);
  }

  const label = document.createElement('p');
  label.className = 'gallery__caption';
  label.textContent = caption;
  tile.append(label);
  return tile;
}

export async function renderGallery() {
  releaseGallery();
  const proofs = [...getState().proofs].reverse();
  $('gallery-empty').hidden = proofs.length > 0;
  $('gallery').replaceChildren(...(await Promise.all(proofs.map(proofTile))));
}

// Lets the browser free the photos once the gallery is no longer on screen.
export function releaseGallery() {
  photoUrls.forEach((url) => URL.revokeObjectURL(url));
  photoUrls = [];
}

export function initGallery() {
  $('photo-view-close').addEventListener('click', () => $('photo-view').close());
}
