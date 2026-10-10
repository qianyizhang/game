import type { Content, RegionDef, RegionPortal, State, World } from './types';
export const currentRegion = (state: State, content: Content): RegionDef =>
  content.regions.find((r) => r.id === state.region)!;
export const currentWorld = (state: State): World => state.worlds[state.region];
export const wardsLit = (state: State, content: Content): boolean =>
  !!state.sandbox || content.acts[state.act].wards.every((id) => state.worlds[id].ward);
export const bossCleared = (state: State, content: Content): boolean =>
  state.worlds[content.acts[state.act].bossRegion].bossDefeated;
export function portalOpen(state: State, content: Content, portal: RegionPortal): boolean {
  return (
    !!state.sandbox ||
    portal.requires === 'none' ||
    (portal.requires === 'wards' ? wardsLit(state, content) : bossCleared(state, content))
  );
}
/** First local portal on an unlocked route, including return stairs and side branches. */
export function routeTo(state: State, content: Content, destination: string): RegionPortal | null {
  const queue = [{ id: state.region, first: null as RegionPortal | null }];
  const seen = new Set([state.region]);
  for (const node of queue) {
    if (node.id === destination) return node.first;
    const region = content.regions.find((r) => r.id === node.id)!;
    for (const portal of region.portals) {
      if (!portal.target || seen.has(portal.target) || !portalOpen(state, content, portal))
        continue;
      const target = content.regions.find((r) => r.id === portal.target)!;
      if (target.act !== content.acts[state.act].id) continue;
      seen.add(target.id);
      queue.push({ id: target.id, first: node.first ?? portal });
    }
  }
  return null;
}
