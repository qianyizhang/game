import { ArtGlyph, type ArtGlyphKind } from '../../../shared/art/CardArt';

export const INTENT_ART = {
  attack: { name: 'Attack', glyph: 'sword', ink: '#733c32', accent: '#bf7755' },
  block: { name: 'Block', glyph: 'shield', ink: '#31544d', accent: '#91a89a' },
  status: { name: 'Status change', glyph: 'eye', ink: '#554161', accent: '#ae94b1' },
  card: { name: 'Add cards', glyph: 'book', ink: '#70502e', accent: '#c6a474' },
  special: { name: 'Special action', glyph: 'spark', ink: '#574936', accent: '#c6a474' },
  wait: { name: 'No action', glyph: 'hourglass', ink: '#4d5754', accent: '#a7b0a2' },
} satisfies Record<string, { name: string; glyph: ArtGlyphKind; ink: string; accent: string }>;

export type IntentArtKind = keyof typeof INTENT_ART;

/** Engraved symbols reuse Workshop primitives; HTML always owns the action text. */
export function IntentArt({ kind }: { kind: IntentArtKind }) {
  const art = INTENT_ART[kind];
  return (
    <svg
      className="sts-intent-art"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-intent-art={kind}
    >
      <rect x="2" y="2" width="60" height="60" rx="12" fill="#f4ebd8" />
      <path d="M14 4H50M14 60H50" stroke={art.accent} strokeWidth="2" fill="none" />
      <g
        transform={
          kind === 'attack' ? 'rotate(38 32 32) translate(-19.2 0) scale(1.6 1)' : undefined
        }
      >
        <ArtGlyph kind={art.glyph} x={9} y={8} size={46} color={art.ink} accent={art.accent} />
      </g>
    </svg>
  );
}
