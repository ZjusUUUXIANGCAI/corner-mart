const STYLE_CHORDS = {
  jp: [
    [57, 60, 64, 67],
    [53, 57, 60, 64],
    [55, 59, 62, 65],
    [50, 53, 57, 60]
  ],
  cn: [
    [55, 59, 62, 65],
    [50, 54, 57, 62],
    [53, 57, 60, 64],
    [48, 52, 55, 59]
  ],
  us: [
    [53, 57, 60, 64],
    [50, 53, 57, 60],
    [48, 52, 55, 59],
    [55, 59, 62, 65]
  ]
};

const STYLE_SCALES = {
  jp: [0, 2, 5, 7, 9],
  cn: [0, 2, 4, 7, 9],
  us: [0, 2, 4, 7, 11]
};

const midiToFrequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

export class AmbientMusic {
  constructor() {
    this.supported = typeof window !== 'undefined'
      && Boolean(window.AudioContext || window.webkitAudioContext);
    this.style = 'jp';
    this.playing = false;
    this.ctx = null;
    this.master = null;
    this.timer = null;
    this.nextChord = 0;
    this.nextNote = 0;
    this.noteStep = 0;
    this.chordIndex = -1;
    this.currentRoot = 57;
    this.level = 0.6;

    document.addEventListener('visibilitychange', () => {
      if (!this.ctx || !this.playing) return;
      if (document.hidden) {
        this.ctx.suspend();
      } else {
        this.ctx.resume().then(() => {
          const now = this.ctx.currentTime;
          this.nextChord = now + 0.1;
          this.nextNote = now + 0.35;
          this.schedule();
        }).catch(() => {});
      }
    });
  }

  setStyle(style) {
    if (STYLE_CHORDS[style]) this.style = style;
  }

  async toggle() {
    if (this.playing) {
      this.stop();
      return false;
    }
    return this.start();
  }

  async start() {
    if (!this.ensure()) return false;
    const ctx = this.ctx;
    if (ctx.state !== 'running') {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
      if (ctx.state !== 'running') return false;
    }

    this.playing = true;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.level, now, 0.8);
    this.nextChord = now + 0.08;
    this.nextNote = now + 0.45;
    this.noteStep = 0;

    clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(), 220);
    this.schedule();
    return true;
  }

  stop() {
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0.0001, now, 0.24);
  }

  ensure() {
    if (this.ctx) return true;
    if (!this.supported) return false;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    try {
      const ctx = new AudioContextClass({ latencyHint: 'interactive' });
      const master = ctx.createGain();
      master.gain.value = 0.0001;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 18;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.25;
      master.connect(compressor);
      compressor.connect(ctx.destination);

      const padBus = ctx.createGain();
      padBus.gain.value = 0.82;
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 1550;
      padFilter.Q.value = 0.35;
      padBus.connect(padFilter);
      padFilter.connect(master);

      const noteBus = ctx.createGain();
      noteBus.gain.value = 0.68;
      noteBus.connect(master);

      const delay = ctx.createDelay(1.4);
      delay.delayTime.value = 0.37;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.24;
      const wet = ctx.createGain();
      wet.gain.value = 0.16;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(master);
      noteBus.connect(delay);

      this.ctx = ctx;
      this.master = master;
      this.padBus = padBus;
      this.padFilter = padFilter;
      this.noteBus = noteBus;
      this.delay = delay;
      return true;
    } catch {
      this.supported = false;
      return false;
    }
  }

  schedule() {
    if (!this.playing || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.nextChord < now - 1.2) this.nextChord = now + 0.1;
    if (this.nextNote < now - 0.5) this.nextNote = now + 0.25;
    while (this.nextChord < now + 1.5) {
      this.chord(this.nextChord);
      this.nextChord += 4.8;
    }
    while (this.nextNote < now + 0.4) {
      this.note(this.nextNote);
      this.nextNote += 0.62;
    }
  }

  chord(time) {
    const ctx = this.ctx;
    const progression = STYLE_CHORDS[this.style] || STYLE_CHORDS.jp;
    this.chordIndex = (this.chordIndex + 1) % progression.length;
    const notes = progression[this.chordIndex];
    this.currentRoot = notes[0];

    notes.forEach((midi, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.value = midiToFrequency(midi);
      osc.detune.value = index % 2 === 0 ? -3 : 4;
      const peak = 0.032 / (1 + index * 0.28);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(peak, time + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 4.85);
      osc.connect(gain);
      gain.connect(this.padBus);
      osc.start(time);
      osc.stop(time + 4.95);
    });

    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.value = midiToFrequency(notes[0] - 12);
    bassGain.gain.setValueAtTime(0.0001, time);
    bassGain.gain.exponentialRampToValueAtTime(0.052, time + 1.1);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, time + 4.7);
    bass.connect(bassGain);
    bassGain.connect(this.padBus);
    bass.start(time);
    bass.stop(time + 4.8);
  }

  note(time) {
    const ctx = this.ctx;
    const step = this.noteStep++;
    if (step % 7 === 5) return;
    const scale = STYLE_SCALES[this.style] || STYLE_SCALES.jp;
    const degree = scale[step % scale.length];
    const octave = step % 8 < 4 ? 12 : 24;
    const midi = this.currentRoot + degree + octave;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    osc.type = step % 3 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = midiToFrequency(midi);
    osc.detune.value = step % 2 ? 3 : -3;
    pan.pan.value = step % 2 ? 0.18 : -0.18;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.023, time + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.52);
    osc.connect(gain);
    gain.connect(pan);
    pan.connect(this.noteBus);
    osc.start(time);
    osc.stop(time + 0.6);
  }
}
