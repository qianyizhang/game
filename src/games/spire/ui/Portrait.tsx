import { CharacterArt } from './CharacterArt';
/** Original, code-drawn silhouettes: no commercial art assets. */
export function Portrait({ id }: { id: string }) {
  if (id === 'ironclad' || id === 'silent') return <CharacterArt id={id} />;
  const slime = /slime/i.test(id),
    machine = /sentr|sphere|donu|deca|orb|guardian/i.test(id);
  return (
    <svg className="fighter-portrait" viewBox="0 0 180 180" aria-hidden="true" focusable="false">
      <ellipse cx="90" cy="162" rx="66" ry="10" fill="#000" opacity=".25" />
      {/louse|jawWorm|snakePlant|lagavulin/i.test(id) ? (
        <g stroke="#34342d" strokeWidth="3">
          <path
            d="M30 145Q14 86 47 71Q58 37 92 62Q120 42 143 86L155 145Z"
            fill={id === 'redLouse' ? '#ac6452' : id === 'lagavulin' ? '#898777' : '#839b66'}
          />
          <path
            d="M35 102Q87 68 145 101M31 121Q90 83 151 121"
            fill="none"
            stroke="#454f3b"
            strokeWidth="6"
          />
          <path d="M49 130Q90 111 128 129L117 151H61Z" fill="#302c29" />
          {[58, 76, 94, 112].map((x) => (
            <path key={x} d={`M${x} 127l5 12 6-14`} fill="#e5d8b8" strokeWidth="1" />
          ))}
          <path d="M56 104l12 2m42-2 12-2" stroke="#ecbf73" strokeWidth="5" />
          <path d="M38 137 20 157m34-13-9 21m87-26 28 17m-44-11 14 20" fill="none" />
        </g>
      ) : /cultist|chosen|nemesis/i.test(id) ? (
        <g>
          <path
            d="M87 18 128 64 134 129 155 160 32 160 51 125 51 68Z"
            fill="#595169"
            stroke="#34313c"
            strokeWidth="4"
          />
          <path d="M71 51 110 48 123 73 105 102 65 88Z" fill="#222d30" />
          <path d="M74 66 101 65 121 89 83 80Z" fill="#d7c497" />
          <path d="M83 62l13 3" stroke="#edaa71" strokeWidth="4" />
          <path d="M59 100 22 85 35 111 55 122m67-22 40-16-16 30-19 10" fill="#81778b" />
        </g>
      ) : slime ? (
        <g>
          <path
            d="M24 154Q12 121 37 109Q35 40 90 43Q146 35 149 113Q176 146 154 157Z"
            fill={/acid/i.test(id) ? '#87a978' : '#917bad'}
            stroke="#242c39"
            strokeWidth="4"
          />
          <path
            d="M53 100l20 8-19 7m72-15-20 8 19 7"
            fill="none"
            stroke="#20202b"
            strokeWidth="5"
          />
          <path d="M70 133q20 14 41-3" fill="none" stroke="#232132" strokeWidth="5" />
          {id === 'slimeBoss' && (
            <path
              d="M42 49h95v-13H118V8H63v28H42Z"
              fill="#312e40"
              stroke="#b5a78b"
              strokeWidth="3"
            />
          )}
        </g>
      ) : machine ? (
        <g transform="translate(90 92)">
          <path
            d={
              id === 'deca' ? 'M-55-42H48L65 40 0 65-63 40Z' : 'M0-65 59-24 48 44 0 66-51 41-60-25Z'
            }
            fill="#6a8580"
            stroke="#cbbf95"
            strokeWidth="5"
          />
          <circle r="29" fill="#273640" stroke="#bb8d52" strokeWidth="9" />
          <circle r="12" fill="#e7c46e" />
          <path d="M-43-40 43 40m0-80-86 80" stroke="#cbbf95" strokeWidth="3" opacity=".4" />
        </g>
      ) : (
        <g>
          <path d="M72 71Q44 94 36 154L102 143 142 158 125 78Z" fill="#49434f" />
          <path d="M69 78 107 74 122 112 95 124 65 114Z" fill="#9a8c78" />
          <path d="M70 111 61 158 80 162 93 128 102 163 124 160 115 116Z" fill="#35313d" />
          <path
            d="M76 32 108 27 121 48 107 76 79 69 67 49Z"
            fill="#8d806d"
            stroke="#2a2834"
            strokeWidth="3"
          />
          <path
            d="m78 48 10 3m11-3 10-3M93 32l-4 34"
            fill="none"
            stroke="#482e32"
            strokeWidth="5"
          />
          <path
            d="M64 83 45 113 54 121 79 92M114 83l23 29"
            fill="none"
            stroke="#9a8c78"
            strokeWidth="15"
          />
          <path
            d="m137 122-10-5 22-85 13-13 2 20Z"
            fill="#afbec0"
            stroke="#292c37"
            strokeWidth="3"
          />
          <path d="m119 115 28 8" stroke="#c69854" strokeWidth="7" />
          <path d="m70 37-17-22 26 15m25-5 28-15-16 30" fill="#c4aa7a" />
        </g>
      )}
    </svg>
  );
}
