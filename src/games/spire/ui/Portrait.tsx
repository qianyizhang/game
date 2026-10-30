import { CharacterArt } from './CharacterArt';
import { ActOneEnemyArt, isActOneEnemy } from './ActOneEnemyArt';
import { BeyondConstructArt } from './BeyondConstructArt';

/** City subjects share ink and light, but each owns its gesture and contour. */
function CityEnemyArt({ id }: { id: string }) {
  if (id === 'bookOfStabbing')
    return (
      <g stroke="#34312f" strokeLinejoin="round" strokeLinecap="round">
        {/* A sprung-open grimoire pitches forward behind its stabbing page. */}
        <path
          d="M48 66 33 36q37-12 58 12 22-29 60-22l-5 79-48 31-54-20Z"
          fill="#583d42"
          strokeWidth="3"
        />
        <path
          d="M49 65 40 44q30-6 51 14 22-26 51-24l-6 61-39 29-48-16Z"
          fill="#c2ad82"
          strokeWidth="2"
        />
        <path d="M91 58Q72 21 48 19l9 18q23 3 34 21Z" fill="#e9d8ac" strokeWidth="2" />
        <path d="M91 58q-14-21-45-21l10 61q20 0 40 22Z" fill="#ede0b8" strokeWidth="2" />
        <path d="M91 58q19-28 47-24l-9 60q-16 4-33 26Z" fill="#d6c497" strokeWidth="2" />
        <path d="m91 58 5 62 8-56 10-21q-14 6-23 15Z" fill="#91805f" stroke="none" />
        <path
          d="M55 52q14 1 24 11m-23 1 25 12m-22 0 23 12m-21-1 22 13M110 56l17-10m-17 22 16-10m-16 23 14-10"
          fill="none"
          stroke="#9b865f"
          strokeWidth="2"
        />
        <path
          d="M58 110q-17 14-28 6l6 19q22 0 35-19M113 112q30 4 40-9l-4 22q-23 9-42-2"
          fill="#ba7555"
          strokeWidth="2"
        />
        <path d="M88 107q-4 19-17 19l-18 2 9 16 31-4 14-25Z" fill="#554347" strokeWidth="3" />
        <path d="m69 120-11-8-29 34-12 28 28-13 33-31Z" fill="#91a6a3" strokeWidth="3" />
        <path d="m61 121-32 35-12 18 28-13 28-31Z" fill="#d7ded0" strokeWidth="1.5" />
        <path d="m54 112 22 21" fill="none" stroke="#c08c50" strokeWidth="6" />
        <path
          d="m48 31-12-6m94-4 15-6M151 63l10-9m-7 33 13-1"
          fill="none"
          stroke="#9c8664"
          strokeWidth="2"
        />
      </g>
    );
  if (id === 'mystic')
    return (
      <g stroke="#34372f" strokeLinejoin="round" strokeLinecap="round">
        {/* A leaning healer answers the staff with an open, cupped hand. */}
        <path
          d="M85 72q-23 12-25 43l-14 44q31 13 69 1l-13-49 12-29Z"
          fill="#526d66"
          strokeWidth="3"
        />
        <path
          d="m84 85-10 38-20 32 26 3 10-36 9 39 18-4-14-48 3-26Z"
          fill="#88a295"
          stroke="none"
        />
        <path
          d="m88 113-13 45 16-3 7-35M69 99l-6 23m42 9 5 19"
          fill="none"
          stroke="#36534e"
          strokeWidth="2"
        />
        <path d="M83 84q-19 6-29 29l-21-7-4 10q26 16 36 6l22-24" fill="#7d9586" strokeWidth="3" />
        <path d="m35 107-9-9-9 1 8 7-11-3-3 5 15 11 8-4" fill="#ccb58c" strokeWidth="2" />
        <path d="M103 87q16 6 23 27l15-3 2 10-20 7q-10-2-21-20" fill="#a5b6a0" strokeWidth="3" />
        <path d="m139 110 10-3 5 7-5 11-10-4Z" fill="#d8c29a" strokeWidth="2" />
        <path
          d="M143 158 150 48q-16 1-16-13 0-15 14-18 17-1 19 13l-10 11-9-7"
          fill="none"
          stroke="#493d31"
          strokeWidth="8"
        />
        <path d="M142 153 149 49m-3-28q13-2 16 8" fill="none" stroke="#b38d55" strokeWidth="3" />
        <path d="M71 72q-11-30 11-44 23-7 31 15l2 35-21 16Z" fill="#38564f" strokeWidth="3" />
        <path d="M81 44q13-11 23 1l-1 20-12 14-10-8-5-16Z" fill="#ceb893" strokeWidth="2" />
        <path
          d="m79 47 12-10 16 9-9-20q-18-2-25 17l-3 25 12 12-7-25Z"
          fill="#b5bda2"
          strokeWidth="2"
        />
        <path d="m82 53 7 2m7-1 6-3m-11 8-2 6 7 1" fill="none" stroke="#534a39" strokeWidth="2.5" />
        <path d="M89 72q-1 11 9 13l7-16-6 4-4-3Z" fill="#e3d4ae" strokeWidth="1.5" />
        <path d="m81 82 9 17 13-14" fill="none" stroke="#c5a76c" strokeWidth="3" />
        <path
          d="M25 83q-11-6-8-18 15 1 14 13 7-13 17-12-1 16-17 17Z"
          fill="#acc398"
          strokeWidth="2"
        />
        <path d="m30 84-1 12m-8-9-5 3m20-2 5 2" fill="none" stroke="#6a886c" strokeWidth="2" />
        <path d="m26 54 3-7 3 7-3 7Zm17 33 3-5 3 5-3 5Z" fill="#e0d8aa" strokeWidth="1.5" />
      </g>
    );
  if (id === 'centurion')
    return (
      <g stroke="#333530" strokeLinejoin="round" strokeLinecap="round">
        {/* Low, weight-bearing armor; a broad shield shelters the ally. */}
        <path d="m67 75-19 19-8 60 42-6 26 12 26-8-14-67Z" fill="#784b40" strokeWidth="3" />
        <path
          d="m76 119-15 33-12 6 2 7 28-2 13-37 13 35 25 2 2-7-14-9-8-29Z"
          fill="#4e5551"
          strokeWidth="3"
        />
        <path d="m64 143 16 5-5 11-18-2m46-10 18-5 4 13-19 2" fill="#a7aaa0" strokeWidth="2" />
        <path d="M66 67 104 66l17 25-8 33-44 1-17-31Z" fill="#7f8980" strokeWidth="3" />
        <path d="m70 76 25-3 11 15-9 21-29-4-8-16Z" fill="#b2b8a7" strokeWidth="2" />
        <path d="m78 75 3 31 14 3 9-23-8-13Z" fill="#d3d1b4" stroke="none" />
        <path d="m65 108 42 4 2 10-40-1Z" fill="#735845" strokeWidth="2" />
        <path
          d="M62 74 45 85l-2 20 22 5 8-21m31-15 18 7 7 16-21 11-9-20"
          fill="#8f9b90"
          strokeWidth="3"
        />
        <path d="M61 48q-2-26 21-29 26-1 30 23l-8 28-32 1Z" fill="#929e94" strokeWidth="3" />
        <path d="M63 42q12-13 39-8l-4 9-20 2-3 20-10-9Z" fill="#c5c9b4" strokeWidth="2" />
        <path d="m78 45 22-4 4 15-19 9-9-8Z" fill="#353e3b" strokeWidth="2" />
        <path d="m86 47 9-2m-10 12 11-3" fill="none" stroke="#d5b37a" strokeWidth="2" />
        <path d="M73 22 68 11q25-13 42 4l-6 14q-18-12-31-7Z" fill="#985a46" strokeWidth="3" />
        <path d="M73 15q16-4 29 5" fill="none" stroke="#c78e64" strokeWidth="3" />
        <path d="m46 95-12 19-12-4-3-14 25-13Z" fill="#b0b8a4" strokeWidth="3" />
        <path d="M24 103 10 65l3-18 15 12 12 39Z" fill="#b8c7bc" strokeWidth="3" />
        <path d="M15 56 31 98" fill="none" stroke="#e2dfc6" strokeWidth="2" />
        <path d="m20 106 22-8" fill="none" stroke="#ba8d54" strokeWidth="5" />
        <path d="M112 86q25-8 45 0l-1 45q-8 19-27 31-22-15-26-34Z" fill="#596e69" strokeWidth="4" />
        <path
          d="m117 92 13-3 17 3-1 37-17 22-16-24Z"
          fill="#a6b3a3"
          stroke="#c3b37e"
          strokeWidth="3"
        />
        <path d="m130 90-1 59 17-21 1-36Z" fill="#758b7f" stroke="none" />
        <path d="m129 102 10 16-10 17-10-17Z" fill="#c2a572" strokeWidth="2" />
      </g>
    );
  if (id === 'chosen')
    return (
      <g stroke="#37313b" strokeLinejoin="round" strokeLinecap="round">
        {/* A hooked beak bows into a descending hex, opposite the healer's lift. */}
        <path
          d="M90 23q-32 9-29 46l6 25-18 59 19 9 39-8 27 8-15-60-5-36Z"
          fill="#534558"
          strokeWidth="3"
        />
        <path d="M83 82 74 115l-17 36 24 5 19-52 22 48-13-62Z" fill="#86758b" stroke="none" />
        <path d="m80 112-8 35m32-28 7 29" fill="none" stroke="#b0a08e" strokeWidth="2" />
        <path
          d="M69 79q-14 8-21 24l-23-5-3 14 29 9 27-22m35-17q19 8 24 26l15-5 6 12-23 14-27-23"
          fill="#746379"
          strokeWidth="3"
        />
        <path
          d="m26 98-11-8-8 2 10 6-9 1 1 6 14 7m129-9 8-8 9 1-8 8 10 1-1 6-14 4"
          fill="#b5a291"
          strokeWidth="2"
        />
        <path d="M61 58q-2-28 27-42l26 30-6 31-23 14-25-17Z" fill="#77677e" strokeWidth="3" />
        <path d="m83 28-8 27 25-7-2 32 15-22-1-12Z" fill="#a18d99" stroke="none" />
        <path d="m70 53 24-8 14 10-7 25-25-5-12-14Z" fill="#292f32" strokeWidth="2" />
        <path d="m70 60 17 1 13 17-7 12-4-15-22-6Z" fill="#d9cba6" strokeWidth="2" />
        <path d="m78 54 9-2" fill="none" stroke="#d29a61" strokeWidth="3" />
        <path d="m84 90 9 14 14-17" fill="none" stroke="#bb9666" strokeWidth="3" />
        <path
          d="M24 119v22m-9-11h18m-9-11-6 6 6 6 6-6Zm-4 26 4 7 4-7"
          fill="none"
          stroke="#a17882"
          strokeWidth="3"
        />
      </g>
    );
  if (id === 'sphericGuardian')
    return (
      <g stroke="#303c39" strokeLinejoin="round" strokeLinecap="round">
        {/* Nested spherical plates surround a recessed lens, suspended above the floor. */}
        <path
          d="m43 132-9 14 16 11m82-27 13 14-17 13"
          fill="none"
          stroke="#7a8c80"
          strokeWidth="6"
        />
        <path
          d="M35 91q-2-52 46-64 51-10 67 36 19 51-21 77-51 28-83-14Z"
          fill="#607f77"
          strokeWidth="3"
        />
        <path d="M42 74q10-37 47-39 26-2 43 18l-28 14-41 35-23-7Z" fill="#b4c0aa" strokeWidth="2" />
        <path
          d="M44 109q4 33 36 39l-4-31 29-38 36-12-5-13-34 12-42 38Z"
          fill="#3d5c56"
          strokeWidth="2"
        />
        <path d="M101 34q34 12 39 42l-12 9-20-19Z" fill="#8da797" strokeWidth="2" />
        <path d="M103 111 143 91q-1 33-27 47l-28 11Z" fill="#829c8d" strokeWidth="2" />
        <path
          d="M92 48q-28 3-33 32-4 31 22 43 24 9 39-12 20-29-2-51Z"
          fill="#bc9d67"
          strokeWidth="3"
        />
        <path
          d="M92 57q-23 4-25 27-1 26 19 31 23 6 30-20 8-24-13-35Z"
          fill="#2e4946"
          strokeWidth="3"
        />
        <path d="M89 65q-17 10-14 30l12 12 17-5 8-18-10-17Z" fill="#647f73" strokeWidth="2" />
        <path d="m89 74 12-5 5 16-7 17-12-6-3-12Z" fill="#e0c37f" strokeWidth="2" />
        <path d="m88 79 7-3-2 19-6-5Z" fill="#f1e3b4" stroke="none" />
        <path
          d="m48 63 10-9m57 68 11-9M83 31l2 11m50 51 10-2m-85 43 8-8"
          fill="none"
          stroke="#d2bd88"
          strokeWidth="2"
        />
        <path
          d="M53 151q31 15 71-2M65 161q20 5 42-1"
          fill="none"
          stroke="#ac9b76"
          strokeWidth="2"
        />
      </g>
    );
  if (id === 'snakePlant')
    return (
      <g stroke="#354333" strokeLinejoin="round" strokeLinecap="round">
        {/* A rooted S-curve opens one dominant carnivorous jaw. */}
        <path
          d="M89 152q-28-14-19-40 5-16 25-22l13 13q-20 1-24 15-3 15 21 23Z"
          fill="#627d4e"
          strokeWidth="3"
        />
        <path d="M91 147q-24-15-13-34" fill="none" stroke="#aaba77" strokeWidth="5" />
        <path
          d="M88 146q-34-27-65-9 21 29 66 19-3 12-27 12l26-4 22-9q29 6 50-9-20-22-52-3Z"
          fill="#62754b"
          strokeWidth="3"
        />
        <path d="M30 140q29-1 50 11m34-3 36-2" fill="none" stroke="#b1ba7a" strokeWidth="2" />
        <path
          d="M72 128q-31 1-38-32 31 1 41 25m18 9q3-29 31-34 0 28-24 39"
          fill="#899a5e"
          strokeWidth="3"
        />
        <path d="m45 105 25 19m44-17-15 23" fill="none" stroke="#c4c88a" strokeWidth="2" />
        <path
          d="M79 88q-28-18-20-44 5-22 32-24l36 10 17 31-30 9-17 28Z"
          fill="#657f4d"
          strokeWidth="3"
        />
        <path d="M70 43q19-21 49-8l12 16-30 1-28 19Z" fill="#a6b276" strokeWidth="2" />
        <path d="M75 66q26-22 59-11l17 13-17 15-20-3-14 19-19-5Z" fill="#462f34" strokeWidth="3" />
        <path
          d="m83 69 9-7 6 13 9-17 7 14 10-13 4 14 11-9-7 17-18-3-15 15-14-5Z"
          fill="#e2d5a6"
          strokeWidth="1.5"
        />
        <path d="M76 91q26 3 39-10l20 3-9 19q-21 16-42 0Z" fill="#b18766" strokeWidth="3" />
        <path d="M86 99q22 2 34-8" fill="none" stroke="#ddc18a" strokeWidth="3" />
        <path d="m90 47 10-5 7 4-13 8Z" fill="#d7b874" strokeWidth="2" />
        <path d="M63 48 47 38l-2 20 17 15m45-44 14-17 4 24" fill="#83985a" strokeWidth="3" />
        <path d="m144 101 4-4m9 17 3 3m-17 8 2 4" fill="none" stroke="#9b9f70" strokeWidth="3" />
      </g>
    );
  if (id === 'taskmaster')
    return (
      <g stroke="#383230" strokeLinejoin="round" strokeLinecap="round">
        {/* A forward braced torso pulls a single looping whip overhead. */}
        <path
          d="M128 104q34-20 29-56-4-29-33-32-31-1-35 18-3 16 16 17 15-1 13-14"
          fill="none"
          stroke="#493d34"
          strokeWidth="5"
        />
        <path d="M128 104q34-20 29-56-4-29-33-32" fill="none" stroke="#b68c58" strokeWidth="2" />
        <path d="m103 43 4-11 11 4-4 12" fill="#c4a36b" strokeWidth="2" />
        <path
          d="m60 106-12 44-16 9 4 7 32-2 11-30 18 26 29 4 3-8-18-9-12-39Z"
          fill="#4f4842"
          strokeWidth="3"
        />
        <path d="m48 144 19 2-5 14-22-1m60-11 16-5 8 13-19 1" fill="#a5987b" strokeWidth="2" />
        <path d="M59 60q-19 12-16 41l18 23 41-7 7-43-25-18Z" fill="#9b7962" strokeWidth="3" />
        <path d="M57 67 47 85l11 16 14-7 19 11 9-28-19-14Z" fill="#c2a17b" stroke="none" />
        <path d="m60 62 14 4 5 42-12 5Zm30 3 12 11-9 36-12-6Z" fill="#685044" strokeWidth="2" />
        <path d="m51 108 49-3 1 14-42 8Z" fill="#8c5f45" strokeWidth="3" />
        <path d="m71 109 12-2 2 11-12 2Z" fill="#c3a368" strokeWidth="2" />
        <path
          d="M47 73Q31 79 22 105l10 13 22-25m45-22 18 15 9-13 11 6q-4 33-23 25L94 91"
          fill="#b69874"
          strokeWidth="3"
        />
        <path
          d="m24 100-8 7 1 14 12 5 8-12-8-11m97-27 4-12 11-1 5 8-10 11Z"
          fill="#d0b18a"
          strokeWidth="2"
        />
        <path d="m124 78 19 10" fill="none" stroke="#62432f" strokeWidth="7" />
        <path d="M58 31q14-16 31-1l8 17-16 20-24-12-6-14Z" fill="#b39677" strokeWidth="3" />
        <path d="M53 36q8-26 28-16l11 12-14-3-16 14-6 9Z" fill="#5b5146" strokeWidth="3" />
        <path d="m62 45 8-2m9 5 7 1m-14 8 12 3" fill="none" stroke="#594737" strokeWidth="3" />
        <path d="m56 55-3 12 15 5 5-10" fill="#6e5142" strokeWidth="2" />
      </g>
    );
  return null;
}

/** Original, code-drawn silhouettes: no commercial art assets. */
export function Portrait({ id }: { id: string }) {
  if (id === 'ironclad' || id === 'silent') return <CharacterArt id={id} />;
  if (id === 'spiker' || id === 'repulsor' || id === 'exploder' || id === 'orbWalker')
    return (
      <svg className="fighter-portrait" viewBox="0 0 180 180" aria-hidden="true" focusable="false">
        <ellipse cx="90" cy="162" rx="66" ry="10" fill="#000" opacity=".25" />
        <BeyondConstructArt id={id} />
      </svg>
    );
  if (
    id === 'bookOfStabbing' ||
    id === 'mystic' ||
    id === 'centurion' ||
    id === 'chosen' ||
    id === 'sphericGuardian' ||
    id === 'snakePlant' ||
    id === 'taskmaster'
  )
    return (
      <svg className="fighter-portrait" viewBox="0 0 180 180" aria-hidden="true" focusable="false">
        <ellipse cx="90" cy="162" rx="66" ry="10" fill="#000" opacity=".25" />
        <CityEnemyArt id={id} />
      </svg>
    );
  if (isActOneEnemy(id))
    return (
      <svg className="fighter-portrait" viewBox="0 0 180 180" aria-hidden="true" focusable="false">
        <ellipse cx="90" cy="162" rx="66" ry="10" fill="#000" opacity=".25" />
        <ActOneEnemyArt id={id} />
      </svg>
    );
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
