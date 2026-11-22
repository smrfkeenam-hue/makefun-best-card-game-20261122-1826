// Ember Duel — boot and input. Wires the engine to the table: buttons,
// clicks and keys. The engine itself stays pure (see engine.js).
import { checkEnd, endPlayerTurn, newGame, playCard, startGame } from './engine.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { sfx } from './sound.js';

const root = document.getElementById('app');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number.parseInt(params.get('seed') || '7', 10) || 7;

let state = newGame(seed);
if (shot) applyShot(state, shot);

const ui = {
  root,
  onPlay(index) {
    if (state.phase !== 'playing') return;
    const before = state.player.hand.length;
    const result = playCard(state, 'player', index);
    if (!result.ok) return;
    if (result.card.dmg > 0) sfx.damage();
    else if (result.card.shield > 0) sfx.shield();
    else sfx.play();
    if (state.player.hand.length < before) sfx.draw();
    const end = checkEnd(state);
    if (end) {
      state.phase = end;
      if (end === 'won') sfx.win();
      else sfx.lose();
    }
    render(state, ui);
  },
};

function endTurn() {
  if (state.phase !== 'playing') return;
  sfx.turn();
  const end = endPlayerTurn(state);
  if (end === 'won') sfx.win();
  else if (end === 'lost' || end === 'draw') sfx.lose();
  render(state, ui);
}

function replay() {
  state = newGame((Date.now() % 2147483647) || 1);
  startGame(state);
  render(state, ui);
}

document.getElementById('start-btn').addEventListener('click', () => {
  startGame(state);
  sfx.turn();
  render(state, ui);
});
document.getElementById('end-turn').addEventListener('click', endTurn);
document.getElementById('win-again').addEventListener('click', replay);
document.getElementById('loss-again').addEventListener('click', replay);
document.getElementById('rules-btn').addEventListener('click', () => {
  document.getElementById('rules').classList.toggle('hidden');
});

window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && state.phase === 'title') {
    startGame(state);
    render(state, ui);
  } else if (ev.key === ' ' && state.phase === 'playing') {
    ev.preventDefault();
    endTurn();
  } else if (ev.key === 'r' || ev.key === 'R') {
    if (state.phase === 'won' || state.phase === 'lost' || state.phase === 'draw') replay();
  } else if (state.phase === 'playing' && /^[1-7]$/.test(ev.key)) {
    ui.onPlay(Number.parseInt(ev.key, 10) - 1);
  }
});

render(state, ui);
