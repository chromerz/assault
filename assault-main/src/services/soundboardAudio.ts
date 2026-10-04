// High-performance Web Audio API Soundboard Synthesizer
// Synthesizes authentic, punchy soundboard effects directly in-browser

class SoundboardAudioEngine {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play named soundboard sound
  public play(type: string): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      switch (type) {
        case 'airhorn':
          this.playAirhorn(ctx, now);
          break;
        case 'quack':
          this.playQuack(ctx, now);
          break;
        case 'badumtss':
          this.playBaDumTss(ctx, now);
          break;
        case 'discord_join':
          this.playDiscordJoin(ctx, now);
          break;
        case 'discord_leave':
          this.playDiscordLeave(ctx, now);
          break;
        case 'cricket':
          this.playCricket(ctx, now);
          break;
        case 'victory':
          this.playVictory(ctx, now);
          break;
        case 'bruh':
          this.playBruh(ctx, now);
          break;
        case 'laser':
          this.playLaser(ctx, now);
          break;
        default:
          this.playDiscordJoin(ctx, now);
      }
    } catch (e) {
      console.warn('[Soundboard] Audio playback failed:', e);
    }
  }

  // Discord Official Join Chime (rising two-tone chime)
  private playDiscordJoin(ctx: AudioContext, now: number): void {
    const tones = [
      { freq: 440, start: 0, dur: 0.12 },
      { freq: 659.25, start: 0.13, dur: 0.28 }
    ];

    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.25, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  }

  // Discord Official Leave Chime (descending two-tone chime)
  private playDiscordLeave(ctx: AudioContext, now: number): void {
    const tones = [
      { freq: 659.25, start: 0, dur: 0.12 },
      { freq: 440, start: 0.13, dur: 0.28 }
    ];

    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.22, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  }

  // Hype DJ Airhorn burst
  private playAirhorn(ctx: AudioContext, now: number): void {
    const bursts = [0, 0.15, 0.3, 0.45];
    const baseFreqs = [466.16, 466.16 * 1.5]; // Bb4 + F5 harmonic

    bursts.forEach((burstTime) => {
      baseFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + burstTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + burstTime + 0.11);

        gain.gain.setValueAtTime(0.18, now + burstTime);
        gain.gain.exponentialRampToValueAtTime(0.001, now + burstTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + burstTime);
        osc.stop(now + burstTime + 0.12);
      });
    });
  }

  // Comedy Quack
  private playQuack(ctx: AudioContext, now: number): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.linearRampToValueAtTime(450, now + 0.25);
    filter.Q.value = 5;

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Ba-Dum-Tss Drum Roll
  private playBaDumTss(ctx: AudioContext, now: number): void {
    // Tom 1
    const tom1 = ctx.createOscillator();
    const tom1Gain = ctx.createGain();
    tom1.type = 'sine';
    tom1.frequency.setValueAtTime(140, now);
    tom1.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    tom1Gain.gain.setValueAtTime(0.35, now);
    tom1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    tom1.connect(tom1Gain);
    tom1Gain.connect(ctx.destination);
    tom1.start(now);
    tom1.stop(now + 0.15);

    // Tom 2
    const tom2 = ctx.createOscillator();
    const tom2Gain = ctx.createGain();
    tom2.type = 'sine';
    tom2.frequency.setValueAtTime(120, now + 0.16);
    tom2Gain.gain.setValueAtTime(0.35, now + 0.16);
    tom2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    tom2.connect(tom2Gain);
    tom2Gain.connect(ctx.destination);
    tom2.start(now + 0.16);
    tom2.stop(now + 0.3);

    // Tss (Cymbal White Noise)
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 6000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now + 0.32);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now + 0.32);
    noise.stop(now + 0.7);
  }

  // Cricket Chirp
  private playCricket(ctx: AudioContext, now: number): void {
    const chirps = [0, 0.08, 0.16, 0.35, 0.43, 0.51];
    chirps.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4600, now + t);
      gain.gain.setValueAtTime(0.12, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.05);
    });
  }

  // 8-bit Victory Chime
  private playVictory(ctx: AudioContext, now: number): void {
    const notes = [
      { f: 523.25, d: 0.1 },  // C5
      { f: 659.25, d: 0.1 },  // E5
      { f: 783.99, d: 0.1 },  // G5
      { f: 1046.5, d: 0.35 }  // C6
    ];

    let offset = 0;
    notes.forEach(({ f, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + offset);

      gain.gain.setValueAtTime(0.15, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + d);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + d);
      offset += d;
    });
  }

  // Bruh vocal drop
  private playBruh(ctx: AudioContext, now: number): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(250, now + 0.4);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Laser shot
  private playLaser(ctx: AudioContext, now: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1900, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }
}

export const soundboard = new SoundboardAudioEngine();
