/** Shared, deterministic engraving primitives for Silent scenes and upgrades. */
export const silentInk = {
  ink: '#ddd3b5',
  dark: '#172928',
  green: '#93ae81',
  leaf: '#4d705f',
  steel: '#a4b8b0',
  gold: '#b69d68',
  plum: '#746780',
} as const;
const { ink, dark, green, leaf, steel, gold, plum } = silentInk;

export function Cut({
  d,
  color = ink,
  width = 0.75,
  opacity = 0.65,
}: {
  d: string;
  color?: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export function Dagger({
  x = 62,
  y = 9,
  angle = 24,
  size = 90,
  poisoned = false,
}: {
  x?: number;
  y?: number;
  angle?: number;
  size?: number;
  poisoned?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle} 18 50) scale(${size / 100})`}>
      <path d="M23 0Q9 16 6 39L12 65 23 68Q20 36 23 0Z" fill={dark} stroke={dark} strokeWidth="3" />
      <path d="M23 0Q9 16 6 39L12 65l6-1Q12 42 23 0Z" fill={ink} />
      <path d="M23 0Q12 42 18 64l5 4Q20 36 23 0Z" fill={steel} />
      <path d="m8 65 19 4 5-4-1 10-11 1-16-6Z" fill={gold} stroke={dark} strokeWidth="1" />
      <path d="m12 72 11 3-3 23-9-2Z" fill={leaf} stroke={dark} strokeWidth="1.5" />
      <path d="m11 95 10 3-2 6-10-3Z" fill={gold} />
      <Cut d="m13 78 8 4m-9 1 9 4m-9 1 8 4M13 40l4 18" width={0.65} />
      {poisoned && (
        <>
          <path d="M20 13Q9 39 16 59l-5-4Q3 35 20 13Z" fill={green} />
          <path d="M8 45q-7 10-1 13 7-3 1-13Z" fill={green} />
        </>
      )}
    </g>
  );
}

export function Flask({
  x = 53,
  y = 24,
  size = 66,
  angle = 0,
  round = false,
}: {
  x?: number;
  y?: number;
  size?: number;
  angle?: number;
  round?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle} 27 36) scale(${size / 72})`}>
      <path
        d={
          round
            ? 'M18 12h18v15q22 9 16 31-5 17-27 15Q3 74 1 52q0-17 17-25Z'
            : 'M18 12h18v19l19 29q6 14-9 14H8q-13 0-6-14l16-29Z'
        }
        fill={dark}
        stroke={steel}
        strokeWidth="1.3"
      />
      <path
        d={
          round
            ? 'M7 48q18 7 39-2 8 23-18 22Q4 69 7 48Z'
            : 'M12 47q18 6 30 0l11 17q2 6-10 6H11q-10 0-5-7Z'
        }
        fill={leaf}
      />
      <path d="M12 53q17 5 30-1l4 10q-22 12-38 0Z" fill={green} />
      <path d="M16 8h22v7H16Z" fill={gold} />
      <path d="M19 1h16v7H19Z" fill={leaf} />
      <Cut d="M22 19v15L10 54m-2 7v3m30-42v10l9 14M19 10h12" />
      <circle cx="25" cy="54" r="2" fill={ink} />
      <circle cx="34" cy="61" r="1.5" fill={ink} />
    </g>
  );
}

export function Smoke({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M18 76q-15-21 8-31-13-30 18-31 14-22 39-6 30-3 27 24 29-4 34 15 9 28-25 35-21 21-43 3-34 16-58-9Z"
        fill={leaf}
        opacity=".7"
      />
      <path
        d="M22 64q-8-13 12-13-17-26 10-29 21-16 36 3 17-13 25 5-22-9-33 12-16-22-33-5 9 16-17 27Zm45 11q18-17 41-9 11-18 24-12-7 3-10 17-25-3-39 12Z"
        fill={green}
        opacity=".45"
      />
      <Cut d="M24 67q-7-13 6-18m7-19q7-10 22-7m58 17q18 1 19 15M78 80l16-9" color={green} />
    </g>
  );
}

export function Cowl({
  x = 38,
  y = 6,
  size = 100,
  ghost = false,
}: {
  x?: number;
  y?: number;
  size?: number;
  ghost?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`} opacity={ghost ? 0.3 : 1}>
      <path d="M4 101Q15 66 26 50 9 29 27 12L47 0q25 12 28 36l-5 21 18 44Z" fill={dark} />
      <path d="M13 100q9-30 26-45 13-6 26 4l-8 22 22 19Z" fill={leaf} />
      <path d="M26 43Q11 27 45 6q-3 19 18 31L55 54Z" fill={green} />
      <path d="M44 17q5 12 19 20l-7 14-14 5-11-14Z" fill={dark} />
      <path d="M39 30q12-1 18 9l2 9-5 7-5 11-8-2-2-10q-9-2-6-12Z" fill={ink} />
      <path d="M35 41q5-5 12 2l-4 7q-10 0-8-9Zm17 4 5-2v8l-5 3Z" fill={dark} />
      <path d="m47 51 4 6-5 1Z" fill={dark} />
      <path d="M41 57l1 7m4-4v5m4-6-1 6" stroke={dark} strokeWidth=".9" />
      <path d="M28 19Q15 10 19 0q-1 13 16 17m22 5Q75 20 69 3q1 12-11 12Z" fill={ink} />
      <Cut d="M37 34q9-3 17 4m-16 14 4 2m11 1-2 4" color={gold} width={0.5} />
      <Cut d="M27 27q5-10 11-12m-8 34 6 7M23 91l15-25-4 26m8-13 4-15m13 20 11 11" />
      <path d="M48 67 44 91l5 10 7-24Z" fill={plum} />
    </g>
  );
}

export function Boot({
  x = 40,
  y = 15,
  angle = -20,
  size = 85,
}: {
  x?: number;
  y?: number;
  angle?: number;
  size?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle} 30 45) scale(${size / 90})`}>
      <path d="M15 0h33l-8 38-6 17 27 17q12 5 8 12L41 88 4 72l6-25Z" fill={dark} />
      <path d="m19 2 23 1-7 39-10 14 9 11 27 10-2 5-17 1-32-14 7-29Z" fill={leaf} />
      <path d="M17 40 35 43l-9 14 8 10-16-2-8 4Z" fill={green} />
      <path d="m12 7 33 4-2 9-31-5Z" fill={gold} />
      <Cut d="M15 70 44 83l18-3M19 32l17 5m-18-14 21 5m-20-9 20 4m-14 38 11 5m-7-1 10 5" />
    </g>
  );
}

export function Cards({
  x = 42,
  y = 37,
  angle = 0,
  count = 3,
}: {
  x?: number;
  y?: number;
  angle?: number;
  count?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle} 30 25)`}>
      {Array.from({ length: count }, (_, i) => (
        <g key={i} transform={`translate(${i * 14} ${-i * 4}) rotate(${i * 9 - 12} 12 30)`}>
          <rect width="29" height="44" rx="2" fill={dark} stroke={steel} strokeWidth="1" />
          <path d="M4 5h21v34H4Z" fill={leaf} />
          <path d="m14 10 7 12-7 11-7-11Z" fill="none" stroke={ink} strokeWidth=".75" />
          <path d="M14 17v11m-3-6h6" stroke={gold} strokeWidth=".8" />
        </g>
      ))}
    </g>
  );
}

export function Trails({ d }: { d: string }) {
  return <Cut d={d} color={green} width={1.2} opacity={0.75} />;
}
export function Drop({ x, y, size = 12 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 20})`}>
      <path d="M10 0Q8 7 2 16q-6 15 8 17 14-2 8-17Z" fill={green} />
      <Cut d="M5 17q-4 7 1 10" width={1} />
    </g>
  );
}
