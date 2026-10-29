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
      <path d="M-8 13C-8 4 15 2 18 10C23 19-3 24-8 13Z" fill={coral} />
      <path d="M-2 14Q5 8 13 12Q14 17 5 17" fill="none" stroke={paper} strokeWidth="1.1" />
      <GlobeShade />
    </g>
  );
}

function Saturn() {
  return (
    <g transform="translate(80 56) rotate(-24)">
      <path d="M-55 0C-55-20 55-20 55 0H47C47-11-47-11-47 0Z" fill={gold} />
      <path d="M-51 0C-51-16 51-16 51 0" fill="none" stroke={paper} strokeWidth="1.6" />
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
      <path d="M-55 0C-55 20 55 20 55 0H47C47 11-47 11-47 0Z" fill={coral} />
      <path d="M-51 0C-51 16 51 16 51 0" fill="none" stroke={paper} strokeWidth="2.4" />
      <path d="M-43 10Q0 23 43 10" fill="none" strokeWidth=".75" />
    </g>
  );
}

function Mercury() {
  return (
    <g transform="translate(80 56) scale(.8)">
      <circle r="32" fill={gold} />
      <path
        d="M-24 18Q-16 9-9 18T8 24L15 28Q-8 38-24 18Z"
        fill={coral}
        opacity=".45"
        stroke="none"
      />
      <g fill={ink} stroke={paper} strokeWidth="1.1">
        <ellipse cx="-9" cy="-9" rx="10" ry="8" />
        <ellipse cx="8" cy="14" rx="7" ry="5" />
        <ellipse cx="14" cy="-20" rx="4" ry="3" />
      </g>
      <path
        d="M-17-8Q-12-15-3-10M3 15Q6 10 12 14M-22 5l4-2m-2 22 4 1"
        fill="none"
        stroke={gold}
        strokeWidth="1.5"
      />
      <GlobeShade />
    </g>
  );
}

function Venus() {
  return (
    <g transform="translate(80 56) scale(.9)">
      <circle r="32" fill={coral} />
      <path d="M-27-17Q-14-9 2-22L14-29Q1-35-12-29Q-17-21-27-17Z" fill={gold} stroke="none" />
      <path
        d="M-32-2C-11 6-9-15 12-12Q22-12 30-10L32-1C9-10 5 5-10 9Q-20 14-30 10Z"
        fill={paper}
        stroke="none"
      />
      <path
        d="M-25 20C-4 23 2 4 20 8L29 14Q18 13 11 22L1 32Q-16 33-25 20Z"
        fill={gold}
        stroke="none"
      />
      <path
        d="M-28-13Q-17-9-6-20M-29 3C-10 10-4-9 13-7M-17 24Q-4 24 6 15"
        fill="none"
        strokeWidth=".85"
      />
      <GlobeShade />
    </g>
  );
}

function Earth() {
  return (
    <g transform="translate(80 56) scale(.94)">
      <circle r="32" fill="#5d9389" />
      <path d="M-24-20-12-27-1-24 3-16-3-8-11-9-4 1-8 8-18 3-22-6-29-10Z" fill={gold} />
      <path d="M-8 9 2 7 10 14 6 23-2 30-6 22Z" fill={gold} />
      <path d="M13-22 25-19 31-7 21-3 18 6 10 2 7-10Z" fill={gold} />
      <path
        d="M-12-29Q0-35 13-29L5-24-3-25ZM-12 29Q1 34 14 29L7 25-4 27Z"
        fill={paper}
        stroke="none"
      />
      <path
        d="M-29-3Q-18-6-12-1M-2-18Q8-22 18-17M-1 16Q12 12 22 16"
        fill="none"
        stroke={paper}
        strokeWidth="1.4"
      />
      <GlobeShade />
    </g>
  );
}

function Mars() {
  return (
    <g transform="translate(80 56) scale(.85)">
      <circle r="32" fill={coral} />
      <path
        d="M-27 9-19-4-9-2-2-9 13-6 15 4 5 8-2 19-13 18-16 11Z"
        fill={ink}
        opacity=".65"
        stroke="none"
      />
      <path d="M-15-28Q-1-35 15-28L9-23-1-25-7-22Z" fill={paper} stroke="none" />
      <path d="M-26 3-15 6-9 3 1 7 14 1M-8 4-3-1 6-2" fill="none" stroke={gold} strokeWidth="2" />
      <ellipse cx="-13" cy="-14" rx="5" ry="3.5" fill={gold} />
      <path d="M-17-14Q-13-18-9-14M-17 24l9-2 7 3" fill="none" stroke={paper} strokeWidth=".8" />
      <GlobeShade />
    </g>
  );
}

function Uranus() {
  return (
    <g transform="translate(80 56)">
      <g transform="rotate(72)">
        <path d="M-43 0C-43-12 43-12 43 0" fill="none" stroke={ink} strokeWidth="3" />
        <path d="M-43 0C-43-12 43-12 43 0" fill="none" stroke={gold} strokeWidth="1.4" />
      </g>
      <g transform="scale(.84)">
        <circle r="32" fill="#7eada4" />
        <path
          d="M-29-14Q-15-25 9-22L19-26Q-8-38-29-14ZM-31 6Q-11 12 24-3L31-8Q15-2 0 1T-31 0Z"
          fill={paper}
          opacity=".55"
          stroke="none"
        />
        <path
          d="M-25 20Q-3 27 19 16M-29-5Q-12-1 3-7"
          fill="none"
          stroke={ink}
          strokeWidth=".8"
          opacity=".6"
        />
        <GlobeShade />
      </g>
      <g transform="rotate(72)">
        <path d="M-43 0C-43 12 43 12 43 0" fill="none" stroke={ink} strokeWidth="3.5" />
        <path d="M-43 0C-43 12 43 12 43 0" fill="none" stroke={paper} strokeWidth="1.5" />
      </g>
    </g>
  );
}

function Neptune() {
  return (
    <g transform="translate(80 56) scale(.91)">
      <circle r="32" fill="#437b87" />
      <path
        d="M-28-15Q-6-4 19-17L28-15Q8 1-31-6ZM-29 14Q-9 23 25 9L29 13Q7 32-22 23Z"
        fill="#7eada4"
        stroke="none"
      />
      <path
        d="M-27-18Q-12-11 1-15M1 7Q13 2 24 4M-19 24Q-6 28 7 24"
        fill="none"
        stroke={paper}
        strokeWidth="1.4"
      />
      <path d="M-19 9C-16 0-1 0 2 7C3 14-13 17-19 9Z" fill={ink} />
      <path d="M-14 7Q-7 2-2 6" fill="none" stroke={paper} strokeWidth="1" />
      <GlobeShade />
    </g>
  );
}

function Pluto() {
  return (
    <>
      <g transform="translate(77 59) scale(.74)">
        <circle r="32" fill="#947485" />
        <path d="M-26-18-13-27 3-24 10-15 3-10-11-12-18-2-29-7Z" fill={coral} stroke="none" />
        <path d="M-16 7C-24-12-6-13-2-5C8-16 24-4 17 7L1 24Z" fill={paper} />
        <path d="M-13 6Q-9-2-4 2M-19 23l7 3M9-22l9 5" fill="none" stroke={gold} strokeWidth="1.2" />
        <GlobeShade />
      </g>
      <g transform="translate(111 30) scale(.27)">
        <circle r="32" fill={gold} />
        <path d="M-17-8Q-6-19 3-12L8-3-1 5-11 1Z" fill={paper} stroke="none" />
        <GlobeShade />
      </g>
    </>
  );
}

const worlds = {
  'planet-high': Mercury,
  'planet-pair': Venus,
  'planet-twoPair': Earth,
  'planet-three': Mars,
  'planet-straight': Jupiter,
  'planet-flush': Saturn,
  'planet-fullHouse': Uranus,
  'planet-four': Neptune,
  'planet-straightFlush': Pluto,
};

export function Planet({ id }: { id: string }) {
  const World = worlds[id as keyof typeof worlds];
  return (
    <g strokeWidth="1.1">
      <path d="M28 29v7m-3-3h6M127 78v6m-3-3h6" stroke={gold} />
      {World && <World />}
    </g>
  );
}
