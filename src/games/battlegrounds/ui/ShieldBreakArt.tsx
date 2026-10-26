/** A separated shield contour: HTML names the lost protection, never an amount of damage. */
export function ShieldBreakArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false" className={className}>
      <g stroke="#59442a" strokeWidth="3" strokeLinejoin="round">
        <path d="M10 12 29 6 25 23 31 28 22 35 26 51C15 43 10 31 10 12Z" fill="#bd914b" />
        <path d="M39 10 55 16C55 36 49 49 35 58L32 41 40 32 34 26Z" fill="#e2c17c" />
      </g>
      <path
        d="M15 17 22 14M48 21C48 32 45 40 40 45"
        stroke="#f9e5ad"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m5 38-3 5 6-1M53 5l5-3 1 6" fill="#b87e42" />
    </svg>
  );
}
