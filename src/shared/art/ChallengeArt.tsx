import type { ReactNode } from 'react';

export const CHALLENGE_PLATES = [
  ['blindside-order', 'The last multiplier'],
  ['spire-artifact', 'One layer of protection'],
  ['hearth-position', 'Make room for the Cub'],
] as const;

export const CHALLENGE_SYMBOLS = [
  'choice',
  'resolve',
  'retry',
  'hint',
  'cleared',
  'new',
  'active',
  'attention',
  'stone',
] as const;
export type ChallengeSymbolKind = (typeof CHALLENGE_SYMBOLS)[number];

const ink = '#162e2a';
const cream = '#f0e0b7';
const gold = '#c49a58';
const rust = '#ae634b';
const sage = '#9cac83';

function Lines({
  d,
  color = cream,
  width = 1,
  opacity = 1,
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
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}

function Plate({ id, children, color }: { id: string; children: ReactNode; color: string }) {
  return (
    <svg
      className="challenge-art"
      data-challenge-art={id}
      viewBox="0 0 360 192"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="360" height="192" rx="8" fill={color} />
      <path
        d="M0 154Q88 137 177 151T360 147V184Q360 192 352 192H8Q0 192 0 184Z"
        fill={ink}
        opacity=".48"
      />
      <path
        d="M14 170V23Q14 14 23 14H337Q346 14 346 23V170"
        stroke={gold}
        strokeWidth=".65"
        opacity=".46"
      />
      <path
        d="M23 157V33H58M302 33H337V157M24 179H102M258 179H336"
        stroke={gold}
        strokeWidth=".7"
        opacity=".4"
      />
      <path d="M175 179L180 175 185 179 180 183Z" fill={gold} opacity=".7" />
      {children}
    </svg>
  );
}

function Coin({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path d="M-19-4V4C-19 13 19 13 19 4V-4" fill="#9c7446" stroke={ink} strokeWidth="1.5" />
      <ellipse cy="-4" rx="19" ry="7" fill={gold} stroke={ink} strokeWidth="1.5" />
      <ellipse cy="-4" rx="13" ry="4" stroke={cream} strokeWidth=".8" opacity=".6" />
      <Lines d="M-13 5V8M-8 7V10M-2 8V11M4 8V11M10 6V9" color={ink} width={0.8} opacity={0.7} />
    </g>
  );
}

function MultiplierPlate() {
  return (
    <Plate id="blindside-order" color="#24463c">
      <g opacity=".17" stroke={cream} strokeWidth=".6">
        <path d="M54 121V70A69 69 0 0 1 138 3M250 22A77 77 0 0 1 302 115M39 55H79M272 135H324" />
        <circle cx="222" cy="88" r="66" />
      </g>
      <ellipse cx="183" cy="161" rx="115" ry="10" fill={ink} opacity=".6" />
      <path
        d="M222 106L245 147H256V156H183V147H194L211 106Z"
        fill="#887348"
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M218 112L211 145H236L225 112Z" fill={ink} />
      <path d="M186 151H251" stroke={cream} opacity=".45" />
      <circle cx="219" cy="87" r="57" fill={ink} stroke={gold} strokeWidth="2" />
      <circle cx="219" cy="87" r="51" fill="#d1ae6c" />
      <circle cx="219" cy="87" r="43" fill="#315244" stroke={ink} strokeWidth="2" />
      {Array.from({ length: 24 }, (_, i) => (
        <path
          key={i}
          d={i % 3 === 0 ? 'M219 37V44' : 'M219 38V41'}
          stroke={ink}
          strokeWidth={i % 3 === 0 ? 1.6 : 0.8}
          transform={`rotate(${i * 15} 219 87)`}
        />
      ))}
      <path d="M191 81Q215 53 242 64M194 111Q219 128 242 108" stroke={gold} strokeWidth=".8" />
      <g transform="rotate(-20 219 87)">
        <path
          d="M203 66L219 82 235 66 240 72 224 88 240 104 234 110 218 94 202 110 197 104 212 88 197 72Z"
          fill={cream}
        />
        <path d="M205 70L217 83M222 94L234 106" stroke={gold} strokeWidth="1.2" />
      </g>
      <circle cx="219" cy="88" r="4" fill={gold} stroke={ink} />
      <g transform="rotate(-17 130 102)">
        <rect x="91" y="43" width="71" height="108" rx="5" fill={ink} />
        <rect
          x="85"
          y="38"
          width="71"
          height="108"
          rx="5"
          fill="#b78e59"
          stroke={ink}
          strokeWidth="2"
        />
        <path d="M90 43H151V141H90Z" stroke={cream} strokeWidth=".8" />
        <path
          d="M96 54L145 131M96 78L136 138M100 46L145 115M96 130L145 53M96 106L136 46M109 138L145 81"
          stroke={ink}
          strokeWidth="1"
          opacity=".35"
        />
      </g>
      <g transform="rotate(8 145 101)">
        <rect
          x="108"
          y="46"
          width="73"
          height="109"
          rx="5"
          fill={ink}
          opacity=".35"
          transform="translate(4 4)"
        />
        <rect
          x="108"
          y="46"
          width="73"
          height="109"
          rx="5"
          fill={cream}
          stroke={ink}
          strokeWidth="1.8"
        />
        <rect x="113" y="51" width="63" height="99" rx="2" stroke={gold} strokeWidth=".7" />
        <path
          d="M145 71C139 82 124 87 124 100C124 112 140 114 143 104C143 115 138 120 134 123H156C151 118 146 114 146 104C151 115 166 110 166 100C166 87 151 82 145 71Z"
          fill={ink}
        />
        <path d="M144 79C140 86 130 91 129 98" stroke="#57745a" strokeWidth="1.3" />
        <path d="M120 60L116 70H124ZM165 141L173 141 169 132Z" fill={rust} />
        <path d="M133 135H156M138 138H151" stroke={gold} strokeWidth=".75" />
      </g>
      <Coin x={264} y={152} size={0.94} />
      <Coin x={264} y={144} size={0.94} />
      <Coin x={264} y={136} size={0.94} />
      <Coin x={288} y={158} size={0.73} />
      <g fill={gold}>
        <path d="M70 80L73 91 84 94 73 97 70 108 67 97 56 94 67 91Z" />
        <path d="M292 44L294 51 301 53 294 55 292 62 290 55 283 53 290 51Z" />
      </g>
    </Plate>
  );
}

function ProtectionPlate() {
  return (
    <Plate id="spire-artifact" color="#303e39">
      <path
        d="M71 145V60L114 22H266L296 60V145M87 139V65L122 34H257L282 67V139"
        stroke={sage}
        strokeWidth=".7"
        opacity=".2"
      />
      <path d="M208 21V158M140 90H301" stroke={sage} strokeWidth=".6" opacity=".17" />
      <ellipse cx="184" cy="162" rx="103" ry="9" fill={ink} opacity=".8" />
      <path d="M211 145L197 159 214 164 229 157Z" fill="#729486" opacity=".16" />
      <ellipse
        cx="213"
        cy="89"
        rx="67"
        ry="49"
        transform="rotate(-32 213 89)"
        stroke={gold}
        strokeWidth="1"
        opacity=".65"
      />
      <ellipse
        cx="213"
        cy="89"
        rx="73"
        ry="54"
        transform="rotate(-32 213 89)"
        stroke={gold}
        strokeWidth=".5"
        opacity=".25"
      />
      <path
        d="M213 33L252 59 245 116 213 145 181 116 174 59Z"
        fill="#576e64"
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M213 33V65L193 78 174 59Z" fill={cream} />
      <path d="M213 33L252 59 233 78 213 65Z" fill="#b4c6ad" />
      <path d="M252 59L245 116 230 108 233 78Z" fill="#789d8e" />
      <path d="M181 116L213 145V120L194 108Z" fill="#789d8e" />
      <path d="M213 145L245 116 230 108 213 120Z" fill="#bcc9a8" />
      <path
        d="M193 78L213 65 233 78 230 108 213 120 194 108Z"
        fill={ink}
        stroke={gold}
        strokeWidth="1.1"
      />
      <path d="M192 92Q212 67 234 92Q214 111 192 92Z" fill="#739b88" />
      <path d="M197 91Q213 78 228 91Q213 101 197 91Z" fill={cream} />
      <path d="M213 80Q223 90 213 101Q206 91 213 80Z" fill={ink} />
      <circle cx="216" cy="87" r="2" fill={cream} />
      <Lines
        d="M182 57L204 41M185 65L202 54M241 66L238 75M239 101L238 110M201 123L209 133M222 129L234 118"
        color={ink}
        opacity={0.5}
      />
      <path d="M158 120Q167 139 210 127" stroke={gold} strokeWidth="1.2" />
      <path d="M160 116L162 125 171 123" stroke={cream} strokeWidth="1" />
      <g transform="rotate(-12 120 124)">
        <path
          d="M104 70H128L126 105C130 119 148 122 148 139C148 155 94 161 89 142C85 128 104 119 107 106Z"
          fill="#416955"
          stroke={ink}
          strokeWidth="2"
        />
        <path
          d="M107 109C105 121 89 128 94 141C99 153 136 151 142 143C147 136 131 124 125 112Z"
          fill="#819b66"
        />
        <path d="M94 137Q117 125 142 135V142Q124 154 99 147Z" fill="#a3b581" />
        <path
          d="M102 132C103 127 115 122 114 108L113 82"
          stroke={cream}
          strokeWidth="2.2"
          opacity=".6"
          strokeLinecap="round"
        />
        <path
          d="M101 70Q115 65 131 70L130 80Q115 85 102 80Z"
          fill={gold}
          stroke={ink}
          strokeWidth="1.5"
        />
        <path
          d="M106 68L105 58Q115 54 126 58L125 68Z"
          fill="#ac7953"
          stroke={ink}
          strokeWidth="1.5"
        />
        <path d="M108 61L123 59M114 66L121 63" stroke={cream} opacity=".35" />
        <path d="M107 124Q122 117 128 130Q121 139 107 137Z" fill={ink} opacity=".5" />
        <path d="M110 133L124 126M116 126L118 135" stroke={cream} strokeWidth=".8" opacity=".6" />
      </g>
      <path
        d="M96 158C70 144 72 121 61 112C60 135 65 151 81 159C69 156 61 156 51 162C69 165 89 166 106 164"
        fill="#71866b"
      />
      <Lines d="M59 162Q80 157 100 163M69 132L80 153" color={ink} opacity={0.7} />
      <path d="M288 89L291 96 288 103 285 96Z" fill={gold} />
      <circle cx="161" cy="48" r="2" fill={gold} />
    </Plate>
  );
}

function CubPlate() {
  return (
    <Plate id="hearth-position" color="#493a30">
      <circle cx="187" cy="85" r="66" stroke={gold} strokeWidth=".7" opacity=".25" />
      <path
        d="M135 38Q186 3 239 39M269 36V146M267 36H280M268 48L304 53 299 94 281 87 269 91"
        stroke={gold}
        strokeWidth="1"
        opacity=".42"
      />
      <path d="M79 153V39" stroke="#927553" strokeWidth="3" />
      <path
        d="M79 42L127 45 121 102 102 92 83 103Z"
        fill="#815044"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path d="M84 48L120 50 115 91 103 85 89 93Z" stroke={gold} strokeWidth=".7" />
      <path d="M93 68C94 59 111 60 112 70L110 77 95 76Z" fill={gold} />
      <path
        d="M95 60L95 65M103 58V64M112 62L109 66"
        stroke={gold}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M79 30L83 37 79 42 75 37Z" fill={gold} />
      <ellipse cx="181" cy="166" rx="111" ry="9" fill={ink} opacity=".6" />
      <path
        d="M119 149L145 138H237L254 149V161L234 167H142L119 161Z"
        fill="#6e4a35"
        stroke={ink}
        strokeWidth="1.7"
      />
      <path d="M119 149H254L234 155H142Z" fill="#b48c59" />
      <path d="M127 160H233L248 155M143 155V166M235 156V164" stroke={gold} strokeWidth=".8" />
      <path
        d="M130 139C126 126 125 108 136 94C144 83 155 80 170 76C182 72 190 66 198 57C207 47 219 47 228 52C236 45 245 47 250 53C255 60 251 69 248 73C252 79 251 83 259 85L265 93C264 101 254 105 242 106L231 114L233 144L242 146L241 152H219C215 143 217 128 215 119C207 124 199 127 187 128L174 142L181 146L179 153H152L148 145C141 149 130 147 124 144Z"
        fill="#c09968"
        stroke={ink}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M134 108C138 92 158 89 172 85C190 80 197 60 212 56C203 71 200 86 190 97C174 110 148 111 136 128Z"
        fill="#e0c298"
      />
      <path d="M202 68C206 55 219 54 227 58L222 68 210 78Z" fill="#efd7ae" />
      <path d="M231 56Q244 48 247 57L244 67 236 69Z" fill="#8f684b" />
      <path d="M237 56Q246 53 243 63L238 65Z" fill={ink} />
      <path d="M248 79L255 85 263 91C260 99 245 101 237 96L235 88Z" fill="#ecd3a8" />
      <path d="M256 86L265 91 262 95 256 94Z" fill={ink} />
      <path d="M239 77Q244 73 248 77L244 80Z" fill={ink} />
      <path d="M241 76L245 76" stroke={cream} strokeWidth=".8" />
      <path
        d="M247 99L251 102M244 102L256 100"
        stroke={ink}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M222 86C220 100 213 111 197 119L215 119C217 131 214 145 219 152H228L225 143 227 112 240 104C230 105 223 102 222 86Z"
        fill="#8e6548"
      />
      <path
        d="M162 118C150 122 145 135 148 145L153 152H170L165 143C171 129 185 128 190 119C181 123 173 125 169 123Z"
        fill="#a07550"
      />
      <path
        d="M133 112L128 126 126 122 126 135 131 139M147 97L156 93M153 101L166 97M171 91L184 85M197 71L192 81M197 93L191 101M145 115L137 125M205 102L200 109"
        stroke="#765b42"
        strokeWidth=".8"
        fill="none"
        strokeLinecap="round"
      />
      <Lines
        d="M153 148H166M222 147H235M155 145V149M160 144V149M225 144V148M230 145V149"
        color={ink}
        width={0.8}
      />
      <path
        d="M96 159C88 147 87 136 94 125C102 135 100 144 99 149C107 138 115 137 122 139C117 149 110 154 102 157"
        fill="#8f9b71"
      />
      <Lines d="M95 133L98 153M113 143L101 155" color={ink} />
      <path
        d="M271 157C273 145 280 137 293 137C290 148 282 153 275 154L284 157 293 164C282 165 276 162 271 157Z"
        fill="#8f9b71"
      />
    </Plate>
  );
}

/** A decorative plate never encodes the puzzle's winning order or current rules state. */
export function ChallengeArt({ id }: { id: string }) {
  switch (id) {
    case 'blindside-order':
      return <MultiplierPlate />;
    case 'spire-artifact':
      return <ProtectionPlate />;
    case 'hearth-position':
      return <CubPlate />;
    default:
      return null;
  }
}

/** Small engraved objects share the plates' inks; text always carries their meaning. */
export function ChallengeSymbol({ kind }: { kind: ChallengeSymbolKind }) {
  return (
    <svg
      className={`challenge-symbol challenge-symbol-${kind}`}
      data-challenge-symbol={kind}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'choice' && (
        <>
          <rect
            x="13"
            y="13"
            width="27"
            height="38"
            rx="3"
            fill={gold}
            stroke={ink}
            strokeWidth="2"
            transform="rotate(-14 26 32)"
          />
          <rect
            x="24"
            y="10"
            width="28"
            height="40"
            rx="3"
            fill={cream}
            stroke={ink}
            strokeWidth="2"
            transform="rotate(9 38 30)"
          />
          <path d="M39 20L46 30 37 39 30 29Z" fill={rust} />
          <Lines d="M16 54H45M21 58H39" color={gold} />
        </>
      )}
      {kind === 'resolve' && (
        <>
          <path d="M13 16L32 7 51 16V47L32 57 13 47Z" fill={gold} stroke={ink} strokeWidth="2" />
          <path d="M18 20L32 14 46 20V43L32 50 18 43Z" fill={ink} />
          <path d="M32 19L41 28 32 38 23 28Z" fill={cream} />
          <Lines d="M23 41L29 44M35 44L41 41" color={sage} width={2} />
          <path d="M32 25V31L36 29" stroke={ink} strokeWidth="1.5" />
        </>
      )}
      {kind === 'retry' && (
        <>
          <path d="M47 24A19 19 0 1 0 49 39" stroke={gold} strokeWidth="6" strokeLinecap="round" />
          <path d="M50 10L51 29 34 25Z" fill={cream} stroke={ink} strokeWidth="1.5" />
          <path d="M31 23L40 32 31 41 22 32Z" fill={sage} />
          <path d="M30 27L35 32 30 37" stroke={ink} strokeWidth="1.5" />
        </>
      )}
      {kind === 'hint' && (
        <>
          <path d="M25 16V11A7 7 0 0 1 39 11V16" stroke={gold} strokeWidth="2.5" />
          <path d="M21 23H43L47 49H17Z" fill={cream} stroke={ink} strokeWidth="2" />
          <path
            d="M32 27C31 33 24 35 27 41C31 47 39 42 37 37L34 34 33 40C30 38 33 31 32 27Z"
            fill={rust}
          />
          <path
            d="M20 22L25 15H39L44 22ZM16 50H48V55H16Z"
            fill={gold}
            stroke={ink}
            strokeWidth="1.5"
          />
          <Lines
            d="M21 25L24 47M43 25L40 47M6 33H10M54 33H58M9 19L13 22M51 22L55 19"
            color={gold}
            width={1.5}
          />
        </>
      )}
      {kind === 'cleared' && (
        <>
          <path d="M20 40L16 58 28 53 33 58 39 41" fill={rust} stroke={ink} strokeWidth="1.5" />
          <path
            d="M32 5L39 9 47 10 50 18 55 25 52 33 51 42 42 45 35 50 27 47 18 46 15 37 10 30 13 22 14 13 23 10Z"
            fill={gold}
            stroke={ink}
            strokeWidth="1.5"
          />
          <circle cx="32" cy="28" r="16" fill={ink} stroke={cream} strokeWidth="1" />
          <path
            d="M22 28L29 35 43 21"
            stroke={cream}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === 'new' && (
        <>
          <path
            d="M32 7L38 25 56 31 38 37 32 55 26 37 8 31 26 25Z"
            fill={gold}
            stroke={ink}
            strokeWidth="1.5"
          />
          <path d="M32 16L35 28 47 31 35 34 32 46 29 34 17 31 29 28Z" fill={cream} />
          <path d="M45 9L46 14 51 15 46 16 45 21 44 16 39 15 44 14Z" fill={sage} />
        </>
      )}
      {kind === 'active' && (
        <>
          <path
            d="M17 12H47V18C47 24 40 27 35 31C40 35 47 39 47 46V51H17V46C17 39 24 35 29 31C24 27 17 24 17 18Z"
            fill={cream}
            stroke={ink}
            strokeWidth="2"
          />
          <path d="M22 18H42C41 24 36 25 32 28C28 25 23 24 22 18ZM22 47L32 36 42 47Z" fill={gold} />
          <path d="M32 29V36" stroke={gold} strokeWidth="2" />
          <path d="M14 8H50V14H14ZM14 50H50V56H14Z" fill={gold} stroke={ink} strokeWidth="1.5" />
        </>
      )}
      {kind === 'attention' && (
        <>
          <path
            d="M32 7L57 51Q59 55 53 55H11Q5 55 8 50L29 8Q30 5 32 7Z"
            fill={gold}
            stroke={ink}
            strokeWidth="2"
          />
          <path d="M30 23H35L34 39H31Z" fill={ink} />
          <circle cx="32.5" cy="46" r="2.5" fill={ink} />
        </>
      )}
      {kind === 'stone' && (
        <>
          <ellipse cx="32" cy="51" rx="25" ry="5" fill={ink} opacity=".4" />
          <path
            d="M10 37C10 25 22 12 35 12C49 12 57 27 55 39C52 54 13 55 10 37Z"
            fill="#8d9b83"
            stroke={ink}
            strokeWidth="1.5"
          />
          <path d="M12 32C22 10 44 9 50 25C41 20 34 24 28 30C22 36 16 36 12 32Z" fill="#cfceb0" />
          <path d="M18 43C35 47 49 40 53 32C52 45 37 51 23 48Z" fill="#5c7665" />
          <path
            d="M20 26Q29 17 39 20M23 30Q28 24 33 24"
            stroke={cream}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity=".65"
          />
        </>
      )}
    </svg>
  );
}
