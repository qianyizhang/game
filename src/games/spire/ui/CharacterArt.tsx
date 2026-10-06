import type { ReactNode } from 'react';

const ink = '#25312e';
const bone = '#e6d8b8';
const copper = '#aa674f';

function Engraving({ d, color = ink }: { d: string; color?: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" />;
}

const figures: Record<'ironclad' | 'silent', ReactNode> = {
  ironclad: (
    <>
      {/* A heavy cloak and the sword establish opposing diagonals. */}
      <path
        d="M71 74C51 78 34 91 29 118L15 163Q39 156 62 166L145 166Q151 142 141 116C134 92 119 80 104 77Z"
        fill="#763e39"
      />
      <path
        d="M50 98Q39 129 30 155L56 149 65 108M117 89Q146 116 133 164L118 155 108 99"
        fill="#a25a49"
      />
      <path d="M70 84Q53 87 51 101L57 126 70 135 104 128Q119 110 116 96L103 81Z" fill="#bf8b6c" />
      <path d="M72 86Q87 100 106 90L113 96 98 110 103 127 76 132 69 116Z" fill="#8c5d4b" />
      <path
        d="M52 95Q42 101 41 116L35 130Q35 139 45 142L68 144 72 133 54 127 62 110Z"
        fill="#c59878"
        stroke={ink}
        strokeWidth="2"
      />
      <path
        d="M106 101Q119 99 128 115L140 133 132 144Q119 139 115 126L103 119Z"
        fill="#b17a5f"
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M59 125 108 123 119 157 66 166 54 154Z" fill="#3a3b35" />
      <path d="m59 133 47-6 3 10-48 8Z" fill="#766b4f" />
      <path d="m81 131 12-2 2 12-12 2Z" fill="#c5a364" stroke={ink} strokeWidth="2" />
      {/* Curved iron shell, ivory face plates, and a recessed eye slit. */}
      <path
        d="M68 36Q78 23 97 27 114 29 120 46L115 71 99 86 78 79 63 56Z"
        fill="#363b37"
        stroke={ink}
        strokeWidth="2"
      />
      <path
        d="M66 41Q52 34 54 19L67 30 79 36M101 30Q119 17 125 10 124 31 112 41"
        fill="#9f9e87"
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M73 39Q87 33 100 39L108 53 97 64 96 80 80 75 70 59Z" fill={bone} />
      <path d="m100 39 12 6 3 16-13 17-6 2 1-16 11-11Z" fill="#a6aa90" />
      <path d="m72 48 16 3-4 7-10-3m22-5 12-3-6 10-7 1" fill={ink} />
      <path d="m86 40 4 13-2 13 8 1-2 11" fill="none" stroke={copper} strokeWidth="2.5" />
      <path d="M70 65Q66 81 56 88L72 89 82 79" fill="#33352f" />
      {/* The edge is cool; the fuller stays dark enough to read at combat size. */}
      <path d="m62 135 83-92 18-9-5 20-88 89Z" fill="#b9c4b9" stroke={ink} strokeWidth="2" />
      <path d="m69 138 88-96-8 16-76 85Z" fill="#708f89" />
      <path d="m54 127 22 20m-16-10-15 16" stroke="#bc935a" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M43 132Q48 128 53 133L61 140 56 147 46 143Z"
        fill="#bd8c6c"
        stroke={ink}
        strokeWidth="1.5"
      />
      <Engraving d="m52 135 5 5m-9-2 5 5M62 101q8-5 16-1m16 4 9-4M41 113l8 3M116 118l7-4M77 149l-4 11m26-15 4 9" />
      <Engraving d="M41 104q-2 21-10 37M130 121q6 18 0 31m-88 0 9-17M74 44l9-3" color="#c18363" />
    </>
  ),
  silent: (
    <>
      {/* The cowl bends around the skull; folds follow the shoulder and wrist. */}
      <path
        d="M87 20Q58 30 49 60L51 89Q28 112 26 147L18 165 63 157Q110 175 158 156L143 130 132 86Q130 43 105 25Z"
        fill="#405b49"
        stroke={ink}
        strokeWidth="2"
      />
      <path
        d="M86 26Q59 41 61 72L76 94 53 119Q47 140 37 151L68 145 96 162 133 154Q126 136 131 111L113 91 120 68Q118 41 99 31Z"
        fill="#6f8660"
      />
      <path d="M75 42Q94 29 112 46L123 68 108 99 73 95 57 73Z" fill="#24372f" />
      <path
        d="M73 54Q60 41 62 18L72 36 83 47M106 43Q120 31 124 14 131 38 116 56"
        fill={bone}
        stroke={ink}
        strokeWidth="1.8"
      />
      <path
        d="M74 48Q91 39 109 48L116 64 104 80 99 95 85 91 79 80 67 68Z"
        fill={bone}
        stroke={ink}
        strokeWidth="1.6"
      />
      <path d="M103 49 111 55 116 64 104 80 99 95 92 88 98 73Z" fill="#a6ae8c" />
      <path d="M74 60q8-4 14 6l-5 6-9-5Zm26-1 11-3-5 13-8 1Z" fill={ink} />
      <path
        d="m91 71-4 9 8 1Zm-7 13 4 8m5-7 1 8m5-9-1 9"
        fill={ink}
        stroke={ink}
        strokeWidth="1.2"
      />
      <path d="M63 90Q76 106 107 96L119 106 96 120 65 109Z" fill="#809570" />
      <path
        d="M64 112Q67 143 52 154L78 152 91 162 90 126M108 116 122 143 146 153 127 117"
        fill="#314a3e"
      />
      <path
        d="M55 109Q39 114 37 128L61 141 73 132 61 121Z"
        fill="#8d9b76"
        stroke={ink}
        strokeWidth="2"
      />
      <path
        d="M113 108Q131 110 138 129L126 140 111 123Z"
        fill="#788965"
        stroke={ink}
        strokeWidth="2"
      />
      <path d="m64 134 13-9 11 8-8 9-14 2Z" fill="#c2b792" stroke={ink} strokeWidth="1.5" />
      <path d="M125 129q10-3 14 3l-4 12-12-5Z" fill="#b8af88" stroke={ink} strokeWidth="1.5" />
      <path d="m78 126 37-16 25-24-5 29-47 21Z" fill="#b9c3ae" stroke={ink} strokeWidth="1.8" />
      <path d="m84 132 47-19 5-19-20 22Z" fill="#668d7f" />
      <path d="m123 132 10-35 17-28-4 38-15 29Z" fill="#d4d8bb" stroke={ink} strokeWidth="1.8" />
      <path d="m77 121 10 20m34-11 16 7" stroke="#aa8c58" strokeWidth="4" strokeLinecap="round" />
      <path d="m68 101 8 6-8 6-7-6Z" fill="#b9a76b" stroke={ink} strokeWidth="1.3" />
      <Engraving
        d="M54 67q1-25 24-36M47 119l9 6m-14 3 10 5M104 125q5 19 12 28M72 119l-2 9m-12 14-9 6M107 37l8 11"
        color="#a0b088"
      />
      <Engraving d="M84 48l6 10m-16-9 3 7m29-7-4 6M67 136l8-5m-4 9 8-5M128 134l5 2" />
    </>
  ),
};

export function CharacterArt({ id }: { id: 'ironclad' | 'silent' }) {
  return (
    <svg
      className={`fighter-portrait character-art ${id}`}
      viewBox="0 0 180 180"
      aria-hidden="true"
      focusable="false"
      data-character-art={id}
    >
      <ellipse cx="90" cy="165" rx="73" ry="7" fill={ink} opacity=".25" />
      {figures[id]}
    </svg>
  );
}
