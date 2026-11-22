// Ember Duel — one side of the duel (the player or Cinder).
// A side owns a deck, a hand, a discard pile, life, shield, ember and burn.
import { buildDeck } from './cards.js';
import { shuffle } from './rng.js';

export function makeSide(rng, life = 30) {
  return {
    life,
    maxLife: life,
    shield: 0,
    ember: 3,
    maxEmber: 10,
    burn: 0,
    deck: shuffle(buildDeck(), rng),
    hand: [],
    discard: [],
    playedElements: [],
  };
}

export const HAND_MAX = 7;

// Draw n cards; an empty deck reshuffles the discard pile first.
export function drawCards(side, rng, n) {
  for (let i = 0; i < n; i++) {
    if (side.hand.length >= HAND_MAX) return;
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      side.deck = shuffle(side.discard, rng);
      side.discard = [];
    }
    side.hand.push(side.deck.pop());
  }
}

// Damage is absorbed by shield first, then life. Returns damage to life.
export function takeDamage(side, amount) {
  const absorbed = Math.min(side.shield, amount);
  side.shield -= absorbed;
  const toLife = amount - absorbed;
  side.life -= toLife;
  return toLife;
}
