import type { BossDefinition, RunState } from '../domain/types';

export const BOSSES: BossDefinition[] = [
  {
    id: 'thorn',
    name: 'The Thorn',
    description: 'Clubs are debuffed: no card chips, enhancements or card triggers.',
    symbol: '♣',
  },
  { id: 'mask', name: 'The Mask', description: 'Face cards are debuffed.', symbol: '◈' },
  { id: 'pinch', name: 'The Pinch', description: 'Start with only one discard.', symbol: '⌁' },
  { id: 'narrow', name: 'The Narrow', description: 'Draw a hand two cards smaller.', symbol: '↔' },
  {
    id: 'lock',
    name: 'The Lock',
    description: 'Only your first played hand type can score this round.',
    symbol: '▣',
  },
  { id: 'five', name: 'The Five', description: 'You must play exactly five cards.', symbol: 'Ⅴ' },
  {
    id: 'wall',
    name: 'The Wall',
    description: 'An especially high score target: ×1.5.',
    symbol: '▥',
  },
  {
    id: 'crown',
    name: 'The Crown',
    description: 'Final boss. A towering score target: ×1.6.',
    symbol: '♛',
  },
];

export const ANTE_TARGETS = [200, 500, 1200, 2400, 4500, 8000, 14000, 24000];
export const currentBoss = (run: Readonly<RunState>): BossDefinition =>
  BOSSES.find((boss) => boss.id === run.bossIds[run.ante - 1])!;
export const activeBoss = (run: Readonly<RunState>): string | undefined =>
  run.blind === 2 ? currentBoss(run).id : undefined;
export function targetFor(run: Readonly<RunState>): number {
  const boss = activeBoss(run);
  return Math.floor(
    ANTE_TARGETS[run.ante - 1] *
      [1, 1.5, 2][run.blind] *
      (boss === 'wall' ? 1.5 : boss === 'crown' ? 1.6 : 1),
  );
}
