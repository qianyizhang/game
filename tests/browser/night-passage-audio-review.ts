import { scheduleSound, type CombatSound } from '../../src/games/night-passage/ui/audio';

/** Regenerable browser audition; production envelopes remain the only sound source. */
export async function renderAudition() {
  const cues: CombatSound[] = [
    ...(['sword', 'spear', 'shield', 'bow', 'fists'] as const).map((weapon) => ({
      kind: 'hit' as const,
      weapon,
    })),
    { kind: 'kill', weapon: 'sword' },
    { kind: 'hurt' },
    { kind: 'down' },
    { kind: 'dash' },
    { kind: 'clear' },
  ];
  const rate = 24000,
    spacing = 0.7;
  const context = new OfflineAudioContext(1, rate * spacing * (cues.length + 1), rate);
  const bus = context.createGain();
  bus.gain.value = 0.8;
  bus.connect(context.destination);
  cues.forEach((cue, index) => scheduleSound(context, bus, cue, index * spacing));
  // Worst-case identical phases at the live mixer's six-voice ceiling.
  for (let i = 0; i < 6; i++)
    scheduleSound(context, bus, { kind: 'kill', weapon: 'shield' }, cues.length * spacing);
  const pcm = Array.from((await context.startRendering()).getChannelData(0));
  const metrics = [
    ...cues.map((cue) => (cue.kind === 'hit' ? cue.weapon : cue.kind)),
    'six-shield-kills',
  ].map((name, i) => {
    const samples = pcm.slice(Math.round(i * spacing * rate), Math.round((i + 1) * spacing * rate));
    return {
      name,
      peak: Math.max(...samples.map(Math.abs)),
      rms: Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length),
      tail: Math.max(...samples.slice(-rate / 10).map(Math.abs)),
    };
  });
  return { rate, pcm, metrics };
}

interface AudioProbe {
  armed: boolean;
  muted: boolean;
  dashes: number;
  immediateStops: number;
  closed: number;
  buses: GainNode[];
}
declare global {
  interface Window {
    passageAudioProbe: AudioProbe;
  }
}

/** Observe real Web Audio calls; the UI still receives real game input. */
export function installAudioProbe() {
  localStorage.setItem('card-workshop.night-passage.view.v1', 'canvas');
  const probe: AudioProbe = (window.passageAudioProbe = {
    armed: true,
    muted: false,
    dashes: 0,
    immediateStops: 0,
    closed: 0,
    buses: [],
  });
  const NativeContext = window.AudioContext;
  window.AudioContext = class extends NativeContext {
    private firstGain = true;
    override createGain() {
      const node = super.createGain();
      if (this.firstGain) {
        probe.buses.push(node);
        this.firstGain = false;
      }
      return node;
    }
    override createOscillator() {
      const node = super.createOscillator(),
        start = node.start.bind(node),
        stop = node.stop.bind(node),
        setFrequency = node.frequency.setValueAtTime.bind(node.frequency);
      let frequency = 0;
      node.frequency.setValueAtTime = (value, when) => {
        frequency = value;
        return setFrequency(value, when);
      };
      node.start = (when) => {
        start(when);
        if (frequency === 480) probe.dashes++;
        if (probe.armed && frequency === 480) {
          probe.armed = false;
          queueMicrotask(() => {
            const button = [...document.querySelectorAll('button')].find(
              (candidate) => candidate.textContent === 'Sound on',
            );
            if (button) {
              button.click();
              probe.muted = true;
            }
          });
        }
      };
      node.stop = (when) => {
        if ((when ?? 0) <= this.currentTime + 0.001) probe.immediateStops++;
        stop(when);
      };
      return node;
    }
    override close() {
      probe.closed++;
      return super.close();
    }
  };
}
