// Ember Duel — Cinder, the Ash Warden.
// Cinder plays greedily and openly: each turn it keeps playing the best
// affordable card until its ember runs out. Its scoring is visible in the
// log, so a player can read what it values and play around it: it loves
// damage, then shield, then draw, and it chases resonance like you do.
import { cardById } from './cards.js';
import { playCard } from './engine.js';

export function scoreCard(card, side) {
  let score = card.dmg + card.shield + card.draw * 2 + card.ember * 1.5 + card.burn;
  if (side.playedElements.includes(card.element)) score += 2;
  return score;
}

// Play Cinder's whole turn synchronously. Cinder plays at most three cards
// a turn — it picks its best, so it stays readable, and the extra card
// balances the player's first-move edge in the damage race. Returns the
// cards it played.
export function aiTakeTurn(state) {
  const side = state.enemy;
  const played = [];
  for (let plays = 0; plays < 3; plays++) {
    let best = -1;
    let bestScore = -1;
    for (let i = 0; i < side.hand.length; i++) {
      const card = cardById(side.hand[i]);
      if (card.cost > side.ember) continue;
      const score = scoreCard(card, side);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best < 0) break;
    const result = playCard(state, 'enemy', best);
    if (result.ok) played.push(result.card);
    else break;
  }
  return played;
}
