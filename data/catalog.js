// Everything the Shop sells. Soldiers get a name from you and stand by your fire;
// weapons are planted in the ground around it.
// To add an item: draw assets/sprites/<sprite>.svg and add a line here.

export const CATALOG = [
  { id: 'swordsman', kind: 'soldier', label: 'Shadow Swordsman', price: 20, sprite: 'soldier-swordsman' },
  { id: 'archer', kind: 'soldier', label: 'Shadow Archer', price: 35, sprite: 'soldier-archer' },
  { id: 'mage', kind: 'soldier', label: 'Shadow Mage', price: 50, sprite: 'soldier-mage' },
  { id: 'knight', kind: 'soldier', label: 'Shadow Knight', price: 80, sprite: 'soldier-knight' },
  { id: 'sword', kind: 'weapon', label: 'Iron Sword', price: 10, sprite: 'weapon-sword' },
  { id: 'spear', kind: 'weapon', label: 'War Spear', price: 15, sprite: 'weapon-spear' },
  { id: 'axe', kind: 'weapon', label: 'Battle Axe', price: 25, sprite: 'weapon-axe' },
];

// Demons are not for sale. They gather on the Battleground as your level rises.
export const DEMON_SPRITES = ['demon-imp', 'demon-brute'];

// The name suggested for the very first soldier you buy.
export const FIRST_SOLDIER_NAME = 'Sung Jinwoo';
export const MAX_SOLDIER_NAME = 16;
