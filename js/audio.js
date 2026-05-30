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

// ---------------------------------------------------------------------------
// Procedural ambient background music — calm, slow, piano-like notes in a major
// pentatonic scale over soft sustained pads, with a little echo. Original (not
// from any game), generated live so there are no audio files.
// ---------------------------------------------------------------------------
const MUSIC_VOL = 0.16;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
// C major pentatonic across two octaves: C D E G A …
const MELODY = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];
// Gentle, always-consonant pads (root + fifth + octave).
const PAD_ROOTS = [48, 53, 55, 45]; // C3, F3, G3, A2
const rand = (a, b) => a + Math.random() * (b - a);

export const Music = {
  enabled: true,
  _on: false,
  _bus: null,
  _mTimer: null,
  _pTimer: null,
  _padIdx: 0,

  _build(a) {
    this._a = a;
    const master = a.createGain();
    master.gain.value = 0.0001;
    const filter = a.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    // ambience: feedback delay
    const delay = a.createDelay();
    delay.delayTime.value = 0.34;
    const fb = a.createGain();
    fb.gain.value = 0.32;
    master.connect(filter);
    filter.connect(a.destination);
    filter.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(a.destination);
    this._bus = master;
  },

  _note(freq, dur, peak, type = 'triangle') {
    const a = this._a;
    const t = a.currentTime;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this._bus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  _melodyTick() {
    if (!this._on) return;
    if (this.enabled) {
      const n = MELODY[Math.floor(Math.random() * MELODY.length)];
      this._note(midi(n), rand(2.0, 3.2), 0.5, Math.random() < 0.5 ? 'triangle' : 'sine');
      // occasional soft harmony a third/fifth above
      if (Math.random() < 0.3) this._note(midi(n + 7), rand(1.8, 2.6), 0.28, 'sine');
    }
    this._mTimer = setTimeout(() => this._melodyTick(), rand(900, 2100));
  },

  _padTick() {
    if (!this._on) return;
    if (this.enabled) {
      const root = PAD_ROOTS[this._padIdx % PAD_ROOTS.length];
      this._padIdx++;
      for (const semi of [0, 7, 12]) this._note(midi(root + semi), 6.5, 0.16, 'sine');
    }
    this._pTimer = setTimeout(() => this._padTick(), rand(6500, 8500));
  },

  _fade(target, dur) {
    if (!this._bus) return;
    const t = this._a.currentTime;
    this._bus.gain.cancelScheduledValues(t);
    this._bus.gain.setValueAtTime(Math.max(this._bus.gain.value, 0.0001), t);
    this._bus.gain.exponentialRampToValueAtTime(Math.max(target, 0.0001), t + dur);
  },

  start() {
    try {
      const a = ac();
      if (!this._bus) this._build(a);
      if (this._on) return;
      this._on = true;
      this._fade(this.enabled ? MUSIC_VOL : 0.0001, 2.0);
      this._melodyTick();
      this._padTick();
    } catch (_) {}
  },

  stop() {
    this._on = false;
    clearTimeout(this._mTimer);
    clearTimeout(this._pTimer);
    this._fade(0.0001, 0.6);
  },

  // returns the new enabled state
  toggle() {
    this.enabled = !this.enabled;
    if (this._bus) this._fade(this.enabled ? MUSIC_VOL : 0.0001, 0.5);
    return this.enabled;
  },
};
