/**
 * Haptic Vibration Feedback Service
 * Provides tactile vibration feedback for mobile interaction-heavy components
 * Supports physical navigator.vibrate() plus Web Audio API acoustic tactile transient pulses
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

class HapticsService {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Try to load user preference from localStorage
    try {
      const saved = localStorage.getItem('assault_haptics_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {}
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try {
      localStorage.setItem('assault_haptics_enabled', String(enabled));
    } catch {}
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private getAudioContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Synthesize an ultra-subtle sub-bass tactile click pulse via Web Audio
   * Provides consistent tactile auditory feedback even on desktop or when physical vibration motor is unavailable
   */
  private playAcousticHaptic(frequency: number, durationMs: number, gainLevel: number) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + durationMs / 1000);

      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {}
  }

  /**
   * Triggers a haptic vibration feedback pattern
   */
  public trigger(type: HapticType = 'light') {
    if (!this.enabled) return;

    let pattern: number[] = [10];
    let freq = 65;
    let dur = 14;
    let vol = 0.08;

    switch (type) {
      case 'selection':
        pattern = [6];
        freq = 80;
        dur = 8;
        vol = 0.04;
        break;
      case 'light':
        pattern = [12];
        freq = 65;
        dur = 14;
        vol = 0.07;
        break;
      case 'medium':
        pattern = [22];
        freq = 55;
        dur = 22;
        vol = 0.12;
        break;
      case 'heavy':
        pattern = [38];
        freq = 45;
        dur = 35;
        vol = 0.18;
        break;
      case 'success':
        pattern = [12, 35, 18];
        freq = 75;
        dur = 25;
        vol = 0.1;
        break;
      case 'warning':
        pattern = [25, 40, 25];
        freq = 50;
        dur = 30;
        vol = 0.14;
        break;
      case 'error':
        pattern = [30, 50, 30, 50, 30];
        freq = 40;
        dur = 40;
        vol = 0.2;
        break;
    }

    // 1. Physical Hardware Vibration API (if mobile hardware permits)
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {}

    // 2. Synthesize audio micro-pulse for tactile feedback
    this.playAcousticHaptic(freq, dur, vol);
  }

  // Pre-configured action helpers
  public tabSwitch() {
    this.trigger('light');
  }

  public channelSwitch() {
    this.trigger('light');
  }

  public serverSwitch() {
    this.trigger('medium');
  }

  public buttonPress() {
    this.trigger('selection');
  }

  public actionSuccess() {
    this.trigger('success');
  }

  public actionError() {
    this.trigger('error');
  }
}

export const haptics = new HapticsService();
