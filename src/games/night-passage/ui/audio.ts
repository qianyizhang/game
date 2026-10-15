import type { StateView as State, WeaponId } from '../domain/types';

export type CombatSound =
  { kind: 'hit' | 'kill'; weapon: WeaponId } | { kind: 'hurt' | 'down' | 'dash' | 'clear' };

/** Read confirmed live combat transitions; callers do not submit save restores. */
export function combatSounds(before: State, after: State): CombatSound[] {
  if (
    before.phase !== 'combat' ||
    after.tick <= before.tick ||
    before.seed !== after.seed ||
    before.runNumber !== after.runNumber ||
    before.region !== after.region ||
    before.chamber !== after.chamber
  )
    return [];
  const sounds: CombatSound[] = [];
  if (after.player.hp < before.player.hp)
    sounds.push({ kind: after.phase === 'lost' ? 'down' : 'hurt' });
  if (after.phase === 'lost') return sounds;
  if (after.phase === 'reward' || after.phase === 'route' || after.phase === 'won')
    sounds.push({ kind: 'clear' });
  else if (after.kills > before.kills) sounds.push({ kind: 'kill', weapon: after.player.weapon });
  else if (
    after.enemies.some(
      (enemy) => enemy.hp < (before.enemies.find((old) => old.id === enemy.id)?.hp ?? enemy.hp),
    )
  )
    sounds.push({ kind: 'hit', weapon: after.player.weapon });
  if (after.player.dashCooldown > before.player.dashCooldown) sounds.push({ kind: 'dash' });
  // Danger always remains audible; coalesce dense simultaneous hits into one impact.
  return sounds.slice(0, 2);
}

interface Tone {
  from: number;
  to: number;
  seconds: number;
  shape: OscillatorType;
  gain: number;
}
const tone = (
  from: number,
  to: number,
  seconds: number,
  shape: OscillatorType,
  gain: number,
): Tone => ({ from, to, seconds, shape, gain });
const impacts: Record<WeaponId, readonly Tone[]> = {
  sword: [tone(320, 100, 0.11, 'triangle', 0.065), tone(780, 240, 0.055, 'sine', 0.035)],
  spear: [tone(700, 190, 0.085, 'sine', 0.075), tone(1300, 350, 0.035, 'triangle', 0.03)],
  shield: [tone(95, 38, 0.19, 'triangle', 0.105), tone(280, 90, 0.1, 'sine', 0.045)],
  bow: [tone(900, 480, 0.09, 'triangle', 0.06), tone(1400, 700, 0.04, 'sine', 0.025)],
  fists: [tone(170, 50, 0.055, 'triangle', 0.09), tone(95, 45, 0.07, 'sine', 0.04)],
};
function tones(sound: CombatSound): readonly Tone[] {
  switch (sound.kind) {
    case 'hit':
      return impacts[sound.weapon];
    case 'kill':
      return [...impacts[sound.weapon], tone(360, 720, 0.14, 'sine', 0.055)];
    case 'hurt':
      return [tone(130, 45, 0.18, 'triangle', 0.14), tone(65, 32, 0.21, 'sine', 0.05)];
    case 'down':
      return [tone(150, 35, 0.4, 'triangle', 0.12), tone(74, 28, 0.45, 'sine', 0.06)];
    case 'dash':
      return [tone(480, 100, 0.13, 'triangle', 0.055)];
    case 'clear':
      return [tone(440, 660, 0.35, 'sine', 0.07), tone(554, 880, 0.4, 'sine', 0.04)];
  }
}
interface Voice {
  stop(): void;
}

/** Same envelopes serve live audio and offline auditions; the caller owns the output bus. */
export function scheduleSound(
  context: BaseAudioContext,
  destination: AudioNode,
  sound: CombatSound,
  when: number,
  ended: () => void = () => {},
): Voice {
  const profile = tones(sound);
  const nodes: { oscillator: OscillatorNode; gain: GainNode }[] = [];
  let finished = false,
    remaining = profile.length;
  const finish = () => {
    if (finished) return;
    finished = true;
    for (const node of nodes) {
      node.oscillator.disconnect();
      node.gain.disconnect();
    }
    ended();
  };
  const start = Math.max(context.currentTime, when);
  for (const spec of profile) {
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    nodes.push({ oscillator, gain });
    oscillator.type = spec.shape;
    oscillator.frequency.setValueAtTime(spec.from, start);
    oscillator.frequency.exponentialRampToValueAtTime(spec.to, start + spec.seconds);
    // A short attack avoids the discontinuity of starting an oscillator at full volume.
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(spec.gain, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.seconds);
    gain.gain.setValueAtTime(0, start + spec.seconds + 0.005);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.onended = () => {
      if (--remaining === 0) finish();
    };
    oscillator.start(start);
    oscillator.stop(start + spec.seconds + 0.01);
  }
  return {
    stop() {
      if (finished) return;
      for (const node of nodes) node.oscillator.stop(context.currentTime);
      finish();
    },
  };
}
const priority = (sound: CombatSound) =>
  sound.kind === 'hurt' || sound.kind === 'down'
    ? 3
    : sound.kind === 'kill' || sound.kind === 'clear'
      ? 2
      : 1;
interface ActiveVoice {
  voice: Voice;
  priority: number;
}

/** Bounded presentation audio. It never advances rules, consumes RNG or changes snapshots. */
export class PassageAudio {
  private context: AudioContext | null = null;
  private bus: GainNode | null = null;
  private enabled = false;
  private impactAt = -Infinity;
  private lastState: State | null = null;
  private voices = new Set<ActiveVoice>();
  async start(): Promise<void> {
    this.enabled = true;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.bus = this.context.createGain();
        this.bus.connect(this.context.destination);
      }
      this.bus!.gain.value = 0.8;
      await this.context.resume();
    } catch {
      /* Audio may be unavailable; play remains fully visual. */
    }
  }
  update(before: State, after: State): void {
    const context = this.context,
      bus = this.bus;
    if (
      !this.enabled ||
      !context ||
      !bus ||
      context.state !== 'running' ||
      after === this.lastState
    )
      return;
    this.lastState = after;
    for (const sound of combatSounds(before, after)) {
      const impact = sound.kind === 'hit' || sound.kind === 'kill';
      if (impact && context.currentTime - this.impactAt < 0.045) continue;
      const rank = priority(sound);
      if (this.voices.size >= 6) {
        const lowest = [...this.voices].sort((a, b) => a.priority - b.priority)[0];
        if (lowest.priority > rank) continue;
        lowest.voice.stop();
      }
      const active: ActiveVoice = {
        priority: rank,
        voice: scheduleSound(context, bus, sound, context.currentTime, () =>
          this.voices.delete(active),
        ),
      };
      this.voices.add(active);
      if (impact) this.impactAt = context.currentTime;
    }
  }
  mute(): void {
    this.enabled = false;
    if (this.bus) this.bus.gain.value = 0;
    for (const active of this.voices) active.voice.stop();
    this.voices.clear();
    this.lastState = null;
    this.impactAt = -Infinity;
  }
  close(): void {
    this.mute();
    this.bus?.disconnect();
    this.bus = null;
    void this.context?.close().catch(() => undefined);
    this.context = null;
  }
}
