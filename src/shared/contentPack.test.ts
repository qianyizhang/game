import { describe, it, expect } from 'vitest';
import { assemble, contentDigest, pins } from './contentPack';
import { spirePacks } from '../mods/spire';
import { validateCard } from '../mods/validation';
import { spireSession } from '../games/spire/application/session';
import { replayCodec } from './replay';

describe('trusted content pack boundary', () => {
  it('validates disabled examples but only activates enabled content', () => {
    expect(assemble([], spirePacks, (p) => p.cards, validateCard)).toEqual([]);
    const enabled = spirePacks.map((p) => ({ ...p, enabled: true }));
    expect(assemble([], enabled, (p) => p.cards, validateCard)[0].id).toBe('workshop:riposte');
    const broken = structuredClone(spirePacks);
    broken[0].content.cards[0].cost = NaN;
    expect(() => assemble([], broken, (p) => p.cards, validateCard)).toThrow(
      /src\/mods\/spire.ts.*cost/,
    );
  });
  it('rejects duplicate IDs and reports their source', () => {
    expect(() =>
      assemble(spirePacks[0].content.cards, spirePacks, (p) => p.cards, validateCard),
    ).toThrow(/duplicate/);
  });
  it('pins changed data and versions while keeping key order and minification irrelevant', () => {
    expect(contentDigest({ b: 2, a: 1 })).toBe(contentDigest({ a: 1, b: 2 }));
    expect(contentDigest({ effect: () => 1 })).toBe(contentDigest({ effect: () => 2 }));
    const old = spireSession.create('PIN');
    const changed = structuredClone(spirePacks);
    changed[0].enabled = true;
    const custom = replayCodec({ ...spireSession.rules, content: pins({}, changed, 3) });
    expect(custom.key).not.toBe(spireSession.key);
    expect(() => custom.decode(spireSession.encode(old))).toThrow(/Content pack mismatch/);
    const saved = custom.create('PIN');
    changed[0].content.cards[0].effects = [{ type: 'damage', amount: 999 }];
    const changedAgain = replayCodec({ ...spireSession.rules, content: pins({}, changed, 3) });
    expect(() => changedAgain.decode(custom.encode(saved))).toThrow(/mismatch/);
  });
});
