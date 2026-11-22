// Ember Duel — the card pool.
// Sixteen cards in four elements. Each card is one plain object:
//   id, name, element, cost (ember), dmg, shield, draw, ember, burn, text.
// burn = damage the target takes at the start of its next turn.
export const ELEMENTS = {
  flame: { key: 'flame', name: 'Flame', color: '#e2482e', dark: '#8f1d0c', glyph: 'M12 2 L19 13 L15 13 L20 22 L4 22 L9 13 L5 13 Z' },
  frost: { key: 'frost', name: 'Frost', color: '#3fa7d6', dark: '#155a7d', glyph: 'M12 2 L12 22 M4 6 L20 18 M20 6 L4 18 M12 2 L15 6 L9 6 Z' },
  gale: { key: 'gale', name: 'Gale', color: '#4caf6d', dark: '#1e5c33', glyph: 'M4 8 Q12 2 20 8 Q12 14 4 8 M6 14 Q13 9 19 14 Q13 19 6 14 M8 20 Q13 16 18 20' },
  stone: { key: 'stone', name: 'Stone', color: '#a08a6a', dark: '#5d4a33', glyph: 'M5 5 L19 5 L19 19 L5 19 Z M8 8 L16 8 L16 16 L8 16 Z' },
};

export const CARDS = [
  // Flame — pure damage, some burn.
  { id: 'spark',    name: 'Spark',    element: 'flame', cost: 1, dmg: 3, shield: 0, draw: 0, ember: 0, burn: 0, text: 'Deal 3 damage.' },
  { id: 'blaze',    name: 'Blaze',    element: 'flame', cost: 2, dmg: 4, shield: 0, draw: 0, ember: 0, burn: 2, text: 'Deal 4 damage. Burn 2.' },
  { id: 'fireball', name: 'Fireball', element: 'flame', cost: 3, dmg: 6, shield: 0, draw: 0, ember: 0, burn: 0, text: 'Deal 6 damage.' },
  { id: 'phoenix',  name: 'Phoenix',  element: 'flame', cost: 4, dmg: 8, shield: 0, draw: 0, ember: 0, burn: 1, text: 'Deal 8 damage. Burn 1.' },
  // Frost — damage plus shield.
  { id: 'shard',    name: 'Shard',    element: 'frost', cost: 1, dmg: 2, shield: 2, draw: 0, ember: 0, burn: 0, text: 'Deal 2 damage. Shield 2.' },
  { id: 'freeze',   name: 'Freeze',   element: 'frost', cost: 2, dmg: 3, shield: 4, draw: 0, ember: 0, burn: 0, text: 'Deal 3 damage. Shield 4.' },
  { id: 'spike',    name: 'Glacial Spike', element: 'frost', cost: 3, dmg: 5, shield: 3, draw: 0, ember: 0, burn: 0, text: 'Deal 5 damage. Shield 3.' },
  { id: 'blizzard', name: 'Blizzard', element: 'frost', cost: 4, dmg: 7, shield: 2, draw: 0, ember: 0, burn: 0, text: 'Deal 7 damage. Shield 2.' },
  // Gale — damage plus draw or ember.
  { id: 'gust',     name: 'Gust',     element: 'gale', cost: 1, dmg: 2, shield: 0, draw: 1, ember: 0, burn: 0, text: 'Deal 2 damage. Draw 1.' },
  { id: 'zephyr',   name: 'Zephyr',   element: 'gale', cost: 2, dmg: 3, shield: 0, draw: 0, ember: 2, burn: 0, text: 'Deal 3 damage. Gain 2 ember.' },
  { id: 'cyclone',  name: 'Cyclone',  element: 'gale', cost: 3, dmg: 5, shield: 0, draw: 1, ember: 0, burn: 0, text: 'Deal 5 damage. Draw 1.' },
  { id: 'tempest',  name: 'Tempest',  element: 'gale', cost: 4, dmg: 6, shield: 0, draw: 2, ember: 0, burn: 0, text: 'Deal 6 damage. Draw 2.' },
  // Stone — damage plus heavy shield.
  { id: 'pebble',   name: 'Pebble',   element: 'stone', cost: 1, dmg: 2, shield: 3, draw: 0, ember: 0, burn: 0, text: 'Deal 2 damage. Shield 3.' },
  { id: 'fortify',  name: 'Fortify',  element: 'stone', cost: 2, dmg: 0, shield: 7, draw: 0, ember: 0, burn: 0, text: 'Shield 7.' },
  { id: 'boulder',  name: 'Boulder',  element: 'stone', cost: 3, dmg: 4, shield: 5, draw: 0, ember: 0, burn: 0, text: 'Deal 4 damage. Shield 5.' },
  { id: 'avalanche', name: 'Avalanche', element: 'stone', cost: 4, dmg: 8, shield: 2, draw: 0, ember: 0, burn: 0, text: 'Deal 8 damage. Shield 2.' },
];

export function cardById(id) {
  return CARDS.find((c) => c.id === id);
}

// A 24-card deck: per element, two copies of the 1- and 2-cost cards,
// one copy each of the 3- and 4-cost cards (6 per element x 4 elements).
export function buildDeck() {
  const deck = [];
  for (const el of ['flame', 'frost', 'gale', 'stone']) {
    const pool = CARDS.filter((c) => c.element === el);
    for (const c of pool) {
      const copies = c.cost <= 2 ? 2 : 1;
      for (let i = 0; i < copies; i++) deck.push(c.id);
    }
  }
  return deck;
}
