// Procedural Web Audio API sound effects & gentle bedtime ambient music box
// Zero external audio dependency required — works 100% offline!

class BedtimeSoundEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private ambientTimer: ReturnType<typeof setInterval> | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays a soft, realistic parchment page-turn rustle sound
   */
  public playPageFlip() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const duration = 0.28;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const progress = i / bufferSize;
        // Soft envelope: gentle swell then fade
        const envelope = Math.sin(progress * Math.PI) * (1 - progress * 0.4);
        data[i] = (Math.random() * 2 - 1) * envelope * 0.12;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1100, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(
        650,
        ctx.currentTime + duration
      );
      filter.Q.value = 1.6;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch {
      // Ignore audio errors on restricted devices
    }
  }

  /**
   * Plays a gentle magical chime when opening a story
   */
  public playMagicalSparkle() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.11;
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.035, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.15);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Starts a super soft, dreamy lullaby music-box pad in the background
   */
  public startAmbientLullaby() {
    if (this.isAmbientPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isAmbientPlaying = true;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.022, ctx.currentTime);
    this.ambientGain.connect(ctx.destination);

    // Pentatonic dreamy lullaby notes (F major / D minor pentatonic in soft register)
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    let step = 0;

    const playLullabyNote = () => {
      if (!this.isAmbientPlaying || !this.ctx || !this.ambientGain) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = "sine";
        const freq = scale[step % scale.length];
        step = (step + 2 + Math.floor(Math.random() * 2)) % scale.length;
        osc.frequency.setValueAtTime(freq, now);

        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(0.35, now + 0.6);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(noteGain);
        noteGain.connect(this.ambientGain);

        osc.start(now);
        osc.stop(now + 3.9);
      } catch {
        // Ignore
      }
    };

    playLullabyNote();
    this.ambientTimer = setInterval(playLullabyNote, 2800);
  }

  public stopAmbientLullaby() {
    this.isAmbientPlaying = false;
    if (this.ambientTimer) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }
}

export const soundEngine = new BedtimeSoundEngine();
