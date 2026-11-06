import { describe, expect, it } from 'vitest';
import { World } from '../domain/world';
import { createEffects } from './effects';

describe('confirmed presentation cues', () => {
  it('coalesces confirmed combat loss/collection, expires by ticks, and holds while paused', () => {
    const state = new World().snapshot();
    state.phase = 'combat';
    const effects = createEffects();
    expect(effects(state)).toEqual([]); // Initial protection is not a hit.
    state.tick++;
    state.player.hp -= 6;
    state.scrap++;
    expect(effects(state).map((cue) => cue.kind)).toEqual(['player-hit', 'scrap-sparkle']);
    expect(effects(state)).toHaveLength(2); // Redrawing/pausing is not an event.
    state.tick++;
    state.scrap++;
    expect(effects(state)).toHaveLength(2); // At most one cue per kind.
    state.tick += 11;
    expect(effects(state)).toEqual([]);
  });
  it('suppresses banking, shop purchases, wave protection, reset and imported state', () => {
    const state = new World().snapshot();
    state.phase = 'combat';
    const effects = createEffects();
    effects(state);
    state.tick++;
    state.phase = 'shop';
    state.scrap += 30;
    expect(effects(state)).toEqual([]);
    state.scrap -= 8;
    state.player.hp = 100;
    expect(effects(state)).toEqual([]);
    state.phase = 'combat';
    state.wave++;
    state.tick++;
    state.player.invulnerable = 180;
    expect(effects(state)).toEqual([]);
    const imported = structuredClone(state);
    imported.tick += 5;
    imported.player.hp -= 20;
    imported.scrap += 8;
    expect(effects(imported)).toEqual([]);
    imported.tick = 0;
    expect(effects(imported)).toEqual([]);
  });
});
