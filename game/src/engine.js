// Ember Duel — the rules engine. Pure logic, no DOM: given a state and a
// move it applies the rules and records what happened in the log.
//
// Turn flow: at the start of your turn you take burn, then table-burn from
// turn 10, gain 3 ember (cap 10) and draw 1 card (hand cap 7). Playing a
// card costs its ember; playing a second card of an element you already
// played this turn resonates: +2 to its damage (or shield when it deals
// no damage). Cinder, the AI, then takes its own turn the same way.
import { cardById } from './cards.js';
import { drawCards, makeSide, takeDamage } from './deck.js';
import { mulberry32 } from './rng.js';
import { aiTakeTurn } from './ai.js';

export const START_LIFE = 30;
export const EMBER_PER_TURN = 3;
export const TABLE_BURN_START_TURN = 10;

export function newGame(seed) {
  const rng = mulberry32(seed);
  const state = {
    seed,
    turn: 1,
    phase: 'title', // title | playing | won | lost | draw
    player: makeSide(rng, 30),
    // Cinder holds 34 life: you move first each round, and that edge is
    // worth about 4 life in the damage race (measured over 300 mirror games).
    enemy: makeSide(rng, 34),
    log: [],
    lastPlayed: null, // { by: 'player' | 'enemy', card }
    rng,
  };
  drawCards(state.player, rng, 4);
  drawCards(state.enemy, rng, 4);
  return state;
}

export function log(state, text) {
  state.log.push(text);
  if (state.log.length > 40) state.log.shift();
}

function otherKey(key) {
  return key === 'player' ? 'enemy' : 'player';
}

function nameOf(state, key) {
  return key === 'player' ? 'You' : 'Cinder';
}

// Start-of-turn effects for one side: burn ticks, table-burn, ember, draw.
// The enemy's very first turn grants no income: both sides open with the
// same 3 ember and 4 cards, so the duel is symmetric from turn 1.
export function startTurn(state, key, income = true) {
  const side = state[key];
  side.playedElements = [];
  if (side.burn > 0) {
    const dmg = side.burn;
    side.burn = 0;
    const toLife = takeDamage(side, dmg);
    log(state, `${nameOf(state, key)} burn for ${dmg} (${toLife} to life).`);
  }
  if (state.turn >= TABLE_BURN_START_TURN) {
    const burn = state.turn - (TABLE_BURN_START_TURN - 1);
    const toLife = takeDamage(side, burn);
    log(state, `Table-burn scorches ${nameOf(state, key)} for ${burn} (${toLife} to life).`);
  }
  if (!income) return;
  side.ember = Math.min(side.maxEmber, side.ember + EMBER_PER_TURN);
  drawCards(side, state.rng, 1);
}

// Play the card at handIndex for the given side. Returns { ok, reason }.
export function playCard(state, key, handIndex) {
  const side = state[key];
  const foe = state[otherKey(key)];
  const cardId = side.hand[handIndex];
  if (cardId === undefined) return { ok: false, reason: 'no such card' };
  const card = cardById(cardId);
  if (side.ember < card.cost) return { ok: false, reason: 'not enough ember' };

  const resonance = side.playedElements.includes(card.element);
  side.ember -= card.cost;
  side.hand.splice(handIndex, 1);
  side.discard.push(cardId);
  side.playedElements.push(card.element);

  let dmg = card.dmg;
  let shield = card.shield;
  if (resonance) {
    if (dmg > 0) dmg += 2;
    else shield += 2;
  }

  const bits = [];
  if (dmg > 0) {
    const toLife = takeDamage(foe, dmg);
    bits.push(`deals ${dmg} damage${toLife < dmg ? ` (${dmg - toLife} blocked)` : ''}`);
    if (card.burn > 0) {
      foe.burn = Math.max(foe.burn, card.burn);
      bits.push(`burns ${nameOf(state, otherKey(key))} for ${card.burn}`);
    }
  }
  if (shield > 0) {
    side.shield += shield;
    bits.push(`gains ${shield} shield`);
  }
  if (card.draw > 0) {
    drawCards(side, state.rng, card.draw);
    bits.push(`draws ${card.draw}`);
  }
  if (card.ember > 0) {
    side.ember = Math.min(side.maxEmber, side.ember + card.ember);
    bits.push(`gains ${card.ember} ember`);
  }
  log(
    state,
    `${nameOf(state, key)} plays ${card.name}${resonance ? ' — RESONANCE +2!' : ''} (${bits.join(', ')}).`,
  );
  state.lastPlayed = { by: key, card };
  return { ok: true, card, resonance };
}

export function checkEnd(state) {
  const pDead = state.player.life <= 0;
  const eDead = state.enemy.life <= 0;
  if (pDead && eDead) return 'draw';
  if (eDead) return 'won';
  if (pDead) return 'lost';
  return null;
}

// End the player's turn: Cinder acts, then a new player turn begins.
// Returns the end state: 'won' | 'lost' | 'draw' | null.
export function endPlayerTurn(state) {
  // Cinder's first turn grants no income (see startTurn): both sides open
  // with 3 ember and 4 cards.
  startTurn(state, 'enemy', state.turn > 1);
  let end = checkEnd(state);
  if (end) {
    state.phase = end;
    return end;
  }
  aiTakeTurn(state);
  end = checkEnd(state);
  if (end) {
    state.phase = end;
    return end;
  }
  state.turn += 1;
  startTurn(state, 'player');
  end = checkEnd(state);
  if (end) state.phase = end;
  return end;
}

export function startGame(state) {
  state.phase = 'playing';
  log(state, 'The duel begins. Turn 1 — you have 3 ember and 4 cards.');
  log(state, 'Resonance: a second card of the same element in one turn hits +2.');
}
