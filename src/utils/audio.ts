/**
 * Web Audio API synthesizer for zero-latency, custom sound effects
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('sl_audio_muted', muted ? 'true' : 'false');
    } catch {
      // ignore
    }
  }

  public getMuted(): boolean {
    try {
      const stored = localStorage.getItem('sl_audio_muted');
      if (stored !== null) {
        this.isMuted = stored === 'true';
      }
    } catch {
      // ignore
    }
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Play crisp button click
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Play dice roll rattle
  public playDiceRoll() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const count = 7;
    for (let i = 0; i < count; i++) {
      const delay = i * 0.045 + Math.random() * 0.02;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = 1200 + Math.random() * 1000;
      filter.Q.value = 3;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 + Math.random() * 600, now + delay);

      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.04);
    }
  }

  // Step hop sound when moving between tiles
  public playStep() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.06);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Ladder climb arpeggio (magical chime)
  public playLadderClimb() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51]; // A major arpeggio
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.28, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });
  }

  // Snake bite and slide down hiss/whoosh
  public playSnakeBite() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Bite sting
    const sting = this.ctx.createOscillator();
    const stingGain = this.ctx.createGain();
    sting.type = 'sawtooth';
    sting.frequency.setValueAtTime(400, now);
    sting.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    stingGain.gain.setValueAtTime(0.35, now);
    stingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    sting.connect(stingGain);
    stingGain.connect(this.ctx.destination);
    sting.start(now);
    sting.stop(now + 0.15);

    // Slide down whistle / wobble
    const slide = this.ctx.createOscillator();
    const slideGain = this.ctx.createGain();
    slide.type = 'sawtooth';
    slide.frequency.setValueAtTime(700, now + 0.12);
    slide.frequency.exponentialRampToValueAtTime(120, now + 0.85);

    slideGain.gain.setValueAtTime(0.25, now + 0.12);
    slideGain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

    slide.connect(slideGain);
    slideGain.connect(this.ctx.destination);
    slide.start(now + 0.12);
    slide.stop(now + 0.85);
  }

  // Victory fanfare melody
  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const melody = [
      { freq: 523.25, duration: 0.15, time: 0 },      // C5
      { freq: 659.25, duration: 0.15, time: 0.16 },   // E5
      { freq: 783.99, duration: 0.15, time: 0.32 },   // G5
      { freq: 1046.50, duration: 0.45, time: 0.48 },  // C6
      { freq: 880.00, duration: 0.15, time: 0.95 },   // A5
      { freq: 1046.50, duration: 0.70, time: 1.12 },  // C6
    ];

    melody.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + note.time;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, noteTime);

      gain.gain.setValueAtTime(0.35, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + note.duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + note.duration);
    });
  }
}

export const sounds = new SoundEngine();
