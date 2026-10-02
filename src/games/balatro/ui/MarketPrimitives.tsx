/** Engraved objects shared by the Night Market cards and shop plates. */
export const marketInk = { ink: '#28493d', paper: '#f6e8c7', coral: '#bd5947', gold: '#c69b57' };
const { ink, paper, coral, gold } = marketInk;

export function Etch({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={ink} strokeWidth=".65" opacity=".65" />;
}
export function CoinStack({ x, y, count = 3 }: { x: number; y: number; count?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: count }, (_, i) => (
        <g key={i} transform={`translate(0 ${-i * 5})`}>
          <path d="M-13-3v5q13 8 26 0v-5" fill={gold} />
          <ellipse rx="13" ry="4" cy="-3" fill={paper} />
          <Etch d="M-8 1v3m4-2v3m13-4v3" />
        </g>
      ))}
    </g>
  );
}
export function MarketStar({ x, y, size = 5 }: { x: number; y: number; size?: number }) {
  return (
    <path
      d={`M${x} ${y - size}q0 ${size} ${size} ${size}q-${size} 0 -${size} ${size}q0 -${size} -${size} -${size}q${size} 0 ${size} -${size}Z`}
      fill={gold}
      stroke="none"
    />
  );
}
export function Ticket({
  x = 43,
  y = 28,
  angle = -12,
}: {
  x?: number;
  y?: number;
  angle?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle} 37 28)`}>
      <path d="M0 0h74v18q-9 9 0 18v20H0V36q9-9 0-18Z" fill={paper} />
      <path d="M10 7h54v42H10Z" fill="none" stroke={gold} />
      <path d="M18 0v56" strokeDasharray="2 3" strokeWidth=".7" />
      <path d="M26 17h29m-29 7h23m-23 17h29" strokeWidth="1" />
      <path d="m42 27 7 5-7 5-7-5Z" fill={coral} stroke="none" />
    </g>
  );
}
export function MarketMoon({ x = 117, y = 28, r = 13 }: { x?: number; y?: number; r?: number }) {
  return (
    <path
      d={`M${x} ${y - r}a${r} ${r} 0 1 0 0 ${r * 2}q-${r * 1.25}-${r} 0-${r * 2}Z`}
      fill={gold}
      stroke="none"
    />
  );
}
