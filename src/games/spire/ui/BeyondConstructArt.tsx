const ink = '#303c39';

/** Cast shells, worn edges and a single light source tie the Beyond constructs together. */
export function BeyondConstructArt({ id }: { id: string }) {
  if (id === 'spiker')
    return (
      <g stroke={ink} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
        {/* Unequal forged spines follow a low, braced shell rather than a sunburst. */}
        <path d="m48 126-16 26-15 7 2 6 34-3 13-27m43-3 14 28 29 3 3-6-17-9-13-25" fill="#4d5952" />
        <path d="m43 148-5 10 15-3m72-9 8 10 11 2" fill="none" stroke="#b2ad8f" strokeWidth="3" />
        <path d="m58 65 1-45 32 37m22 12 32-38-9 56m-8 20 37 14-35 14" fill="#8f9a87" />
        <path
          d="m60 24 16 37-12-5m79-21-16 45m33 41-30 3"
          fill="none"
          stroke="#dad1af"
          strokeWidth="2"
        />
        <path d="M30 115q-4-37 30-55 33-20 64 0 24 17 25 51l-20 29-58 12-39-19Z" fill="#66584e" />
        <path d="M38 101q1-27 28-37 30-17 53 0l19 26-30 18-45 13Z" fill="#a5a68c" strokeWidth="2" />
        <path
          d="m71 61 20-15 29 17 13 17-35 11-27 32-26-10 26-20Z"
          fill="#7f8976"
          strokeWidth="2"
        />
        <path d="m78 64 13-13 20 11-28 15Z" fill="#cbc8a3" stroke="none" />
        <path d="m105 95 31-9 8 24-22 28-34 8-22-19Z" fill="#4a5f51" strokeWidth="2" />
        <path d="m113 105 27 5-19 22-23 3Z" fill="#83917a" strokeWidth="1.5" />
        <path d="M33 102 16 71l37 20 23 17-18 22-33-4-15-17Z" fill="#a7a98d" />
        <path d="m17 75 27 25-11 4m-19 6 29 9 15-2" fill="none" stroke="#ded4b0" strokeWidth="2" />
        <path d="m49 102 35-10 17 9-18 18-29 3-15-7Z" fill="#283d36" strokeWidth="2" />
        <path d="m54 106 29-8 8 4-16 7-19 3Z" fill="#d5b876" strokeWidth="1.5" />
        <path d="m83 125 14-9 12 14-4 28-16-15-17-2Z" fill="#8f9b82" />
        <path d="m96 121 4 28-9-15" fill="none" stroke="#d3cba7" strokeWidth="2" />
        <path d="m66 78 9-4m38 4 6 5m-60 50 8 5" fill="none" stroke="#d3c4a1" strokeWidth="2" />
      </g>
    );
  if (id === 'repulsor')
    return (
      <g stroke={ink} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
        {/* A suspended hollow bell throws its force out of an open, left-facing mouth. */}
        <path d="M98 91q28 7 45 37l-12 21-5-27-31-13m-15 1 22 24-9 25-5-22-25-22" fill="#536f74" />
        <path
          d="m108 110 23 20 1 9m-49-17 9 13-2 12"
          fill="none"
          stroke="#a0b3a9"
          strokeWidth="2"
        />
        <path d="M80 37q35-9 55 11l14 26-11 25q-26 29-61 18L55 83Z" fill="#51727a" />
        <path d="M81 39q28-9 48 11l11 18-30 7-39-10Z" fill="#b5c3b5" strokeWidth="2" />
        <path d="m121 54 22 15-4 26-22 14-16-17Z" fill="#7e9e99" strokeWidth="2" />
        <path d="m140 66 15-1 6 12-12 15-12-3Z" fill="#9c926f" strokeWidth="2" />
        <path d="m146 73 8 3-7 9" fill="none" stroke="#dbd1ad" strokeWidth="2" />
        <path d="M75 29q31-5 39 28 9 34-16 60-22 22-46 5-21-19-14-49 8-32 37-44Z" fill="#a5b9ad" />
        <path d="M77 40q23-3 29 24 6 28-15 49-18 17-34 2-15-15-9-39 7-25 29-36Z" fill="#344d54" />
        <path
          d="M83 48q15 2 18 23 3 23-15 40-10 8-18 5 22-30 15-68Z"
          fill="#182f38"
          strokeWidth="1.8"
        />
        <path d="M78 49q-18 9-23 29-5 18 5 29l8-2q-11-31 17-43Z" fill="#748f8d" strokeWidth="1.5" />
        <path d="m74 58 8 6-10 12-9-2Z" fill="#b9ab83" strokeWidth="1.5" />
        <path d="m62 92 10 5 13-8-4 15-12 7-8-8Z" fill="#718e89" strokeWidth="1.5" />
        <path d="m66 95 7 3 7-4" fill="none" stroke="#c5b58b" strokeWidth="2" />
        <path
          d="M53 49q-15 20-15 42m12 22 8 9m39-83 6 7"
          fill="none"
          stroke="#dfdbc0"
          strokeWidth="2.5"
        />
        {/* Broad broken arcs remain quieter than the physical mouth and the HTML intent. */}
        <path
          d="M31 63q-12 20-6 40M18 71q-8 14-4 27"
          fill="none"
          stroke="#6d8e91"
          strokeWidth="3"
        />
      </g>
    );
  if (id === 'exploder')
    return (
      <g stroke={ink} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
        {/* A squat pressure vessel braces under a hot, split seam and open exhaust. */}
        <path d="m47 121-12 30-14 8 3 6 33-4 13-27m42-3 9 23 26 8 8-7-20-13-7-23" fill="#5b5148" />
        <path d="m44 149-7 9 17-4m73-6 12 8" fill="none" stroke="#ad9b77" strokeWidth="3" />
        <path
          d="M69 42q-20-10-11-25l9 7q-5-14 10-21-2 14 10 20 4-8 11-10-3 13 3 20l-13 17Z"
          fill="#9c5540"
          strokeWidth="2"
        />
        <path d="M72 36q-9-7-2-15 0 9 9 7l4-10 4 17-8 9Z" fill="#e0b36c" stroke="none" />
        <path d="m61 39 9-11 26 1 9 13-7 19-37 2Z" fill="#6a6251" />
        <path d="m64 42 9-7 19 1 9 8-13 8-21-2Z" fill="#b6b494" strokeWidth="2" />
        <path d="m74 38 18 2-4 5-14-1Z" fill="#353c35" strokeWidth="1.5" />
        <path
          d="M48 60q24-20 54-9 31 12 35 45 5 29-22 47-28 16-57-1-27-17-27-42 0-25 17-40Z"
          fill="#a36f4e"
        />
        <path
          d="M48 68q17-17 36-12L75 78l13 11-12 17-30 7-10-14q-1-19 12-31Z"
          fill="#d1aa75"
          strokeWidth="2"
        />
        <path
          d="m90 53 24 9 14 21-27 9 1 17 23 7-11 23-25 10-14-9 18-22-12-16 14-14-16-14Z"
          fill="#744b3b"
          strokeWidth="2"
        />
        <path
          d="m88 55-6 18 17 14-13 16 13 16-16 25"
          fill="none"
          stroke="#ebbd71"
          strokeWidth="5"
        />
        <path
          d="m88 55-6 18 17 14-13 16 13 16-16 25"
          fill="none"
          stroke="#f9e3a2"
          strokeWidth="1.5"
        />
        <path
          d="M35 92q15 13 42 12m28-6 30-11m-90 35q15 18 35 18m23-2 18-10"
          fill="none"
          stroke="#4b4f43"
          strokeWidth="7"
        />
        <path
          d="M38 91q17 12 35 11m35-6 23-7M48 123q12 14 28 16m30-3 12-8"
          fill="none"
          stroke="#acaa8b"
          strokeWidth="3"
        />
        <path d="m37 65-13 3-3 18 11 6m100-29 12 7 6 17-13 8" fill="#839180" strokeWidth="2.5" />
        <path
          d="m27 73-2 10m115-6 4 9M49 77l5-7m-5 45 6 5"
          fill="none"
          stroke="#e0c8a0"
          strokeWidth="2"
        />
      </g>
    );
  if (id !== 'orbWalker') return null;
  return (
    <g stroke={ink} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
      {/* The far leg reaches back; two bent forelegs carry the pitched lens. */}
      <path d="m116 89 38 23-3 33 19 12-2 7-27-6v-39l-32-16Z" fill="#49635d" />
      <path d="m147 121-1 25 12 10" fill="none" stroke="#94a793" strokeWidth="2" />
      <path d="m65 101-28 24-12 29-13 7 1 5 32-1 9-8-13-5 11-18 31-19Z" fill="#617f77" />
      <path d="m63 108-20 21-11 26 12 4-5-8 12-23 21-15Z" fill="#b5c0aa" strokeWidth="1.5" />
      <path d="m99 103 15 30-10 21-16 8 2 5 31-1 10-9-11-5 8-25-13-29Z" fill="#6e8c81" />
      <path d="m105 112 13 20-8 23 11 4-5-8 8-23-12-19Z" fill="#bdc6ac" strokeWidth="1.5" />
      <path d="M41 73Q37 40 65 24q34-18 61 4 26 20 17 52-6 28-39 37L68 106Z" fill="#63867d" />
      <path d="M51 51q13-30 40-30 26-1 39 19l-22 13-32 25-29-6Z" fill="#b9c5ad" strokeWidth="2" />
      <path d="M101 24q37 10 38 41l-17 15-14-27Z" fill="#8fa99a" strokeWidth="2" />
      <path d="m111 60 29 3q-1 29-25 40l-26 13-11-21Z" fill="#3d6059" strokeWidth="2" />
      <path d="M105 86 130 77l-11 19-20 10Z" fill="#8b9e8c" strokeWidth="1.8" />
      {/* The off-centre aperture faces forward rather than reading as a badge. */}
      <path d="M80 39q28-6 37 17 10 28-12 48-25 19-49 3-21-15-12-39 8-22 36-29Z" fill="#b29462" />
      <path d="M79 47q25-6 30 18 6 22-12 36-19 13-37-1-15-13-8-32 7-16 27-21Z" fill="#2c4647" />
      <path
        d="M75 55q20-8 27 11 7 20-10 29-21 10-30-8-8-18 13-32Z"
        fill="#536f70"
        strokeWidth="1.5"
      />
      <path d="M72 58q14-8 25 5l-14 10-19 8q-4-15 8-23Z" fill="#8ba9a0" stroke="none" />
      <path d="M70 71q10-10 18-5 6 4 1 14-6 12-17 8-9-4-2-17Z" fill="#e2bd71" strokeWidth="2" />
      <path d="M72 73q5-7 9-6l-7 16-5-3Z" fill="#fff0ba" stroke="none" />
      <path
        d="M49 78q-3 19 15 28m20-63 11 1m26-3 7 7m-6 41 5-6"
        fill="none"
        stroke="#ddd0a5"
        strokeWidth="2"
      />
      <path d="m50 40-5-12 9-9 13 3m60 14 14-6 7 12-7 9" fill="#718c7e" strokeWidth="2" />
      <path d="m47 31 8-6m80 12 5 8" fill="none" stroke="#c3c4a7" strokeWidth="2" />
      <path d="m57 116 6-4m61 2 6 5" fill="none" stroke="#be9f66" strokeWidth="3" />
    </g>
  );
}
