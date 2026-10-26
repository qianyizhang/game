import type { EnemyEffect } from '../domain/types';
import { IntentArt, type IntentArtKind } from './IntentArt';
import './IntentCue.css';

/** Presentation categories only. Never estimate damage or infer a future move. */
export function intentArtKinds(effects: readonly EnemyEffect[]): IntentArtKind[] {
  if (!effects.length) return ['wait'];
  return [
    ...new Set(
      effects.map((effect): IntentArtKind => {
        switch (effect.type) {
          case 'damage':
            return 'attack';
          case 'block':
            return 'block';
          case 'status':
            return 'status';
          case 'generate':
            return 'card';
          default:
            return 'special';
        }
      }),
    ),
  ];
}

export function IntentCue({
  kinds,
  text,
  descriptionId,
}: {
  kinds: readonly IntentArtKind[];
  text: string;
  descriptionId?: string;
}) {
  return (
    <span className={`sts-intent-cue${kinds.length > 1 ? ' sts-intent-compound' : ''}`}>
      <span className="sts-intent-symbols" aria-hidden="true">
        {kinds.map((kind) => (
          <IntentArt key={kind} kind={kind} />
        ))}
      </span>
      <span className="sts-intent-copy" id={descriptionId}>
        <span className="sts-intent-caption">Next action</span>
        <span>{text}</span>
      </span>
    </span>
  );
}
