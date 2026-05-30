// Tiny WebAudio sound-effect engine. All sounds are synthesized in code,
// so there are no audio files to load.

let ctx = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  // Browsers require a user gesture before audio can start.
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Play a single tone.
function tone(freq, start, dur, type = 'square', gain = 0.15) {
  const a = ac();
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(0.0001, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, a.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  osc.connect(g).connect(a.destination);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + dur + 0.02);
}

export const Sfx = {
  // call once on first user gesture to unlock audio
  unlock() { try { ac(); } catch (_) {} },

  correct() {
    tone(523.25, 0, 0.12, 'square', 0.18); // C5
    tone(659.25, 0.10, 0.12, 'square', 0.18); // E5
    tone(783.99, 0.20, 0.18, 'square', 0.2); // G5
  },
  wrong() {
    tone(196, 0, 0.18, 'sawtooth', 0.16);
    tone(146.83, 0.14, 0.22, 'sawtooth', 0.16);
  },
  collect() {
    tone(880, 0, 0.08, 'square', 0.15);
    tone(1174.66, 0.07, 0.12, 'square', 0.15);
  },
  jump() {
    tone(330, 0, 0.08, 'triangle', 0.1);
  },
  portal() {
    tone(440, 0, 0.18, 'sine', 0.18);
    tone(554.37, 0.12, 0.18, 'sine', 0.18);
    tone(659.25, 0.24, 0.18, 'sine', 0.18);
    tone(880, 0.36, 0.4, 'sine', 0.2);
  },
  click() {
    tone(600, 0, 0.05, 'square', 0.08);
  },
};
