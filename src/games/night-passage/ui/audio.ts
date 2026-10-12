import type { State } from '../domain/types';

/** Small replaceable sound cues; audio never participates in combat timing. */
export class PassageAudio {
  private context: AudioContext | null = null;
  private last = 0;
  async start(): Promise<void> {
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
    } catch {
      /* Audio may be unavailable; play remains fully visual. */
    }
  }
  private tone(
    frequency: number,
    end: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    const context = this.context;
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  update(before: State, after: State): void {
    const context = this.context;
    if (!context || context.currentTime - this.last < 0.065) return;
    if (after.player.hp < before.player.hp) this.tone(130, 45, 0.18, 'triangle', 0.14);
    else if (after.phase !== before.phase && after.phase !== 'lost') {
      this.tone(440, 660, 0.35, 'sine', 0.09);
      this.tone(554, 880, 0.4, 'sine', 0.05);
    } else if (after.player.dashCooldown > before.player.dashCooldown)
      this.tone(480, 100, 0.13, 'triangle', 0.07);
    else if (after.kills > before.kills) this.tone(300, 720, 0.14, 'sine', 0.1);
    else if (
      after.enemies.some((e) => e.hp < (before.enemies.find((b) => b.id === e.id)?.hp ?? e.hp))
    )
      this.tone(220, 90, 0.08, 'triangle', 0.08);
    else return;
    this.last = context.currentTime;
  }
  close(): void {
    void this.context?.close().catch(() => undefined);
    this.context = null;
  }
}
