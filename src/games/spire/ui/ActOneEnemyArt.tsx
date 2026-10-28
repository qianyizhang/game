import type { ReactNode } from 'react';

type ActOneEnemy = 'jawWorm' | 'redLouse' | 'greenLouse' | 'lagavulin' | 'sentry' | 'gremlinNob';

export function isActOneEnemy(id: string): id is ActOneEnemy {
  return (
    id === 'jawWorm' ||
    id === 'redLouse' ||
    id === 'greenLouse' ||
    id === 'lagavulin' ||
    id === 'sentry' ||
    id === 'gremlinNob'
  );
}

const ink = '#30352f';
const bone = '#ddcba3';

const figures: Record<ActOneEnemy, ReactNode> = {
  jawWorm: (
    <g stroke={ink} strokeLinejoin="round" strokeLinecap="round">
      {/* A coiled body throws its hinged jaw toward the target. */}
      <path
        d="M27 149Q9 121 24 83q13-30 46-31 21-3 37 20l-17 26-27 2q-19 24-4 50Z"
        fill="#52664c"
        strokeWidth="3"
      />
      <path d="M31 141Q22 119 31 91q9-24 36-26 15 0 24 13L73 95q-29 9-29 43Z" fill="#8ca276" />
      <path d="M21 84Q34 51 66 48l20 9-17 12Q43 65 31 96Z" fill="#b5bb89" />
      <path d="m57 54 3-22 12 18 8-22 10 30 15-14 4 28-38 13Z" fill="#4e644b" strokeWidth="2" />
      <path d="M72 84q28-34 65-26l27 28-20 10-15 30-36 8-32-20Z" fill="#627b59" strokeWidth="3" />
      <path d="M87 88q26-19 48-18l15 15-21 9-6 17-30 7-23-13Z" fill="#a9b592" />
      <path d="M65 113q34 6 62-10l24-5-12 32-34 23-41-15Z" fill="#384a3d" strokeWidth="3" />
      <path d="m80 120 15 6 14-5 18-8-6 17-22 13-23-9Z" fill="#bd9f77" />
      <path d="m86 119 8 9 5-11 9 7 8-14 3 12 8-12" fill="none" stroke={bone} strokeWidth="4" />
      <path d="m109 79 17 3-11 8-11-3Z" fill="#e8bc72" strokeWidth="2" />
      <path
        d="m146 80 18 6-19 7m-84 45-10 20m-11-17-9 14m93-26 17 18"
        fill="none"
        strokeWidth="3"
      />
      <path
        d="M38 107q-3 20 3 28M78 70l12 8m20-9 17-3"
        fill="none"
        stroke="#d0c8a4"
        strokeWidth="2"
      />
    </g>
  ),
  redLouse: (
    <g stroke={ink} strokeLinejoin="round" strokeLinecap="round">
      {/* A compact biting louse hunkers behind layered red shell plates. */}
      <path
        d="m48 111-23 23-10-1m43-10-18 34m70-28 11 28m8-42 29 22 9-1"
        fill="none"
        strokeWidth="5"
      />
      <path
        d="M29 119q-8-48 27-65 28-16 54-3 31 13 36 49l-27 35-65 8Z"
        fill="#713f39"
        strokeWidth="3"
      />
      <path
        d="M36 112q-6-34 19-49l28-13q32-2 49 29l7 23-24 26-61 7Z"
        fill="#af6652"
        strokeWidth="3"
      />
      <path
        d="M49 70q19-19 39-19l-7 38-40 11Zm43-19q23-2 38 24l-7 22-37-9Z"
        fill="#d18d6d"
        strokeWidth="2"
      />
      <path d="m39 103 42-12 42 9 17 15-25 24-62 1-20-16Z" fill="#7d4b41" strokeWidth="3" />
      <path d="M40 109q15 7 32 5l-10 13-15 2Zm77 0 17-1-14 22-17-2Z" fill="#d8b37d" />
      <path d="m69 119 17 9 18-9-8 21-21 3Z" fill="#382f32" strokeWidth="2" />
      <path d="m78 124 8 12 9-13" fill="none" stroke={bone} strokeWidth="3" />
      <path d="M56 60 42 38l-8-6m73 22 14-26 7-5" fill="none" strokeWidth="3" />
      <path d="m60 66 11-3m38 0 10 6" fill="none" stroke="#e9c09a" strokeWidth="2" />
    </g>
  ),
  greenLouse: (
    <g stroke={ink} strokeLinejoin="round" strokeLinecap="round">
      {/* The web-spitter raises its abdomen and reaches ahead with long legs. */}
      <path
        d="m45 112-23 20-12-1m35-12-10 31m75-10 15 18m13-39 22 21 12-1"
        fill="none"
        strokeWidth="4"
      />
      <path
        d="M36 91q-9-46 28-59 36-14 65 16 20 24 13 57l-26 34-58-5Z"
        fill="#425d4d"
        strokeWidth="3"
      />
      <path d="M42 88q-3-35 28-48 27-9 52 17l12 35-21 33-51 1Z" fill="#86a479" strokeWidth="3" />
      <path
        d="M57 52q19-18 43-10l-14 34-41 23Zm47-7q22 8 27 34l-24 10-16-13Z"
        fill="#b7c19a"
        strokeWidth="2"
      />
      <path d="M43 98q33-19 71-9l29 20-24 30-67-1-18-19Z" fill="#57795d" strokeWidth="3" />
      <path d="M48 107q16-7 28-5l-11 19-18 4Zm68-12 19 13-17 19-16-9Z" fill="#d5c58e" />
      <path d="m77 115 19 4 9 14-16 11-21-9Z" fill="#31433d" strokeWidth="2" />
      <path d="M79 119q10-5 17 1m-17 11 9 5 9-5" fill="none" stroke={bone} strokeWidth="2.5" />
      <path d="M62 43 45 16l-9-4m72 39 9-26 13-12" fill="none" strokeWidth="3" />
      <path d="M131 107q21-18 32-5m-26 8q22-8 35 5" fill="none" stroke="#c2d6ad" strokeWidth="2" />
    </g>
  ),
  lagavulin: (
    <g stroke={ink} strokeLinejoin="round" strokeLinecap="round">
      {/* A sleeping, armored mass rests low beneath a split stone carapace. */}
      <path d="m25 129-16 22 29-4m102-18 30 23-32-4" fill="none" strokeWidth="6" />
      <path
        d="M18 132q-1-33 19-50l26-10 42-33 28 17 25 45-12 43-111 7Z"
        fill="#4b514c"
        strokeWidth="4"
      />
      <path
        d="M26 125q4-30 24-40l26-5 33-30 25 15 17 37-13 34-95 5Z"
        fill="#898d7c"
        strokeWidth="3"
      />
      <path d="m33 105 34-18 21-29 14-11 5 44-22 31-46 13Z" fill="#b2ae93" strokeWidth="2" />
      <path d="m109 54 25 16 14 32-7 29-47-7-9-30Z" fill="#686e62" strokeWidth="3" />
      <path d="m44 113 45-11 42 6 9 23-29 20-53-1-30-22Z" fill="#343c3b" strokeWidth="3" />
      <path d="m44 117 29-6 25 2-24 13-23 3Zm56-5 27 4-18 13-17-5Z" fill="#c8b89a" />
      <path d="m76 136 15 7 13-7" fill="none" stroke="#9c8067" strokeWidth="3" />
      <path d="m60 81 15-5m43 10 15 7M52 106l18-8" fill="none" stroke="#d4ccb2" strokeWidth="2" />
      <path d="M42 143 30 161m91-15 15 16" fill="none" strokeWidth="5" />
    </g>
  ),
  sentry: (
    <g stroke={ink} strokeLinejoin="round" strokeLinecap="round">
      {/* A three-legged watch tower carries a narrow beam aperture. */}
      <path
        d="m73 113-28 47H28l29-55m57 8 22 47h18l-24-54M81 115l-3 46h25l-4-46"
        fill="#536d6c"
        strokeWidth="3"
      />
      <path
        d="m40 156 30-5-5 11H29Zm55-5 18 2 5 9H91Zm37 1 21 5 4 5h-28Z"
        fill="#b8b092"
        strokeWidth="2"
      />
      <path d="M61 45 91 15l34 29-8 58-28 23-29-24Z" fill="#425d60" strokeWidth="3" />
      <path d="M71 48 91 26l24 22-7 48-19 18-20-18Z" fill="#839c96" strokeWidth="2" />
      <path d="m88 27 25 22-8 42-17 20Z" fill="#607e7d" />
      <path d="M73 60 91 45l21 15-4 27-18 16-18-17Z" fill="#2d4144" strokeWidth="3" />
      <path d="m79 64 12-9 14 10-2 17-13 12-12-12Z" fill="#c6ad70" strokeWidth="2" />
      <path d="M83 66 91 60l8 6-1 13-8 7-8-7Z" fill="#f0d88c" />
      <path
        d="m61 67-31 15-13 27 36 7 15-21Zm59 1 28 16 14 29-40 3-12-21Z"
        fill="#465c5d"
        strokeWidth="3"
      />
      <path
        d="m32 87 23-11 5 16-10 15-23-3Zm112 2-23-13-6 17 11 15 25-2Z"
        fill="#9fa99a"
        strokeWidth="2"
      />
      <path
        d="M26 105 15 116m136-12 15 13M91 16V5m-12 8 12-8 13 10"
        fill="none"
        stroke="#cbb783"
        strokeWidth="3"
      />
    </g>
  ),
  gremlinNob: (
    <g stroke={ink} strokeLinejoin="round" strokeLinecap="round">
      {/* Nob lunges from one planted leg; the club answers that diagonal. */}
      <path d="m47 107-17 46 26 8 22-39m24-8 19 42 28-3-26-55" fill="#49474c" strokeWidth="3" />
      <path d="M37 151 65 154l-7 9H26Zm84 4 29-6 9 13h-32Z" fill="#b19b74" strokeWidth="2" />
      <path d="M37 113 49 74l28-18 34 5 30 35-10 30-38 6-44-7Z" fill="#6d6670" strokeWidth="4" />
      <path d="M51 79 79 67l30 4 22 27-13 25-27 2-34-12Z" fill="#9a8a76" strokeWidth="2" />
      <path d="m64 85 22 8 23-14 11 20-15 22-39-10Z" fill="#c1a080" />
      <path d="M60 24 78 14l31 6 18 24-10 31-30 15-29-17-9-30Z" fill="#514956" strokeWidth="3" />
      <path d="m66 31 17-8 24 5 11 17-9 23-21 12-24-15-7-19Z" fill="#a1917b" strokeWidth="2" />
      <path d="m49 43-18-30 29 9 9 13m38-10 28-19-10 39" fill="#d5c19b" strokeWidth="3" />
      <path d="m64 45 23-8 26 7-7 13-17 9-20-10Z" fill="#39353b" strokeWidth="2" />
      <path d="m73 46 12-2-4 6-8 2Zm25-2 11 3-8 5-7-1Z" fill="#e2b775" />
      <path d="m78 64 14 9 13-11-6 16-12 7-13-8Z" fill="#483c3d" />
      <path
        d="M49 93 21 110l-12 24 28 3 34-30m55-18 25 18 13 28-25 7-27-30"
        fill="#9c907d"
        strokeWidth="3"
      />
      <path d="m135 115 17-10 8-75 10-13 4 22-7 82-18 14Z" fill="#6a5a46" strokeWidth="3" />
      <path d="m151 24 15-13 10 22-10 13-19-6Z" fill="#b9aa8a" strokeWidth="2" />
      <path d="m61 98 20 10m32-11 11 9m-54-39 10 7" fill="none" stroke="#d6c4a2" strokeWidth="2" />
    </g>
  ),
};

export function ActOneEnemyArt({ id }: { id: ActOneEnemy }) {
  return <>{figures[id]}</>;
}
