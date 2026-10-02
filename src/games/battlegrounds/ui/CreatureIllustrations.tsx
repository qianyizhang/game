/** Hand-drawn, fixed vector illustrations. Each creature has its own silhouette and pose. */
export function Phoenix() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <circle cx="82" cy="49" r="34" fill="#bb6547" opacity=".07" />
      <circle cx="82" cy="49" r="29" stroke="#dea66a" strokeWidth=".5" opacity=".22" />
      {/* Long tail coverts establish the upward sweep before the wings overlap them. */}
      <path
        d="M75 66C66 83 38 81 42 99C44 106 38 110 29 112C49 111 59 101 52 93C48 84 74 94 82 73Z"
        fill="#ae543e"
      />
      <path
        d="M79 68C66 85 83 88 64 100C59 103 52 108 52 112C72 110 91 99 84 89C77 80 91 76 90 66Z"
        fill="#d77f4c"
      />
      <path
        d="M84 69C91 89 118 90 110 106C107 110 110 112 114 112C130 94 114 86 102 83C90 79 95 68 91 64Z"
        fill="#99423d"
      />
      <path
        d="M75 76C64 87 56 84 48 92M83 78C74 91 87 93 64 107M96 81C102 91 118 92 115 103"
        fill="none"
        stroke="#efb66d"
        strokeWidth="1.1"
      />
      {/* The pinions have curved, separated tips rather than a single triangular edge. */}
      <path
        d="M80 65C62 53 64 37 47 26C31 15 19 18 8 7C10 23 27 31 39 35C26 33 17 28 10 23C16 40 30 44 43 45C30 47 21 43 15 38C23 54 37 57 51 55C40 61 31 56 27 55C37 68 52 68 63 68L74 73Z"
        fill="#9c4840"
      />
      <path
        d="M83 59C97 36 108 32 119 25C133 16 143 17 151 8C150 28 132 39 120 43C132 41 142 34 150 28C143 48 128 53 115 56C129 55 139 49 145 45C137 63 122 67 108 66C118 70 128 64 135 62C122 79 103 78 90 69Z"
        fill="#ac5140"
      />
      <path
        d="M76 64C66 45 61 32 42 27C31 24 22 20 15 15C25 30 49 35 57 44C42 38 28 37 18 31C30 45 50 45 59 52C47 49 35 50 26 47C38 59 57 57 68 66Z"
        fill="#db8550"
      />
      <path
        d="M85 60C102 40 116 36 128 29C137 24 142 20 146 16C140 33 113 43 106 50C122 46 133 41 143 35C132 51 115 53 105 59C117 58 127 56 135 52C124 66 102 63 91 68Z"
        fill="#e29a58"
      />
      <path d="M74 61C68 47 60 40 47 36C55 47 58 54 67 60L63 59L70 68Z" fill="#f1bd72" />
      <path d="M86 61C95 46 105 43 116 40C107 48 99 53 96 59L104 56L95 68Z" fill="#f4c879" />
      <g fill="none" stroke="#f1ba74" strokeWidth=".65" opacity=".78">
        <path d="M20 21C37 32 53 33 63 46M22 36C36 44 52 44 63 54M32 52C43 57 56 54 66 61" />
        <path d="M141 24C125 38 109 40 99 50M137 41C126 50 111 51 100 58M127 59C118 65 105 60 97 66" />
      </g>
      {/* Curved keel, neck and raptor head remain legible independently of the plumage. */}
      <path
        d="M68 65C68 56 74 50 79 44C82 40 79 35 83 31C87 27 96 29 99 33L106 35L98 40C89 39 86 45 89 50C96 62 88 74 76 79L67 83L71 74C66 75 63 75 61 74Z"
        fill="#edac62"
      />
      <path
        d="M87 33C82 37 86 41 84 46C81 53 75 55 75 63C76 70 80 71 84 71C75 79 68 80 64 79L70 71C66 71 64 71 62 70C70 66 65 57 77 47C83 42 78 33 87 33Z"
        fill="#b95740"
      />
      <path
        d="M88 32C95 30 99 34 100 37L94 38C88 37 85 42 84 47C82 53 84 56 87 59C82 58 78 55 80 50C82 43 80 37 88 32Z"
        fill="#ffe2a0"
      />
      <path d="M98 33C103 33 108 36 109 39L103 38L100 40L101 36L96 36Z" fill="#352b31" />
      <path d="M88 35Q92 34 95 35Q92 38 89 37Z" fill="#472d2d" />
      <circle cx="92" cy="35.5" r=".65" fill="#fff0bd" />
      <path
        d="M84 33C81 28 76 24 78 17C80 24 86 25 88 30C86 21 90 20 91 15C94 23 91 29 90 31Z"
        fill="#e5a260"
      />
      <path
        d="M85 29Q79 22 80 20M90 27L91 20M80 61Q77 65 80 69M76 64Q73 68 74 71"
        fill="none"
        stroke="#ffe0a0"
        strokeWidth=".7"
      />
      <path
        d="M84 72L87 79L94 81M80 75L81 82L87 85M87 79L92 78M81 82L86 81"
        fill="none"
        stroke="#c38859"
        strokeWidth="1"
      />
      <g fill="#efb973">
        <path d="M29 81Q34 77 33 72Q38 80 29 81ZM127 87Q132 82 131 78Q136 84 127 87Z" />
        <circle cx="42" cy="70" r=".8" />
        <circle cx="113" cy="20" r=".7" />
      </g>
    </g>
  );
}

function SerpentHead({
  x,
  y,
  angle = 0,
  scale = 1,
  pale = false,
  facing = 1,
  open = false,
}: {
  x: number;
  y: number;
  angle?: number;
  scale?: number;
  pale?: boolean;
  facing?: -1 | 1;
  open?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale * facing} ${scale})`}
      strokeLinejoin="round"
    >
      <path
        d="M-15 9C-20 1-16-8-10-11L-14-20L-3-13L4-17L5-11C12-10 12-5 18-4L27-3L30 2L25 6L10 5L2 11L-1 17Z"
        fill={pale ? '#80a493' : '#4e8172'}
      />
      <path
        d="M-13-9L-10-15L-7-10L0-12L4-8C12-8 10-3 19-2L27-1L24 2L6 1L0 5L-8 4Z"
        fill={pale ? '#bed0ac' : '#9dbb96'}
      />
      <path
        d={
          open
            ? 'M-7 8Q5 12 22 7L28 8Q16 18 3 16L-1 21L-9 18Z'
            : 'M-7 8Q5 10 22 6L27 7Q16 14 3 13L-1 21L-9 18Z'
        }
        fill={pale ? '#8ba48b' : '#527e6b'}
      />
      <path
        d={open ? 'M0 8L8 4L25 5L23 9Q12 13 2 12Z' : 'M0 8L8 4L25 5L26 6Q12 10 2 10Z'}
        fill="#172e2a"
      />
      <path
        d={open ? 'M9 5L10 9L12 5M18 6L19 9L21 6M6 12L8 9L9 12' : 'M9 5L10 8L12 5M18 6L19 8L21 6'}
        fill="#e2d9aa"
      />
      <path d="M-4-4Q1-6 6-3L0 0Z" fill="#183b32" />
      <path d="M-2-4L4-3L0-1Z" fill="#e9c476" />
      <path d="M1-4V-1" stroke="#23382f" strokeWidth=".75" />
      <path
        d="M22 0L24 1M-12 1L-6 3L-10 9M-12-7L-5-8M0 16L13 14"
        fill="none"
        stroke="#bfd0ac"
        strokeWidth=".6"
        opacity=".8"
      />
      <path d="M-14 8L-22 12L-18 3L-24 1L-17-3Z" fill="#39584c" />
    </g>
  );
}

export function Hydra() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Separate neck arcs and overlapping roots keep three heads readable at card scale. */}
      <path
        d="M38 112C40 94 17 85 27 64C34 51 46 55 43 40L58 41C64 60 48 65 43 74C39 84 67 89 68 112Z"
        fill="#365b4f"
      />
      <path
        d="M43 106C45 94 27 83 32 72C36 62 48 58 48 45L54 47C56 62 42 64 38 75C35 86 57 97 55 112Z"
        fill="#73947a"
      />
      <path
        d="M42 64Q32 63 28 57Q28 69 31 71Q25 71 23 68Q22 79 28 83L23 82Q25 91 34 93L31 96L39 99L37 83Z"
        fill="#a4ab79"
        opacity=".7"
      />
      <path
        d="M94 112C86 94 125 88 124 70C124 62 113 65 111 56L121 48C137 51 144 69 135 81C126 94 116 94 117 112Z"
        fill="#3f7263"
      />
      <path
        d="M107 110C102 96 132 85 132 72C133 59 122 56 119 53L124 51C144 62 138 79 127 88C117 95 115 104 117 112Z"
        fill="#8ead8d"
      />
      <path
        d="M134 61Q140 64 142 60Q143 70 137 75Q143 76 145 71Q145 82 134 86L139 87Q136 95 126 97L129 101L119 103L128 86Z"
        fill="#758b66"
      />
      <path
        d="M49 112C49 94 77 89 79 74C82 57 62 53 65 35L82 29C83 43 99 51 99 69C102 91 80 98 88 112Z"
        fill="#315b51"
      />
      <path
        d="M53 112C55 96 82 90 86 76C93 56 70 49 72 34L81 31C82 47 99 54 96 71C94 92 78 98 83 112Z"
        fill="#85a990"
      />
      <path
        d="M69 40C70 58 89 61 85 77C80 93 62 94 58 109"
        fill="none"
        stroke="#c4cba0"
        strokeWidth="2"
      />
      <path
        d="M84 42Q89 41 90 37Q93 43 91 49L96 46Q101 52 99 59L103 57Q107 64 102 72L106 71Q108 80 98 84L101 86Q97 93 89 94L96 73L93 56Z"
        fill="#83966b"
      />
      <g fill="none" stroke="#294b41" strokeWidth=".55" opacity=".55">
        <path d="M73 48Q78 50 81 47M77 54Q82 57 86 54M81 61Q87 64 92 60M84 68Q90 71 95 68M84 76Q90 77 95 75M82 83Q86 85 91 84M77 89Q81 92 85 91M69 96Q73 99 77 99" />
        <path d="M45 57Q47 60 51 59M40 63Q42 67 46 67M36 71Q38 74 42 75M38 81Q41 82 45 81M44 88Q47 90 51 88M127 63Q130 64 133 62M130 70Q133 73 137 71M128 78Q130 81 135 81M121 87Q124 90 125 91" />
      </g>
      <SerpentHead x={45} y={42} angle={16} scale={0.77} facing={-1} open />
      <SerpentHead x={119} y={50} angle={9} scale={0.73} />
      <SerpentHead x={74} y={28} angle={-9} pale />
      <path
        d="M20 111Q31 106 45 108M104 110Q125 101 143 108"
        fill="none"
        stroke="#94a67c"
        strokeWidth=".65"
        opacity=".5"
      />
    </g>
  );
}

export function Wolf({
  coat = '#707e60',
  pale = '#a6b28a',
  elder = false,
  pack = false,
}: {
  coat?: string;
  pale?: string;
  elder?: boolean;
  pack?: boolean;
}) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {elder && (
        <g fill="none" stroke="#9c9569" strokeWidth="2">
          <path d="M57 55Q31 37 34 14M36 31L23 25M37 40L24 39M96 37Q111 21 111 6M107 24L126 15M113 14L123 8" />
          <path d="M31 32L25 17M119 20L133 19" strokeWidth="1" />
        </g>
      )}
      <path
        d="M24 112Q31 88 48 69L55 48Q51 33 54 11Q71 18 81 34L94 26L105 14Q112 31 107 46Q114 54 127 58L142 61Q149 65 144 73L135 80L113 88L106 112Z"
        fill="#172e29"
      />
      <path
        d="M35 112Q35 95 54 76L51 79L61 61L59 68L66 47Q58 32 60 20Q73 24 81 40Q93 31 104 31L102 44Q110 55 123 59L139 64L139 73Q127 81 110 84L98 96L94 112Z"
        fill={coat}
      />
      <path d="M97 30L103 21L105 35Z" fill="#7d9483" />
      <path d="M61 23Q72 31 75 43L65 40Z" fill="#273e33" />
      <path d="M63 26L71 41L68 44Q67 33 63 26Z" fill="#a3a98c" />
      <path
        d="M79 43Q94 34 103 43L109 52L103 57Q116 62 139 64L139 70Q123 72 112 66L101 64L93 68L82 63Q85 53 79 43Z"
        fill={pale}
      />
      <path d="M109 52L122 59L136 62L137 65Q120 65 107 60L101 58Z" fill="#d4d5b8" opacity=".65" />
      <path d="M135 61Q145 60 145 66L141 72L134 70L132 65Z" fill="#162c29" />
      <path d="M136 63L142 64" stroke="#789186" strokeWidth=".8" />
      <path d="M139 73Q123 78 109 74L112 76Q126 79 139 73Z" fill="#1e3b31" />
      <path d="M131 79Q120 88 103 85L103 80Q119 84 131 79Z" fill={pale} />
      <path
        d="M78 66Q74 80 64 88L75 84L61 100L70 97L62 112H96L106 88Q93 89 86 80L87 73L81 78Z"
        fill={pale}
      />
      <path d="M91 73Q102 74 109 72L108 79Q100 82 93 77Z" fill={coat} />
      <path d="M95 49Q101 45 107 50L100 55L95 53Z" fill="#304a3c" />
      <path d="M98 49Q102 48 105 50L100 52Z" fill="#deb66d" />
      <path d="M101 49V51" stroke="#283b2e" strokeWidth="1" />
      <path
        d="M89 49Q94 44 99 44M88 60L97 56M72 49Q73 57 68 64M61 79L54 94M80 87L75 97M88 91L84 103M90 104L87 110M117 69L128 70"
        fill="none"
        stroke="#d7d6b7"
        strokeWidth=".65"
        opacity=".55"
      />
      <path
        d="M53 94L43 104L46 98L38 108M56 103L51 112M67 72L60 84M88 68L93 72M99 59L103 60"
        fill="none"
        stroke="#29463b"
        strokeWidth=".7"
        opacity=".65"
      />
      {pack && (
        <g>
          <path d="M41 104Q67 117 98 98L95 108Q69 121 39 113Z" fill="#776341" />
          <path d="M43 108Q66 119 97 103" fill="none" stroke="#b49b61" strokeWidth="1" />
          <path d="M81 109L88 106L90 112L85 119L79 114Z" fill="#d3b779" />
        </g>
      )}
    </g>
  );
}

export function Panther() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* A broad feline muzzle and forward stare distinguish the cat from the canids. */}
      <path
        d="M8 112Q11 88 36 79L49 70Q55 55 56 42Q47 25 55 20Q64 16 74 26Q89 21 105 27Q116 17 124 22Q133 30 122 43Q129 56 122 69L117 85Q145 93 153 112Z"
        fill="#142c2b"
      />
      <path
        d="M18 112Q20 93 42 88Q68 78 68 59L63 39Q55 27 59 25Q67 24 73 32Q86 26 104 33Q116 23 121 27L115 42Q123 58 114 70L111 91Q135 94 143 112Z"
        fill="#304e48"
      />
      <path d="M68 41Q76 31 88 32Q90 44 86 50L80 58L75 58L70 49Z" fill="#4d6d60" />
      <path d="M96 33Q108 31 115 43L112 52L104 58L97 52Q100 43 96 33Z" fill="#426458" />
      <path
        d="M66 33L61 27L62 37M114 36L119 29L118 38"
        fill="none"
        stroke="#87917a"
        strokeWidth="1"
      />
      <path d="M74 48Q81 48 87 54Q78 57 72 51Z" fill="#142c28" />
      <path d="M98 54Q104 46 113 47L110 53L101 56Z" fill="#142c28" />
      <path d="M76 50L84 53Q79 54 76 50ZM101 53L109 49L108 53L102 54Z" fill="#d7bd72" />
      <path d="M81 51V53M105 51V53" stroke="#1b342c" strokeWidth=".8" />
      <path d="M91 49Q84 57 83 62L88 66L97 65L103 61L99 57L95 49Z" fill="#648072" />
      <path
        d="M80 62Q75 67 81 73L88 74L93 72L99 75Q110 73 108 65L101 63L95 67L87 66Z"
        fill="#849582"
      />
      <path d="M87 62Q94 60 101 62L96 67L92 68Z" fill="#192e2a" />
      <path d="M90 63H98" stroke="#a2a28b" strokeWidth=".65" />
      <path
        d="M94 67V71Q89 75 83 71M94 71Q100 77 105 72"
        fill="none"
        stroke="#2b483d"
        strokeWidth="1"
      />
      <path d="M82 78Q94 85 108 77Q103 88 96 93L86 90Z" fill="#557364" />
      <path d="M60 72Q48 91 65 103L61 112H31Q36 93 60 86Z" fill="#3f5f52" />
      <path d="M58 106Q66 97 74 102Q86 94 94 102Q109 101 118 112H53Z" fill="#46685a" />
      <path
        d="M68 105L67 111M80 104L79 111M91 106L92 112M44 98Q49 92 55 92M108 86L113 94"
        fill="none"
        stroke="#829781"
        strokeWidth=".65"
        opacity=".6"
      />
      <g fill="none" stroke="#c1c8a8" strokeWidth=".45" opacity=".65">
        <path d="M83 69L62 66M84 72L60 75M85 74L67 81M103 69L126 64M103 72L130 73M102 75L122 81" />
      </g>
      <path d="M77 62L78 62M80 66L81 66M105 65H106M106 68H107" stroke="#243d32" strokeWidth="1" />
    </g>
  );
}

export function Bear({ young = false }: { young?: boolean }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* The adult's shoulder hump and the cub's rounder cranium use different proportions. */}
      <path
        d={
          young
            ? 'M19 112Q22 85 44 76L59 70H109Q139 82 145 112Z'
            : 'M5 112Q8 81 34 67Q51 55 67 68L108 70Q143 86 156 112Z'
        }
        fill="#22372d"
      />
      <path
        d={
          young
            ? 'M30 112Q32 89 52 82L107 78Q130 88 136 112Z'
            : 'M17 112Q17 88 40 75Q54 63 70 77L102 77Q126 80 144 112Z'
        }
        fill="#625e4c"
      />
      <path
        d={
          young
            ? 'M45 112Q47 95 60 91L101 89L117 112Z'
            : 'M25 111Q29 81 52 79L50 89L63 84L57 96L73 91L64 111Z'
        }
        fill="#877b60"
      />
      <g
        transform={
          young ? 'translate(-6 2) translate(86 58) scale(1.05) translate(-86 -58)' : undefined
        }
      >
        <path
          d={
            young
              ? 'M58 43Q43 31 49 22Q57 11 71 25Q88 19 104 26Q116 10 126 21Q133 31 119 42L123 56Q129 72 115 89Q102 101 82 95Q63 88 56 72Q50 57 58 43Z'
              : 'M55 43Q43 39 46 29Q47 20 58 21Q67 21 72 30Q88 24 103 30Q111 17 123 24Q133 32 120 43L126 58Q132 74 116 90Q101 102 80 95Q60 88 54 73Q48 59 55 43Z'
          }
          fill="#2f3e32"
        />
        <path
          d={
            young
              ? 'M61 41Q48 28 54 24Q61 20 69 33Q88 26 104 34Q116 19 122 25Q126 29 113 41Q122 55 119 70Q119 83 104 89Q84 96 70 81Q60 73 60 62Q53 51 61 41Z'
              : 'M60 43Q49 39 51 30Q57 21 68 36Q88 29 104 36Q112 23 121 29Q126 36 114 43Q124 56 122 69Q121 85 104 90Q84 97 68 81Q56 74 59 61Q52 52 60 43Z'
          }
          fill={young ? '#a19170' : '#80765d'}
        />
        <path
          d={
            young
              ? 'M58 28Q62 29 64 35L59 38Q54 32 58 28ZM115 31L119 27L120 30L115 36Z'
              : 'M54 31Q59 28 63 37L58 40Q52 36 54 31ZM114 32Q120 28 121 33L116 39Z'
          }
          fill="#b6a084"
        />
        <path
          d="M71 37Q87 27 105 38L110 49L103 60L91 62L78 57Q70 51 71 37Z"
          fill={young ? '#c0ac83' : '#a39774'}
        />
        <path d="M69 45Q76 45 81 51L77 56L70 53Z" fill="#3d4936" />
        <path d="M97 50Q105 44 112 46L109 52L101 54Z" fill="#3d4936" />
        <path d="M73 49Q77 48 79 51L75 52ZM102 49Q106 47 109 48L106 51Z" fill="#cfc49a" />
        <circle cx="76" cy="50.3" r="1" fill="#27382b" />
        <circle cx="105.5" cy="49.3" r="1" fill="#27382b" />
        <path
          d="M88 48Q82 56 83 62L77 66Q71 74 82 82Q96 90 108 79Q115 71 107 64L99 59L97 50Z"
          fill={young ? '#d2be93' : '#baa983'}
        />
        <path d="M86 65Q97 61 105 66Q107 69 101 74L94 75L85 71Z" fill="#24352c" />
        <path d="M89 66Q96 64 101 66" fill="none" stroke="#9b9c80" strokeWidth=".8" />
        <path
          d={
            young
              ? 'M95 75L95 79M84 80Q92 83 95 79Q101 83 106 77'
              : 'M95 75L96 79M84 81Q90 83 96 79L105 80'
          }
          fill="none"
          stroke="#77694f"
          strokeWidth=".8"
        />
        <path d="M72 73Q71 84 84 90Q95 94 106 87L97 97L86 101L71 94L63 82Z" fill="#545a44" />
        <path
          d="M75 39Q82 34 91 35M65 58L66 65M69 66L71 69M84 88L88 91M111 57L111 61"
          fill="none"
          stroke="#dcc8a0"
          strokeWidth=".7"
          opacity=".55"
        />
      </g>
      <path
        d="M34 90L30 100M41 92L37 104M49 95L45 106M112 96L119 103M108 103L112 110M65 104L61 111"
        fill="none"
        stroke="#bca98a"
        strokeWidth=".75"
        opacity=".55"
      />
      {young && (
        <g>
          <path d="M49 109Q56 95 67 100Q75 96 82 101Q94 100 98 112Z" fill="#938364" />
          <path
            d="M63 104L61 110M73 104L73 111M84 106L86 112"
            fill="none"
            stroke="#ccb48a"
            strokeWidth=".7"
          />
        </g>
      )}
    </g>
  );
}
