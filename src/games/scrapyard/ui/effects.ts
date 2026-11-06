import type { View } from '../domain/world';

export interface Cue {
  kind: 'player-hit' | 'scrap-sparkle';
  x: number;
  y: number;
  until: number;
}

/** Compare confirmed snapshots of the same live world, never projectile disappearance. */
export function createEffects() {
  let previous:
    | { state: View; tick: number; wave: number; phase: View['phase']; hp: number; scrap: number }
    | undefined;
  let cues: Cue[] = [];
  return (state: View) => {
    const continuous =
      previous &&
      previous.state === state &&
      previous.wave === state.wave &&
      previous.phase === 'combat' &&
      state.phase === 'combat' &&
      state.tick > previous.tick;
    if (
      !previous ||
      previous.state !== state ||
      previous.wave !== state.wave ||
      state.phase !== 'combat' ||
      state.tick < previous.tick
    )
      cues = [];
    cues = cues.filter((cue) => cue.until > state.tick);
    if (continuous) {
      if (state.player.hp < previous!.hp) {
        cues = cues.filter((cue) => cue.kind !== 'player-hit');
        cues.push({
          kind: 'player-hit',
          x: state.player.x,
          y: state.player.y,
          until: state.tick + 11,
        });
      }
      if (state.scrap > previous!.scrap) {
        cues = cues.filter((cue) => cue.kind !== 'scrap-sparkle');
        cues.push({
          kind: 'scrap-sparkle',
          x: state.player.x,
          y: state.player.y - 18,
          until: state.tick + 10,
        });
      }
    }
    previous = {
      state,
      tick: state.tick,
      wave: state.wave,
      phase: state.phase,
      hp: state.player.hp,
      scrap: state.scrap,
    };
    return cues;
  };
}
