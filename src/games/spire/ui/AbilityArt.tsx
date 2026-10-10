import { ArtScene } from '../../../shared/art/CardArt';
import type { CardDefinition } from '../domain/types';
import { silentScenes } from './SilentArt';
import { silentUpgradeScenes } from './SilentUpgradeArt';
import { Glyph, ink, copper } from './art/primitives';
import { scenes } from './art/ironclad';

export function AbilityArt({
  definition,
  upgraded = false,
  className = '',
}: {
  definition: CardDefinition;
  upgraded?: boolean;
  className?: string;
}) {
  const palette = silentScenes[definition.id]
    ? definition.kind === 'power'
      ? 'moss'
      : 'slate'
    : definition.kind === 'attack'
      ? 'ember'
      : definition.kind === 'skill'
        ? 'tide'
        : definition.kind === 'power'
          ? 'gold'
          : 'slate';
  return (
    <ArtScene
      className={`ember-illustration ${className}`}
      palette={palette}
      variant={
        definition.kind === 'power'
          ? 'runes'
          : definition.kind === 'status' || definition.kind === 'curse'
            ? 'night'
            : 'hills'
      }
    >
      {(upgraded ? silentUpgradeScenes[definition.id] : undefined) ??
        silentScenes[definition.id] ??
        scenes[definition.id] ?? <Glyph kind="book" />}
      {upgraded && (
        <g fill="none" stroke={ink} strokeWidth=".7" opacity=".6">
          <path d="M8 22V8H22M138 8H152V22M8 90V104H22M138 104H152V90" />
          <path d="m135 10 3 4 4-4-4-4Z" fill={copper} />
        </g>
      )}
    </ArtScene>
  );
}
