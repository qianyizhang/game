/** Navigation identity only. Replay formats and save keys remain game-owned. */
export const GAME_METADATA = {
  balatro: { name: 'Blindside', icon: '♠', detail: 'Balatro', workshopTools: true },
  spire: { name: 'Slay the Spire', icon: '↑', detail: '', workshopTools: true },
  battlegrounds: { name: 'Last Hearth', icon: '⚑', detail: 'Battlegrounds', workshopTools: true },
  cartographer: { name: 'Dungeon Cartographer', icon: '◇', detail: '', workshopTools: false },
  diablo2: { name: 'Emberwake', icon: '✧', detail: 'Diablo II', workshopTools: false },
  'night-passage': {
    name: 'Night Passage',
    icon: '☾',
    detail: 'Action Roguelite',
    workshopTools: false,
  },
} as const;

export type GameId = keyof typeof GAME_METADATA;

export function canonicalGameId(value: string | null): GameId | null {
  switch (value) {
    case 'blindside':
      return 'balatro';
    case 'hearth':
      return 'battlegrounds';
    case 'emberwake':
      return 'diablo2';
    default:
      return value && Object.hasOwn(GAME_METADATA, value) ? (value as GameId) : null;
  }
}
