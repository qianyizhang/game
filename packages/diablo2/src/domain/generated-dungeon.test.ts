import { expect, it } from 'vitest';
import { generatedDungeonContent } from './generated-dungeon';
import { BASE_CONTENT } from './content';
import { tilesFor, bodyFits, findPath } from './maps';
import { dispatch, exportSession, importSession, newSession } from '../application/session';

it('expands varied connected side dungeons into validated replay content without changing the base pack', () => {
  const base = structuredClone(BASE_CONTENT),
    boards = new Set<string>();
  for (let i = 0; i < 15; i++) {
    const pack = generatedDungeonContent(`vault-${i}`);
    const region = pack.regions.find((r) => r.id === 'charted-vault')!;
    const world = { tiles: tilesFor(region) };
    expect(region.rooms).toHaveLength(9);
    for (const target of [...region.chests, ...region.portals.map((p) => p.at)]) {
      expect(bodyFits(world, target)).toBe(true);
      expect(findPath(world, region.start, target).length).toBeGreaterThan(0);
    }
    boards.add(JSON.stringify(world.tiles));
    const session = newSession(`vault-${i}`, 'barbarian', pack);
    expect(importSession(exportSession(session))).toEqual(session);
  }
  expect(boards.size).toBe(15);
  expect(BASE_CONTENT).toEqual(base);
});

it('traverses the generated dungeon and returns through normal portals in a replayable sandbox journey', () => {
  let session = newSession(
    'vault-journey',
    'barbarian',
    generatedDungeonContent('vault-journey'),
    true,
  );
  const act = (command: Parameters<typeof dispatch>[1]) => {
    const result = dispatch(session, command);
    expect(result.error).toBeNull();
    session = result.session;
  };
  act({ type: 'dev-jump', region: 'charted-vault', landing: 'entrance', reset: false });
  const world = session.state.worlds['charted-vault'];
  expect(world.visited).toBe(true);
  act({ type: 'use-portal', id: 'return' });
  expect(session.state.region).toBe('fen-1');
  act({ type: 'use-portal', id: 'charted-vault' });
  expect(session.state.worlds['charted-vault'].enemies).toEqual(world.enemies);
  expect(importSession(exportSession(session))).toEqual(session);
});
