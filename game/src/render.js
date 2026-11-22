// Ember Duel — the table. Pure DOM rendering: given a state it rebuilds
// the table (hands, life bars, ember, log, last played card) and shows or
// hides the title / win / loss overlays. No game logic lives here.
import { ELEMENTS, cardById } from './cards.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function glyphSvg(elementKey, size) {
  const meta = ELEMENTS[elementKey];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', meta.glyph);
  path.setAttribute('fill', meta.color);
  path.setAttribute('stroke', '#fff');
  path.setAttribute('stroke-width', '1');
  svg.appendChild(path);
  return svg;
}

function lifeBar(side, label) {
  const wrap = el('div', 'life-wrap');
  const name = el('div', 'life-name', label);
  const bar = el('div', 'life-bar');
  const fill = el('div', 'life-fill');
  const pct = Math.max(0, (side.life / side.maxLife) * 100);
  fill.style.width = `${pct}%`;
  fill.classList.add(side.life <= 10 ? 'low' : 'ok');
  const num = el('span', 'life-num', `${Math.max(0, side.life)} / ${side.maxLife}`);
  bar.append(fill, num);
  wrap.append(name, bar);
  if (side.shield > 0) wrap.append(el('div', 'shield-badge', `🛡 ${side.shield}`));
  if (side.burn > 0) wrap.append(el('div', 'burn-badge', `🔥 burn ${side.burn}`));
  return wrap;
}

function cardNode(card, opts = {}) {
  const meta = ELEMENTS[card.element];
  const node = el('div', `card el-${card.element}`);
  if (opts.playable === false) node.classList.add('cant-play');
  if (opts.index !== undefined) node.dataset.index = String(opts.index);
  const cost = el('div', 'card-cost', String(card.cost));
  cost.title = 'Ember cost';
  const glyph = el('div', 'card-glyph');
  glyph.append(glyphSvg(card.element, 44));
  const name = el('div', 'card-name', card.name);
  const elName = el('div', 'card-element', meta.name);
  const stats = el('div', 'card-stats');
  if (card.dmg > 0) stats.append(el('span', 'stat dmg', `⚔ ${card.dmg}`));
  if (card.shield > 0) stats.append(el('span', 'stat shd', `🛡 ${card.shield}`));
  if (card.draw > 0) stats.append(el('span', 'stat drw', `⇪ draw ${card.draw}`));
  if (card.ember > 0) stats.append(el('span', 'stat emb', `+${card.ember} ember`));
  if (card.burn > 0) stats.append(el('span', 'stat brn', `🔥 burn ${card.burn}`));
  const text = el('div', 'card-text', card.text);
  node.append(cost, glyph, name, elName, stats, text);
  return node;
}

function cardBack() {
  const node = el('div', 'card card-back');
  node.append(glyphSvg('flame', 40));
  node.append(el('div', 'card-back-name', 'EMBER'));
  return node;
}

export function render(state, ui) {
  const { root } = ui;

  // Enemy row: portrait, life, hand count as face-down cards.
  const enemyRow = root.querySelector('#enemy-row');
  enemyRow.replaceChildren();
  const foe = el('div', 'fighter');
  foe.append(el('div', 'portrait enemy-portrait', 'C'));
  foe.append(lifeBar(state.enemy, 'Cinder, the Ash Warden'));
  const foeHand = el('div', 'mini-hand');
  for (let i = 0; i < state.enemy.hand.length; i++) foeHand.append(cardBack());
  foe.append(foeHand);
  enemyRow.append(foe);

  // Middle: last played card + the log.
  const mid = root.querySelector('#middle');
  mid.replaceChildren();
  const played = el('div', 'played');
  if (state.lastPlayed) {
    const who = state.lastPlayed.by === 'player' ? 'You played' : 'Cinder played';
    played.append(el('div', 'played-label', who));
    played.append(cardNode(state.lastPlayed.card));
  } else {
    played.append(el('div', 'played-label', 'No card played yet'));
    played.append(el('div', 'played-empty', 'Play a card from your hand.'));
  }
  const logBox = el('div', 'log');
  logBox.append(el('div', 'log-title', 'Duel log'));
  const list = el('div', 'log-list');
  for (const line of state.log.slice(-9)) list.append(el('div', 'log-line', line));
  logBox.append(list);
  mid.append(played, logBox);

  // Player row: life, ember pips, hand.
  const playerRow = root.querySelector('#player-row');
  playerRow.replaceChildren();
  const me = el('div', 'fighter');
  me.append(el('div', 'portrait player-portrait', 'Y'));
  me.append(lifeBar(state.player, 'You'));
  const ember = el('div', 'ember-row');
  ember.append(el('span', 'ember-label', 'Ember'));
  for (let i = 0; i < state.player.maxEmber; i++) {
    const pip = el('span', 'ember-pip' + (i < state.player.ember ? ' lit' : ''));
    pip.textContent = '●';
    ember.append(pip);
  }
  ember.append(el('span', 'ember-num', `${state.player.ember}/${state.player.maxEmber}`));
  me.append(ember);
  playerRow.append(me);

  const hand = root.querySelector('#hand');
  hand.replaceChildren();
  state.player.hand.forEach((cardId, i) => {
    const card = cardById(cardId);
    const node = cardNode(card, {
      index: i,
      playable: state.phase === 'playing' && card.cost <= state.player.ember,
    });
    node.addEventListener('click', () => ui.onPlay(i));
    hand.append(node);
  });
  if (state.player.hand.length === 0) {
    hand.append(el('div', 'hand-empty', 'Hand empty — end your turn to draw.'));
  }

  // Top bar: turn + table-burn warning + end turn.
  const turnLabel = root.querySelector('#turn-label');
  turnLabel.textContent =
    state.phase === 'playing'
      ? `Turn ${state.turn}` + (state.turn >= 10 ? ' — TABLE-BURN: both sides take damage each turn!' : '')
      : state.phase === 'title'
        ? 'Ember Duel'
        : state.phase === 'won'
          ? 'Victory!'
          : state.phase === 'draw'
            ? 'Draw'
            : 'Defeat';
  const endBtn = root.querySelector('#end-turn');
  endBtn.disabled = state.phase !== 'playing';

  // Overlays.
  root.querySelector('#title-screen').classList.toggle('hidden', state.phase !== 'title');
  root.querySelector('#win-screen').classList.toggle('hidden', state.phase !== 'won');
  const loss = root.querySelector('#loss-screen');
  loss.classList.toggle('hidden', state.phase !== 'lost' && state.phase !== 'draw');
  const lossTitle = loss.querySelector('h2');
  if (lossTitle) lossTitle.textContent = state.phase === 'draw' ? 'Draw — the embers die together' : 'Defeat — Cinder stands';
}
