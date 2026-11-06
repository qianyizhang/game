import type { ReactNode } from 'react';
import { Squire } from './Squire';
import { Cub } from './Cub';
import { Pup } from './Pup';
import { Wisp } from './Wisp';
import { GoldenSpark } from './Spark';
import { DemonPortrait } from '../FiendIllustrations';

export const smallUnitArt: Record<string, ReactNode> = {
  squire: <Squire golden={false} />,
  cub: <Cub golden={false} />,
  pup: <Pup golden={false} />,
  wisp: <Wisp golden={false} />,
};
export const goldenSmallUnitArt: Record<string, ReactNode> = {
  squire: <Squire golden />,
  cub: <Cub golden />,
  pup: <Pup golden />,
  wisp: <Wisp golden />,
  spark: <GoldenSpark />,
  imp: <DemonPortrait kind="imp" golden />,
};
