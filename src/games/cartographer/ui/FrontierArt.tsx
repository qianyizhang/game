/** A direction cue that stays distinct from the occupant and the next-attack mark. */
export function FrontierArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false" className={className}>
      <circle cx="32" cy="32" r="29" fill="#e7c578" stroke="#142b32" strokeWidth="5" />
      <path d="M32 13 12 34h13v17h14V34h13L32 13Z" fill="#142b32" />
    </svg>
  );
}
