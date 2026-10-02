import { describe, expect, it } from 'vitest';
import { replayCodec } from './replay';
import { spireSession } from '../games/spire/application/session';
import { SPIRE_SCENARIOS } from '../games/spire/application/scenario';
import { blindsideSession } from '../games/balatro/application/session';
import { BLINDSIDE_SCENARIOS } from '../games/balatro/application/scenario';
import { bgSession } from '../games/battlegrounds/application/session';
import { HEARTH_SCENARIOS } from '../games/battlegrounds/application/scenario';

describe('practice histories', () => {
  it('branches a legal prefix and leaves the original history untouched', () => {
    const original = spireSession.act(spireSession.create('BRANCH'), {
      type: 'neow',
      choice: 'gold',
    }).session;
    const before = structuredClone(original);
    const lab = replayCodec(spireSession.rules, true);
    const branch = lab.decode(
      JSON.stringify({ ...original.replay, mode: 'practice', commands: [] }),
    );
    const alternative = lab.act(branch, { type: 'neow', choice: 'maxHp' }).session;
    expect(alternative.state.maxHp).toBe(88);
    expect(original).toEqual(before);
    expect(lab.decode(lab.encode(alternative))).toEqual(alternative);
    expect(() => spireSession.decode(lab.encode(alternative))).toThrow(/practice/i);
  });
  it('validates custom inputs, refuses injected normal setup and reproduces scenario combat', () => {
    const lab = replayCodec(spireSession.rules, true);
    const scenario = lab.create('CUSTOM', SPIRE_SCENARIOS[0].setup);
    const copy = lab.decode(lab.encode(scenario));
    expect(copy).toEqual(scenario);
    expect(copy.state.character).toBe('silent');
    expect(() => lab.create('BAD', { ...SPIRE_SCENARIOS[0].setup, deck: ['__proto__'] })).toThrow(
      /unknown ID/,
    );
    expect(() => lab.create('BAD', { ...SPIRE_SCENARIOS[0].setup, hp: 999 })).toThrow(/hp/);
    expect(() =>
      spireSession.decode(JSON.stringify({ ...scenario.replay, mode: undefined })),
    ).toThrow(/practice/i);
  });
  it('reconstructs every accepted decision and rejects out-of-range cursors', () => {
    let s = spireSession.create('CURSOR');
    s = spireSession.act(s, { type: 'neow', choice: 'gold' }).session;
    s = spireSession.act(s, { type: 'chooseNode', id: s.state.map[0].id }).session;
    expect(spireSession.at(s, 0).state.phase).toBe('neow');
    expect(spireSession.at(s, 1).state.phase).toBe('map');
    expect(spireSession.at(s, 2)).toEqual(s);
    expect(() => spireSession.at(s, 3)).toThrow(/step/);
    expect(() => spireSession.at(s, -1)).toThrow(/step/);
  });
  it('supports independent Blindside and Hearth scenarios with legal replay reconstruction', () => {
    const poker = replayCodec(blindsideSession.rules, true);
    const p = poker.create('POKER', BLINDSIDE_SCENARIOS[0].setup);
    expect(p.state.hand).toHaveLength(8);
    expect(poker.decode(poker.encode(p))).toEqual(p);
    const hearth = replayCodec(bgSession.rules, true);
    const h = hearth.create('HEARTH', HEARTH_SCENARIOS[0].setup);
    expect(h.state.players[0].gold).toBe(10);
    expect(hearth.decode(hearth.encode(h))).toEqual(h);
  });
});
