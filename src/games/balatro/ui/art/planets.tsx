import { ink, paper, coral, gold } from './primitives';

/** Broad cut-paper planes carry the form; a few curved cuts carry the engraving. */
function GlobeShade() {
  return (
    <>
      <path
        d="M6-31.4C28-14 25 16 4 31.7A32 32 0 0 0 6-31.4Z"
        fill={ink}
        opacity=".55"
        stroke="none"
      />
      <path d="M-25-12Q-20-25-8-28" fill="none" stroke={paper} strokeWidth="1.6" />
      <path
        d="M24-14 28-10M25-5 30-1M25 5 29 9M22 15 26 18M17 23 20 25"
        fill="none"
        stroke={paper}
        strokeWidth=".65"
        opacity=".5"
      />
      <circle r="32" fill="none" stroke={ink} strokeWidth="1.4" />
    </>
  );
}

function Jupiter() {
  return (
    <g transform="translate(80 56)">
      <circle r="32" fill={gold} />
      <path d="M-24-21Q-7-16 9-20L22-23Q6-32-10-30Z" fill={paper} stroke="none" />
      <path d="M-30-11Q-13-4 3-9T31-7L32 0Q16-5 2 1T-32-2Z" fill={coral} stroke="none" />
      <path d="M-31 7Q-13 16 3 9T30 12L27 18Q12 15-2 21T-28 16Z" fill={paper} stroke="none" />
      <path d="M-21 24Q-8 29 12 24L22 23Q9 34-6 31Z" fill={coral} stroke="none" />
      <path
        d="M-26-17Q-8-11 9-16M-32 3Q-14 10 1 4M-25 21Q-9 27 4 22"
        fill="none"
        strokeWidth=".8"
      />
      <path d="M-7 13C-3 6 9 4 16 9C22 16 7 22-1 19Z" fill={coral} />
      <path d="M-2 14Q5 8 13 12Q14 17 5 17" fill="none" stroke={paper} strokeWidth="1.1" />
      <GlobeShade />
    </g>
  );
}

function Saturn() {
  return (
    <g transform="translate(80 56) rotate(-24)">
      <path
        d="M-47 5C-68-16-30-22 5-21C42-20 66-8 47 5L29 1C48-10 21-14-5-14C-36-14-47-6-29 1Z"
        fill={gold}
      />
      <path d="M-48 0C-53-13-15-18 16-15Q51-11 48 0" fill="none" stroke={paper} strokeWidth="1.6" />
      <g transform="scale(.76) rotate(24)">
        <circle r="32" fill={gold} />
        <path
          d="M-27-17Q-4-10 27-17L31-8Q4-2-31-8ZM-31 7Q-5 17 31 8L27 18Q-4 25-28 16Z"
          fill={paper}
          stroke="none"
        />
        <path d="M-31-2Q-6 5 31-1M-23 23Q-4 29 20 25" fill="none" stroke={coral} strokeWidth="2" />
        <GlobeShade />
      </g>
      <path d="M-47-5C-39 12 35 16 47-5L53-3C64 22-49 28-53-3Z" fill={coral} />
      <path d="M-48 1C-34 17 35 18 49 0" fill="none" stroke={paper} strokeWidth="2.4" />
      <path d="M-43 9Q-4 23 40 11" fill="none" strokeWidth=".75" />
    </g>
  );
}

export function GiantPlanet({ id }: { id: string }) {
  return (
    <g strokeWidth="1.1">
      <path d="M28 29v7m-3-3h6M127 78v6m-3-3h6" stroke={gold} />
      {id === 'planet-straight' ? <Jupiter /> : <Saturn />}
    </g>
  );
}
