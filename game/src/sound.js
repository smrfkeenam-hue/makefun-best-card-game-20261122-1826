// Ember Duel — tiny WebAudio synth. No audio files: every sound is an
// oscillator shaped in code. The context is created lazily on the first
// user gesture (browsers block audio before one) and every call is guarded,
// so a headless run or a blocked context can never throw.
let ctx = null;

function audio() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

function tone(freq, dur, type, gain, when = 0) {
  const ac = audio();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ac.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + dur);
  } catch {
    // Sound is garnish; a failure here must never break the game.
  }
}

export const sfx = {
  play() {
    tone(520, 0.09, 'triangle', 0.12);
    tone(780, 0.12, 'triangle', 0.08, 0.05);
  },
  damage() {
    tone(160, 0.18, 'sawtooth', 0.14);
    tone(90, 0.22, 'square', 0.08, 0.02);
  },
  shield() {
    tone(880, 0.1, 'sine', 0.1);
    tone(1174, 0.14, 'sine', 0.07, 0.06);
  },
  draw() {
    tone(660, 0.06, 'sine', 0.06);
  },
  turn() {
    tone(440, 0.08, 'triangle', 0.08);
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.11));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.26, 'triangle', 0.1, i * 0.13));
  },
};
