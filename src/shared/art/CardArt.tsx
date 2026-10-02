import type { CSSProperties, ReactNode } from 'react';
import './CardArt.css';

export const ART_PALETTES = {
  ember: {
    paper: '#35282c',
    shade: '#201f25',
    ink: '#301f25',
    light: '#f5d8aa',
    accent: '#ed9366',
    line: '#b97452',
  },
  moss: {
    paper: '#203a32',
    shade: '#142923',
    ink: '#173830',
    light: '#e1e6ba',
    accent: '#a8c883',
    line: '#91a879',
  },
  tide: {
    paper: '#233b44',
    shade: '#172a33',
    ink: '#1a3540',
    light: '#d0ece5',
    accent: '#7bbfca',
    line: '#719da6',
  },
  violet: {
    paper: '#332e43',
    shade: '#211f2d',
    ink: '#2b2439',
    light: '#ecdcf0',
    accent: '#ba9bd1',
    line: '#9a83b1',
  },
  gold: {
    paper: '#413b2f',
    shade: '#292922',
    ink: '#3c3023',
    light: '#fff0c2',
    accent: '#eac574',
    line: '#b8a06b',
  },
  slate: {
    paper: '#303b42',
    shade: '#212b32',
    ink: '#25313c',
    light: '#dbe4e4',
    accent: '#9dafb8',
    line: '#82979e',
  },
  rose: {
    paper: '#432e39',
    shade: '#2a222c',
    ink: '#352330',
    light: '#f7ddd6',
    accent: '#df9d9f',
    line: '#ad7c8a',
  },
} as const;

export type ArtPalette = keyof typeof ART_PALETTES;
export type ArtVariant = 'rays' | 'night' | 'runes' | 'hills';

/** Presentation only: fixed geometry, no random numbers, IDs or external assets. */
export function ArtScene({
  children,
  palette = 'gold',
  variant = 'rays',
  className = '',
}: {
  children: ReactNode;
  palette?: ArtPalette;
  variant?: ArtVariant;
  className?: string;
}) {
  const colors = ART_PALETTES[palette];
  const style = {
    '--art-ink': colors.ink,
    '--art-light': colors.light,
    '--art-accent': colors.accent,
  } as CSSProperties;
  return (
    <svg
      className={`card-art ${className}`}
      viewBox="0 0 160 112"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={style}
      data-art-scene={variant}
    >
      <rect width="160" height="112" rx="8" fill={colors.paper} />
      <path d="M0 112V77Q51 62 94 87T160 84V112Z" fill={colors.shade} opacity=".65" />
      <path d="M0 0H104L0 100Z" fill={colors.light} opacity=".025" />
      <g stroke={colors.line} strokeWidth=".55" opacity=".24">
        {variant === 'rays' && (
          <>
            <circle cx="80" cy="54" r="39" />
            <circle cx="80" cy="54" r="42" opacity=".5" />
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d="M80 7V12" transform={`rotate(${i * 45} 80 54)`} />
            ))}
          </>
        )}
        {variant === 'night' && (
          <>
            <path d="M22 24L35 45 26 76M124 20L137 50 126 86" opacity=".5" />
            {[
              [22, 24],
              [35, 45],
              [26, 76],
              [124, 20],
              [137, 50],
              [126, 86],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r=".8" fill={colors.light} stroke="none" />
            ))}
            <path d="M106 19a36 36 0 0 1 5 66" />
          </>
        )}
        {variant === 'runes' && (
          <>
            <path d="M80 14L121 55 80 96 39 55Z" opacity=".6" />
            <circle cx="80" cy="55" r="43" />
            <path d="M23 46V62M20 50L26 58M137 46V62M134 58L140 50" />
          </>
        )}
        {variant === 'hills' && (
          <>
            <circle cx="112" cy="30" r="22" fill={colors.line} stroke="none" opacity=".35" />
            <path d="M0 95Q16 86 30 73L39 62 53 82Q73 73 89 60L109 87 130 68 160 97" opacity=".7" />
            <path d="M0 104Q39 92 81 101T160 97" />
          </>
        )}
      </g>
      <g stroke={colors.light} strokeWidth=".5" opacity=".22">
        <path d="M7 29V10Q7 7 10 7H29M131 7H150Q153 7 153 10V29M7 83V102Q7 105 10 105H29M131 105H150Q153 105 153 102V83" />
        <path d="M11 22V11H22M138 11H149V22M11 90V101H22M138 101H149V90" opacity=".5" />
      </g>
      {children}
      <rect
        x=".5"
        y=".5"
        width="159"
        height="111"
        rx="7.5"
        stroke={colors.light}
        strokeWidth=".5"
        opacity=".13"
      />
    </svg>
  );
}

export type ArtGlyphKind =
  | 'sword'
  | 'shield'
  | 'flame'
  | 'leaf'
  | 'bolt'
  | 'heart'
  | 'diamond'
  | 'club'
  | 'spade'
  | 'star'
  | 'moon'
  | 'sun'
  | 'skull'
  | 'eye'
  | 'coin'
  | 'gem'
  | 'crown'
  | 'book'
  | 'flask'
  | 'feather'
  | 'gear'
  | 'anchor'
  | 'wing'
  | 'claw'
  | 'fang'
  | 'mountain'
  | 'wave'
  | 'key'
  | 'hourglass'
  | 'spark'
  | 'seed';

/** A reusable illustrated object in a square. x/y locate its top-left corner. */
export function ArtGlyph({
  kind,
  x = 48,
  y = 24,
  size = 64,
  color = 'var(--art-light, #f3deb0)',
  accent = 'var(--art-accent, #ee9869)',
}: {
  kind: ArtGlyphKind;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  accent?: string;
}) {
  const objects: Record<ArtGlyphKind, () => ReactNode> = {
    sword: () => (
      <>
        <path d="M44 64V23L50 7 56 23V64Z" fill={color} />
        <path d="M50 17V60" opacity=".4" />
        <path d="M31 65L35 58 50 61 65 58 69 65 54 70V87H46V70Z" fill={accent} />
        <path d="M46 76H54M46 81H54" />
        <circle cx="50" cy="91" r="5" fill={accent} />
      </>
    ),
    shield: () => (
      <>
        <path d="M16 20L50 9 84 20 79 57Q72 77 50 92 28 77 21 57Z" fill={accent} />
        <path d="M25 27L50 18 75 27 70 56Q65 70 50 82 35 70 30 56Z" fill={color} />
        <path d="M50 20V80M29 41H71" opacity=".5" />
        <path d="M50 31L63 49 50 64 37 49Z" fill={accent} />
      </>
    ),
    flame: () => (
      <>
        <path
          d="M50 6Q59 25 48 39 66 32 68 18 92 50 78 73 69 91 49 92 24 92 19 72 13 54 32 35 26 59 39 56 47 49 42 34 36 22 50 6Z"
          fill={accent}
        />
        <path
          d="M50 47Q52 63 63 61 69 76 55 85 38 91 32 75 31 65 42 56 38 71 47 70 53 67 50 47Z"
          fill={color}
          stroke="none"
        />
      </>
    ),
    leaf: () => (
      <>
        <path d="M16 78Q8 18 83 10 93 77 25 83Z" fill={accent} />
        <path
          d="M13 92L72 24M35 65L31 40M48 49L48 27M35 65L62 67M49 49L74 49"
          stroke={color}
          strokeWidth="3"
        />
      </>
    ),
    bolt: () => (
      <>
        <path d="M53 7L18 56H44L34 93 84 35H57L69 7Z" fill={color} />
        <path d="M56 24L35 48H54L48 72 69 44H49Z" fill={accent} stroke="none" />
      </>
    ),
    heart: () => (
      <>
        <path d="M50 87L17 56C-9 25 26 2 50 28 74 2 109 25 83 56Z" fill={color} />
        <path d="M20 36Q26 22 37 31" stroke={accent} strokeWidth="4" />
      </>
    ),
    diamond: () => (
      <>
        <path d="M50 5L87 50 50 95 13 50Z" fill={color} />
        <path d="M50 16L75 50 50 83 26 50Z" fill={accent} />
        <path d="M50 16V83M26 50H75" opacity=".45" />
      </>
    ),
    club: () => (
      <>
        <path
          d="M42 66C13 89-2 51 24 42 12 12 56-3 65 24 68 32 64 38 62 42 89 30 103 66 78 74 66 80 56 72 54 65L59 89H35Z"
          fill={color}
        />
        <path d="M29 52Q21 58 27 64M38 22Q32 27 34 32" stroke={accent} strokeWidth="4" />
      </>
    ),
    spade: () => (
      <>
        <path d="M50 7L82 41C109 68 72 91 55 67L62 92H38L45 67C28 91-9 68 18 41Z" fill={color} />
        <path d="M23 51L42 30" stroke={accent} strokeWidth="4" />
      </>
    ),
    star: () => (
      <>
        <path d="M50 5L62 35 94 38 70 59 77 92 50 74 23 92 30 59 6 38 38 35Z" fill={color} />
        <path
          d="M50 20L56 43 79 43 60 55 66 77 50 63 34 77 40 55 21 43 44 43Z"
          fill={accent}
          stroke="none"
        />
      </>
    ),
    moon: () => (
      <>
        <path d="M67 9C23 4 0 51 28 79 52 104 88 87 94 59 52 76 31 31 67 9Z" fill={color} />
        <path d="M22 49Q22 73 43 81" stroke={accent} strokeWidth="4" />
        <path d="M77 14L80 23 90 26 80 29 77 39 74 29 64 26 74 23Z" fill={accent} stroke="none" />
      </>
    ),
    sun: () => (
      <>
        <g fill={accent} stroke="none">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M50 3 52 16 48 16Z" transform={`rotate(${i * 30} 50 50)`} />
          ))}
        </g>
        <circle cx="50" cy="50" r="27" fill={color} />
        <circle cx="50" cy="50" r="21" fill="none" stroke={accent} strokeWidth="1.1" />
        <path d="M50 23A27 27 0 0 1 50 77 33 24 0 0 0 50 23Z" fill={accent} stroke="none" />
        <circle cx="50" cy="50" r="33" fill="none" stroke={accent} strokeWidth=".7" />
      </>
    ),
    skull: () => (
      <>
        <path
          d="M25 64C16 61 14 50 16 37 19 5 77 3 84 36 88 51 85 61 76 65L69 70 68 88Q51 97 34 88L32 70Z"
          fill={color}
        />
        <path
          d="M57 13Q77 22 77 43L68 56 71 70 65 87 53 90 58 71 64 59 55 47Z"
          fill={accent}
          stroke="none"
        />
        <path
          d="M24 42Q32 35 43 44L41 58Q26 62 24 42ZM75 42Q65 36 57 45L60 58Q74 61 75 42Z"
          fill="var(--art-ink, #301f25)"
          stroke="none"
        />
        <path d="M49 54 44 68 51 65 55 68Z" fill="var(--art-ink, #301f25)" stroke="none" />
        <path
          d="M35 74Q51 81 67 74M40 76V85M47 78V88M54 78V88M61 76V85"
          fill="none"
          strokeWidth="1.2"
        />
        <path
          d="M29 25Q37 16 48 17M22 63 31 64M70 63 78 61"
          fill="none"
          stroke={accent}
          strokeWidth="1"
        />
      </>
    ),
    eye: () => (
      <>
        <path d="M5 52Q46 16 95 50 48 83 5 52Z" fill={color} />
        <path d="M5 52Q46 5 95 50Q47 20 5 52Z" fill={accent} stroke="none" />
        <circle cx="51" cy="50" r="17" fill={accent} strokeWidth="1.1" />
        <path d="M52 34Q61 51 50 67 42 50 52 34Z" fill="var(--art-ink, #301f25)" stroke="none" />
        <path d="M15 67Q48 86 85 66" fill="none" stroke={accent} strokeWidth="1.1" />
        <circle cx="57" cy="44" r="2.5" fill={color} stroke="none" />
      </>
    ),
    coin: () => (
      <>
        <ellipse cx="50" cy="54" rx="35" ry="38" fill={accent} />
        <circle cx="50" cy="47" r="35" fill={color} />
        <circle cx="50" cy="47" r="27" fill={accent} />
        <path d="M50 29L61 47 50 65 39 47Z" fill={color} />
        <path d="M25 78L27 85M39 86V91M56 86V92M71 80V85" />
      </>
    ),
    gem: () => (
      <>
        <path d="M26 15H74L94 40 50 91 6 40Z" fill={accent} />
        <path d="M26 15L35 40 50 91 66 40 74 15M6 40H94M35 40L50 15 66 40" stroke={color} />
        <path d="M26 15H50L35 40H6Z" fill={color} opacity=".7" />
      </>
    ),
    crown: () => (
      <>
        <path d="M14 29L34 43 50 16 67 43 87 29 78 78H23Z" fill={accent} />
        <path d="M24 65H78V81H24Z" fill={color} />
        <path d="M50 37L58 51 50 61 42 51Z" fill={color} />
        <circle cx="14" cy="27" r="5" fill={color} />
        <circle cx="50" cy="14" r="5" fill={color} />
        <circle cx="87" cy="27" r="5" fill={color} />
      </>
    ),
    book: () => (
      <>
        <path d="M11 24Q32 13 50 26 68 13 89 24V81Q68 69 50 82 32 69 11 81Z" fill={accent} />
        <path d="M16 19Q33 12 50 26 67 12 84 19V73Q68 66 50 78 33 66 16 73Z" fill={color} />
        <path d="M50 28V77M24 31Q33 29 42 35M24 42Q33 40 42 46M24 53Q33 51 42 57M58 35Q67 29 76 31M58 46Q67 40 76 42M58 57Q67 51 76 53" />
      </>
    ),
    flask: () => (
      <>
        <path d="M37 13H63V22H58V41L80 73Q87 90 69 90H31Q13 90 20 73L42 41V22H37Z" fill={color} />
        <path d="M32 58Q49 68 68 58L78 77Q82 84 70 84H30Q18 84 22 77Z" fill={accent} />
        <path d="M43 7H57V17H43Z" fill={accent} />
        <circle cx="45" cy="75" r="4" fill={color} stroke="none" />
        <circle cx="59" cy="68" r="3" fill={color} stroke="none" />
      </>
    ),
    feather: () => (
      <>
        <path d="M18 78Q8 40 51 13 77-2 84 10 96 38 65 65L46 68 45 78 32 77 26 85Z" fill={color} />
        <path
          d="M10 93L75 19M29 73L28 53M41 59L38 37M53 45L53 24M41 59L62 59M54 45L77 43"
          stroke={accent}
          strokeWidth="3"
        />
      </>
    ),
    gear: () => (
      <>
        <path
          d="M42 7H58L61 20 71 24 83 17 93 31 82 40 84 51 96 57 90 74 76 72 68 80 66 94H48L43 81 32 77 20 83 9 69 18 58 16 48 4 41 11 25 25 27 35 21Z"
          fill={accent}
        />
        <circle cx="50" cy="50" r="25" fill={color} />
        <circle cx="50" cy="50" r="13" fill={accent} />
        <path d="M46 38H54V63H46Z" fill="var(--art-ink, #301f25)" stroke="none" />
      </>
    ),
    anchor: () => (
      <>
        <circle cx="50" cy="18" r="10" stroke={color} strokeWidth="7" />
        <path
          d="M50 28V86M28 41H72M13 58Q12 80 50 91 87 80 87 58M7 67L13 54 26 61M74 61L87 54 93 67"
          stroke={color}
          strokeWidth="7"
          fill="none"
        />
        <path d="M50 36V78" stroke={accent} strokeWidth="2" />
      </>
    ),
    wing: () => (
      <>
        <path
          d="M19 86Q0 56 22 31 15 52 29 53L75 8 64 34 91 18 77 45 96 38 79 65 58 69 48 82Z"
          fill={color}
        />
        <path
          d="M23 78L68 34M31 69L50 71M43 55L63 58M55 42L70 45"
          stroke={accent}
          strokeWidth="3"
        />
      </>
    ),
    claw: () => (
      <>
        <path
          d="M23 15Q17 59 11 81L28 65 35 8ZM52 12Q45 60 39 89L58 66 65 5ZM80 17Q73 60 67 82L86 61 91 12Z"
          fill={color}
        />
        <path d="M18 79L9 91M45 87L42 98M74 78L71 91" stroke={accent} strokeWidth="4" />
      </>
    ),
    fang: () => (
      <>
        <path d="M17 19Q54 0 81 21 80 65 33 93 49 53 17 19Z" fill={color} />
        <path d="M31 24Q52 12 70 26M59 31Q70 57 39 83" stroke={accent} strokeWidth="4" />
      </>
    ),
    mountain: () => (
      <>
        <path d="M5 86L37 30 49 48 66 9 96 86Z" fill={accent} />
        <path
          d="M50 45L66 9 80 45 67 35 62 44 57 34ZM22 56L37 30 49 48 43 56 37 47 32 57Z"
          fill={color}
        />
        <path d="M10 91H91M52 83L66 48" stroke={color} />
      </>
    ),
    wave: () => (
      <>
        <path
          d="M6 78Q39 84 44 47 48 10 82 22 62 21 60 41 58 57 76 57 89 57 94 46 96 80 70 88H6Z"
          fill={accent}
        />
        <path d="M8 79Q47 91 51 51 53 32 68 31M59 71Q81 78 91 61" stroke={color} strokeWidth="5" />
      </>
    ),
    key: () => (
      <>
        <path d="M43 49L76 83 89 70 80 61 73 67 67 61 74 54 62 42Z" fill={accent} />
        <circle cx="33" cy="31" r="24" fill={color} />
        <circle cx="33" cy="31" r="11" fill={accent} />
        <path d="M20 14Q31 8 42 14" stroke={accent} />
      </>
    ),
    hourglass: () => (
      <>
        <path d="M25 16H75Q75 38 56 50 75 62 75 85H25Q25 63 44 50 25 38 25 16Z" fill={color} />
        <path
          d="M33 28H67Q64 41 50 46 36 41 33 28ZM31 80Q38 66 50 60 62 66 69 80Z"
          fill={accent}
          stroke="none"
        />
        <path d="M20 10H80V18H20ZM20 84H80V92H20Z" fill={accent} />
        <path d="M50 48V64" stroke={accent} strokeWidth="3" />
      </>
    ),
    spark: () => (
      <>
        <path
          d="M50 3L59 31 81 16 68 41 96 50 68 59 81 84 59 69 50 97 41 69 19 84 32 59 4 50 32 41 19 16 41 31Z"
          fill={accent}
        />
        <path d="M50 24L58 42 76 50 58 58 50 76 42 58 24 50 42 42Z" fill={color} />
      </>
    ),
    seed: () => (
      <>
        <path
          d="M50 87V44M49 61Q15 68 14 26 50 25 49 61ZM51 47Q48 13 85 11 85 44 51 47Z"
          fill={accent}
          stroke={color}
          strokeWidth="3"
        />
        <path d="M24 37L44 57M75 22L56 41" stroke={color} />
        <path d="M22 90Q50 73 78 90" fill={color} />
      </>
    ),
  };
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size / 100})`}
      stroke="var(--art-ink, #301f25)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {objects[kind]()}
    </g>
  );
}
