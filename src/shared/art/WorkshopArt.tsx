import { ArtScene } from './CardArt';

export const WORKSHOP_SCENES = ['practice', 'packs', 'evidence', 'arena'] as const;
export const WORKSHOP_SYMBOLS = [
  'classic',
  'tempo',
  'economy',
  'composition',
  'scout',
  'ascension',
] as const;
export type WorkshopSceneKind = (typeof WORKSHOP_SCENES)[number];
export type WorkshopSymbolKind = (typeof WORKSHOP_SYMBOLS)[number];
const ink = '#26392f',
  paper = '#ecdbb5',
  gold = '#c39755',
  copper = '#b2674f',
  sage = '#98aa85';

function BrassDial({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={gold} stroke={ink} strokeWidth="1.7" />
      <circle cx={x} cy={y} r={r - 5} fill={ink} stroke={paper} strokeWidth=".65" />
      {Array.from({ length: 12 }, (_, i) => (
        <path
          key={i}
          d={`M${x} ${y - r + 7}v3`}
          transform={`rotate(${i * 30} ${x} ${y})`}
          stroke={gold}
          strokeWidth=".8"
        />
      ))}
    </g>
  );
}

export function WorkshopArt({ kind }: { kind: WorkshopSceneKind }) {
  return (
    <ArtScene
      palette={kind === 'arena' ? 'ember' : kind === 'practice' ? 'tide' : 'gold'}
      variant="night"
      className={`workshop-art workshop-art-${kind}`}
    >
      {kind === 'practice' && (
        <>
          <path d="M28 26L110 17 119 91 36 98Z" fill={paper} stroke={ink} strokeWidth="1.7" />
          <path
            d="M41 38L66 35 78 48 102 45M44 62L66 59 73 46M67 60L82 79 103 76M41 84L59 82"
            stroke="#859277"
            strokeWidth="1.2"
            fill="none"
          />
          <path d="M34 29L102 22M39 94L111 88" stroke={gold} strokeWidth=".7" />
          <BrassDial x={104} y={73} r={31} />
          <path d="M100 55L94 81 114 67Z" fill={copper} stroke={paper} strokeWidth=".65" />
          <path d="M100 55L104 74 94 81Z" fill={paper} />
          <circle cx="104" cy="74" r="3" fill={gold} />
          <path d="M47 51V30M46 30L42 24 47 20 52 24Z" fill={copper} stroke={ink} />
          <path d="M48 54Q65 46 70 55" stroke={gold} strokeWidth="2" fill="none" />
          <path d="M68 49L72 57 63 58" fill="none" stroke={gold} strokeWidth="2" />
        </>
      )}
      {kind === 'packs' && (
        <>
          <path
            d="M23 99L29 22H38L35 99M78 99L75 22H84L91 99"
            fill="#92704a"
            stroke={ink}
            strokeWidth="1.5"
          />
          <path d="M27 27H85V36H27ZM21 99H96V106H21Z" fill={gold} stroke={ink} strokeWidth="1.2" />
          <path d="M54 18V72" stroke={paper} strokeWidth="5" />
          <path d="M48 20L61 24M48 30L61 34M48 40L61 44M48 50L61 54" stroke={ink} strokeWidth="1" />
          <path d="M38 69H73L81 80H31Z" fill="#7c8980" stroke={ink} strokeWidth="1.3" />
          <path d="M32 86H85V95H32Z" fill={paper} stroke={ink} />
          <g transform="rotate(12 110 68)">
            <rect
              x="90"
              y="39"
              width="41"
              height="60"
              rx="3"
              fill={gold}
              stroke={ink}
              strokeWidth="1.5"
            />
            <rect
              x="86"
              y="35"
              width="41"
              height="60"
              rx="3"
              fill={paper}
              stroke={ink}
              strokeWidth="1.5"
            />
            <path d="M90 39H123V91H90Z" stroke={gold} strokeWidth=".8" />
            <path d="M106 47L117 63 106 80 96 63Z" fill={copper} />
            <path d="M84 58H129M102 33V97" stroke={ink} strokeWidth="1.4" />
            <path
              d="M102 58Q90 44 90 54 90 63 102 58 119 45 117 55 116 62 102 58Z"
              fill={gold}
              stroke={ink}
            />
          </g>
          <path d="M28 103H69M40 90H76M59 19H70" stroke={paper} strokeWidth=".7" />
        </>
      )}
      {kind === 'evidence' && (
        <>
          <path
            d="M27 32Q54 19 78 31 102 20 131 32L126 97Q101 86 78 99 50 87 23 96Z"
            fill={gold}
            stroke={ink}
            strokeWidth="1.5"
          />
          <path
            d="M31 28Q53 20 78 31 99 20 126 28L121 90Q98 82 78 94 51 82 29 90Z"
            fill={paper}
            stroke={ink}
            strokeWidth="1.2"
          />
          <path
            d="M78 32V92M38 37Q55 33 68 40M37 43Q53 40 68 46M35 50Q52 47 67 53M33 74Q51 70 69 78M88 38L115 33M88 44L115 40M89 73L115 69M88 80L112 75"
            stroke="#9c9473"
            strokeWidth=".8"
            fill="none"
          />
          <path
            d="M40 60L44 65 53 56M86 54L90 59 99 50"
            stroke={copper}
            strokeWidth="2"
            fill="none"
          />
          <path d="M113 72L140 101" stroke={ink} strokeWidth="9" strokeLinecap="round" />
          <path d="M114 74L139 99" stroke={gold} strokeWidth="5" strokeLinecap="round" />
          <circle cx="103" cy="61" r="21" fill="#c3d4b633" stroke={gold} strokeWidth="4" />
          <circle cx="103" cy="61" r="17" stroke={ink} strokeWidth="1" />
          <path d="M89 58Q90 48 100 47" stroke={paper} strokeWidth="2" fill="none" />
        </>
      )}
      {kind === 'arena' && (
        <>
          <path
            d="M43 28L80 14 119 29 140 56 123 89 80 104 37 90 18 58Z"
            fill={ink}
            stroke={gold}
            strokeWidth="1"
          />
          <path
            d="M44 33L80 21 115 34 133 57 118 83 80 96 42 84 26 58Z"
            fill="#875c43"
            stroke={gold}
            strokeWidth="1.1"
          />
          <path
            d="M48 39L80 28 110 40 124 58 111 77 80 88 48 78 34 58Z"
            fill="#344f44"
            stroke={paper}
            strokeWidth=".7"
          />
          <path
            d="M47 58Q79 31 113 58M47 58Q80 84 113 58M80 38V79"
            stroke={sage}
            strokeWidth=".9"
            fill="none"
            opacity=".6"
          />
          {[
            [80, 15],
            [119, 29],
            [140, 58],
            [121, 89],
            [80, 104],
            [38, 90],
            [19, 58],
            [41, 29],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="8"
                fill={i === 0 ? paper : gold}
                stroke={ink}
                strokeWidth="1.5"
              />
              <path d={`M${x - 3} ${y}l3-4 3 4-3 3Z`} fill={i === 0 ? copper : ink} />
            </g>
          ))}
          <path d="M72 54L80 45 89 54 86 67H74Z" fill={gold} stroke={ink} />
          <path d="M80 49V64M75 55H85" stroke={paper} strokeWidth=".8" />
        </>
      )}
    </ArtScene>
  );
}

export function WorkshopSymbol({ kind }: { kind: WorkshopSymbolKind }) {
  return (
    <svg
      className="workshop-symbol"
      data-workshop-symbol={kind}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'classic' && (
        <>
          <path
            d="M13 17L32 8 51 17 46 44 32 56 18 44Z"
            fill={gold}
            stroke={ink}
            strokeWidth="1.8"
          />
          <path d="M20 21L32 15 44 21 41 40 32 48 23 40Z" fill={ink} />
          <path d="M32 22L40 31 32 41 24 31Z" fill={paper} />
        </>
      )}
      {kind === 'tempo' && (
        <>
          <path d="M20 48L43 10 53 6 53 18 28 53Z" fill={paper} stroke={ink} strokeWidth="1.8" />
          <path d="M22 51L14 59M16 43L31 54" stroke={gold} strokeWidth="4" strokeLinecap="round" />
          <path d="M23 35C10 35 7 26 6 14C13 23 25 17 28 25L25 32Z" fill={sage} stroke={ink} />
          <path d="M10 22Q18 28 23 28" stroke={paper} strokeWidth="1" fill="none" />
        </>
      )}
      {kind === 'economy' && (
        <>
          <path d="M12 51V38H22V27H33V15H48V51Z" fill={gold} stroke={ink} strokeWidth="1.5" />
          <path d="M16 42H22M26 32H33M37 20H44" stroke={paper} strokeWidth="2" />
          <path d="M9 54H54" stroke={paper} strokeWidth="2" />
          <circle cx="18" cy="18" r="9" fill={paper} stroke={ink} strokeWidth="1.5" />
          <path d="M18 12V24M14 14H21M14 22H21" stroke={gold} strokeWidth="1.5" />
        </>
      )}
      {kind === 'composition' && (
        <>
          <path d="M32 13L15 46H49Z" stroke={gold} strokeWidth="4" strokeLinejoin="round" />
          {[
            [32, 14],
            [15, 46],
            [49, 46],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="10"
                fill={i === 0 ? paper : i === 1 ? sage : copper}
                stroke={ink}
                strokeWidth="1.5"
              />
              <circle cx={x} cy={y} r="3" fill={ink} />
            </g>
          ))}
        </>
      )}
      {kind === 'scout' && (
        <>
          <path d="M12 43L43 15 52 26 21 52Z" fill={gold} stroke={ink} strokeWidth="1.8" />
          <path d="M19 37L29 46M32 26L41 35" stroke={ink} strokeWidth="1.3" />
          <path d="M41 13L46 9 57 23 52 28Z" fill={paper} stroke={ink} strokeWidth="1.8" />
          <path d="M13 40L24 53 18 57 7 44Z" fill={ink} stroke={gold} strokeWidth="1.4" />
          <path d="M34 39L29 58M35 39L46 57" stroke={sage} strokeWidth="2.5" />
        </>
      )}
      {kind === 'ascension' && (
        <>
          <path d="M8 54L25 18 34 34 44 9 58 54Z" fill={sage} stroke={ink} strokeWidth="1.7" />
          <path d="M44 9L35 35 44 28 50 34Z" fill={paper} />
          <path d="M25 18L17 36 26 30 30 34Z" fill={paper} />
          <path d="M20 54L32 47 26 42 37 35 36 28" stroke={gold} strokeWidth="3" fill="none" />
          <circle cx="14" cy="15" r="5" fill={gold} />
        </>
      )}
    </svg>
  );
}
