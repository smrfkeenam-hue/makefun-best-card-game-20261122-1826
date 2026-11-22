// Ember Duel — deterministic screenshot states.
// Each shot drives the real engine (no hand-built DOM), so every screenshot
// is a true render of the game's own code at a real game state.
import { cardById } from './cards.js';
import { checkEnd, endPlayerTurn, playCard, startGame } from './engine.js';

function firstPlayableIndex(state, minDmg = 0) {
  return state.player.hand.findIndex((id) => {
    const c = cardById(id);
    return c.cost <= state.player.ember && c.dmg >= minDmg;
  });
}

function firstPlayableEnemyIndex(state, minDmg = 0) {
  return state.enemy.hand.findIndex((id) => {
    const c = cardById(id);
    return c.cost <= state.enemy.ember && c.dmg >= minDmg;
  });
}

// A mid-game table: two player cards (resonance when possible), then
// Cinder answers and turn 2 begins.
function shotTable(state) {
  startGame(state);
  const first = firstPlayableIndex(state);
  if (first >= 0) {
    const played = playCard(state, 'player', first);
    if (played.ok) {
      const el = played.card.element;
      const second = state.player.hand.findIndex((id) => {
        const c = cardById(id);
        return c.element === el && c.cost <= state.player.ember;
      });
      if (second >= 0) playCard(state, 'player', second);
    }
  }
  endPlayerTurn(state);
}

// A finished duel, won: Cinder is left at 1 life and falls to one card.
function shotWin(state) {
  startGame(state);
  state.enemy.life = 1;
  let idx = firstPlayableIndex(state, 1);
  if (idx < 0) {
    // No damaging card in hand: the scripted setup draws one from the deck.
    state.player.hand.push('spark');
    idx = state.player.hand.length - 1;
  }
  playCard(state, 'player', idx);
  const end = checkEnd(state);
  if (end) state.phase = end;
}

// A finished duel, lost: Cinder lands the killing blow.
function shotLoss(state) {
  startGame(state);
  state.player.life = 1;
  state.enemy.hand = ['fireball', 'spark', 'shard'];
  state.enemy.ember = 10;
  const idx = firstPlayableEnemyIndex(state, 1);
  if (idx >= 0) playCard(state, 'enemy', idx);
  const end = checkEnd(state);
  if (end) state.phase = end;
}

export function applyShot(state, name) {
  if (name === 'table') shotTable(state);
  else if (name === 'win') shotWin(state);
  else if (name === 'loss') shotLoss(state);
  // 'title' needs nothing: a fresh game already shows the title screen.
}
