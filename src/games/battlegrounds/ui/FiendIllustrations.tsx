type Fiend = 'imp' | 'matron' | 'juggler' | 'watcher' | 'infernal' | 'devourer';

function Ember({ x, y, mirror = false }: { x: number; y: number; mirror?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${mirror ? -1 : 1} 1)`}>
      <path
        d="M0 10C-16 2-8-9-2-15C3-20 1-25 0-29C12-20 13-10 7-5C12-6 14-10 14-13C22 2 9 9 0 10Z"
        fill="#8e739e"
      />
      <path d="M1 6C-7 0 1-7 3-13C8-5 5-1 1 6Z" fill="#e2c1b4" />
    </g>
  );
}

function Imp({ juggler = false }: { juggler?: boolean }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Low shoulders, bat ears and a projecting muzzle give the small fiends their own anatomy. */}
      {!juggler && (
        <g>
          <path
            d="M52 93Q24 80 15 47Q29 55 39 41Q37 59 52 63L66 85ZM104 84Q122 48 143 31Q138 56 154 75Q138 71 133 91Q119 85 111 103Z"
            fill="#493249"
          />
          <path
            d="M23 54Q37 73 59 87M40 47Q37 65 49 75M143 39Q122 60 111 87M141 57Q123 67 119 86M146 74Q131 74 127 86"
            fill="none"
            stroke="#9a6479"
            strokeWidth=".8"
          />
        </g>
      )}
      <path d="M25 112Q31 90 53 81L63 64H94L107 78Q127 82 139 112Z" fill="#352939" />
      <path
        d="M37 112Q41 93 65 86L70 72L90 68L104 87Q123 94 127 112Z"
        fill={juggler ? '#806581' : '#8a6474'}
      />
      <path d="M65 87Q82 94 103 85L92 104L83 112L69 103Z" fill="#b08a91" />
      <path
        d="M66 95L56 109M99 95L109 110M44 104Q50 99 56 98"
        fill="none"
        stroke="#d1a59f"
        strokeWidth=".7"
        opacity=".6"
      />
      <path
        d="M58 49Q36 43 33 27Q49 34 64 29ZM101 37Q116 34 131 23Q133 43 110 51Z"
        fill="#765366"
      />
      <path
        d="M42 33Q49 39 60 40L56 46Q45 42 42 33ZM120 31Q115 39 106 42L112 45Q121 39 120 31Z"
        fill="#bf9197"
      />
      <path d="M61 39Q46 23 54 9Q55 24 73 29ZM95 27Q111 20 109 7Q119 23 105 38Z" fill="#292631" />
      <path
        d="M59 33Q50 22 54 15Q56 24 66 28ZM102 27Q110 23 111 17Q114 29 105 33Z"
        fill="#c9b091"
      />
      <path
        d="M59 34Q76 21 95 28Q110 33 108 50L114 59L108 69Q105 82 88 88Q68 82 62 67Q53 58 59 34Z"
        fill="#63465c"
      />
      <path
        d="M65 35Q80 25 96 32Q103 35 103 45L96 55L107 62L104 70Q100 79 89 82Q72 77 68 62L62 56Z"
        fill={juggler ? '#aa87a0' : '#b08794'}
      />
      <path d="M66 38Q72 33 81 33L78 43L70 49L63 49Z" fill="#d0a7a5" />
      <path d="M84 35Q96 33 101 39L100 45L92 48L88 44Z" fill="#8d6a81" />
      <path d="M65 48Q72 45 80 48L77 54L69 54ZM90 49Q98 44 104 45L99 53L92 55Z" fill="#3c2a3b" />
      <path d="M69 49L77 50L73 52ZM94 50L101 47L98 51Z" fill="#e8b77a" />
      <path d="M86 46Q82 54 85 58L93 60L97 56L91 55L90 48Z" fill="#d0a6a4" />
      <path d="M85 58L91 61L96 58" fill="none" stroke="#6a465f" strokeWidth=".8" />
      <path d="M74 66Q89 70 103 63L100 67Q88 73 77 69Z" fill="#473044" />
      <path d="M78 68L81 72L82 69M96 68L97 70L99 66" fill="#e3c2a0" />
      <path d="M82 78Q90 82 97 75L91 87L87 87Z" fill="#8d687d" />
      <path
        d="M69 59L74 62M101 57L102 59M72 38L77 36M63 57Q61 52 62 47"
        fill="none"
        stroke="#e0b3af"
        strokeWidth=".6"
        opacity=".7"
      />
      {juggler && (
        <g>
          <Ember x={26} y={53} />
          <Ember x={136} y={57} mirror />
          <path
            d="M34 112Q24 98 23 89Q17 88 14 82L10 70Q10 66 13 68L19 79L24 82L21 70Q21 66 24 67L28 80L30 83L34 76Q37 71 39 74L36 85L40 89L45 108ZM122 112Q126 99 127 91L132 88L137 77Q140 73 141 75L138 85L143 79Q147 72 149 75L145 85Q141 90 136 92L135 112Z"
            fill="#98748f"
          />
          <path
            d="M19 73L23 83L31 88M31 75L33 83M140 76L137 84L133 88"
            fill="none"
            stroke="#d7b6b3"
            strokeWidth=".65"
          />
          <circle cx="25" cy="29" r="1" fill="#d2a2bb" />
          <circle cx="135" cy="27" r=".7" fill="#d2a2bb" />
        </g>
      )}
    </g>
  );
}

function Matron() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M55 36C26 30 31 11 45 3C36 18 45 24 65 23ZM99 24C119 19 126 12 121 1C138 13 128 34 109 38Z"
        fill="#b4a18e"
      />
      <path
        d="M55 31Q35 25 39 13M106 29Q126 22 126 13"
        fill="none"
        stroke="#e3d0ac"
        strokeWidth=".8"
      />
      <path
        d="M18 112Q19 89 39 78L51 44Q48 26 66 19Q92 7 109 30Q120 49 112 70Q135 82 145 112Z"
        fill="#292331"
      />
      <path
        d="M59 31Q38 47 49 75L38 89L32 112H62L70 66ZM96 24Q116 40 104 73L121 91L128 112H106L92 73Z"
        fill="#4e3b58"
      />
      <path d="M62 38Q67 23 83 25Q102 25 103 41L98 68Q91 83 80 84Q67 78 64 66Z" fill="#a18397" />
      <path
        d="M70 32Q79 26 88 29Q80 46 80 57L88 63L83 68L75 65L71 73Q65 64 67 48Z"
        fill="#c3a6b2"
      />
      <path
        d="M91 32Q104 38 99 54L94 64L97 66L91 77L80 83L89 69L85 62L90 59L85 54Z"
        fill="#705771"
      />
      <path d="M66 47Q73 44 81 49L75 53L69 51ZM87 48Q94 44 100 44L97 49L89 51Z" fill="#3d2e43" />
      <path d="M70 48L77 49L73 51ZM90 48L97 46L94 49Z" fill="#e3bc86" />
      <path
        d="M83 50L79 59L83 61M77 70Q82 68 88 69M79 73H85"
        fill="none"
        stroke="#67475f"
        strokeWidth=".8"
      />
      <path d="M72 78L71 87L55 95L82 108L106 92L94 85L94 75L84 84Z" fill="#9e8296" />
      <path
        d="M32 112L46 85L57 79L64 95L79 108L81 112ZM85 112L105 93L112 78L125 86L139 112Z"
        fill="#554150"
      />
      <path
        d="M48 89L60 100L78 111M114 87L104 101L90 111"
        fill="none"
        stroke="#c3a16e"
        strokeWidth="1.1"
      />
      <path d="M65 28L72 18L80 24L89 14L96 26L103 24L99 34L88 28L77 32Z" fill="#7e694f" />
      <path d="M74 25L81 28L90 21L95 29" fill="none" stroke="#d7bc87" strokeWidth=".9" />
      <path d="M81 92L87 86L92 94L86 103Z" fill="#d6b883" />
      <path
        d="M48 53Q42 70 47 79M55 94L46 108M107 94L114 108"
        fill="none"
        stroke="#aa8297"
        strokeWidth=".7"
      />
    </g>
  );
}

function Watcher() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M10 112Q13 81 44 71L49 38Q55 14 82 16Q111 13 117 40L125 73Q146 84 151 112Z"
        fill="#282632"
      />
      <path
        d="M47 52Q21 60 23 34Q24 16 39 9Q29 27 40 34L54 34ZM109 34Q130 25 126 8Q143 21 137 42Q133 56 115 56Z"
        fill="#8f887b"
      />
      <path
        d="M47 43Q29 47 30 31M117 43Q131 42 132 28"
        fill="none"
        stroke="#c6b99a"
        strokeWidth="1"
      />
      <path d="M24 112Q25 86 56 80L56 51L111 49L114 82Q139 97 138 112Z" fill="#61536b" />
      <path d="M51 37Q60 21 82 23Q105 22 114 40L109 70Q101 86 82 89Q59 81 54 66Z" fill="#8b788f" />
      <path d="M58 38Q65 27 83 28Q99 28 109 41L96 38L82 41L69 37Z" fill="#b7a3af" />
      <path d="M56 47Q79 27 111 46Q102 67 79 65Q63 61 56 47Z" fill="#393042" />
      <path d="M62 47Q83 35 106 47Q96 59 80 59Q69 57 62 47Z" fill="#b89881" />
      <path d="M78 40Q67 54 81 61Q95 58 94 43Z" fill="#e8c88b" />
      <path d="M83 40L86 58L89 40Z" fill="#413541" />
      <circle cx="79" cy="45" r="1.4" fill="#fae0a8" />
      <path
        d="M58 61Q71 71 84 68L83 76L73 80L63 74ZM91 68L109 57L107 70L98 79L88 79Z"
        fill="#a994a1"
      />
      <path d="M69 80Q84 79 100 77L97 80L73 83Z" fill="#3d3043" />
      <path d="M55 85L65 93L60 112H31L35 98ZM107 86L127 96L133 112H107L100 97Z" fill="#474051" />
      <path
        d="M41 99L53 92M117 96L125 101M69 91Q82 98 99 89M72 99Q84 104 94 98"
        fill="none"
        stroke="#ac8ea6"
        strokeWidth=".8"
      />
    </g>
  );
}

function HornedPatron({ herald = false }: { herald?: boolean }) {
  const skin = herald ? '#b7a891' : '#756b86';
  const light = herald ? '#e1d0ab' : '#a799b0';
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 112Q12 87 42 76L52 51H108L122 76Q145 90 152 112Z" fill="#262531" />
      <path
        d="M21 112L31 91L53 79L80 94L111 78L135 91L142 112Z"
        fill={herald ? '#755447' : '#494052'}
      />
      <path
        d={
          herald
            ? 'M56 42C31 49 14 29 28 12C37 2 52 6 55 19C45 11 34 14 34 24C35 33 47 35 60 30ZM104 31C118 30 128 22 122 13C115 7 107 13 108 20C100 8 115 0 128 8C148 23 129 48 107 44Z'
            : 'M58 38C25 45 10 27 15 6C22 24 40 22 55 22ZM102 22C123 24 143 19 146 5C155 29 134 45 105 40Z'
        }
        fill={herald ? '#75644f' : '#a3978c'}
      />
      <path
        d={
          herald
            ? 'M55 38Q24 40 28 21Q31 10 43 12M106 37Q135 35 129 19Q125 10 116 12'
            : 'M55 31Q26 35 20 17M107 31Q136 33 143 17'
        }
        fill="none"
        stroke={herald ? '#c9b18a' : '#d6c7ac'}
        strokeWidth="1.1"
      />
      <path
        d="M49 41Q58 26 80 25Q103 25 111 42L106 67L116 73L107 88L84 98L59 90L48 77L56 68Z"
        fill={skin}
      />
      <path d="M59 40Q70 30 82 31L76 48L73 61L62 66L59 57Z" fill={light} />
      <path
        d="M85 32Q102 32 106 45L95 52L91 61L100 69L91 84L81 91L77 75L81 62L78 53Z"
        fill={herald ? '#8a7c6b' : '#54495f'}
      />
      <path d="M58 49Q67 46 76 51L71 58L61 57ZM87 51Q100 44 108 47L102 55L91 57Z" fill="#342c3a" />
      <path d="M63 51L73 52L68 55ZM92 52L103 49L98 53Z" fill={herald ? '#edbe7b' : '#cbb8df'} />
      <path d="M77 55L69 70L76 74L87 72L92 66L85 58L82 69L77 70Z" fill={light} />
      <path d="M73 70L77 72L83 70" fill="none" stroke="#514050" strokeWidth=".8" />
      <path d="M60 76Q80 80 102 73L99 78Q80 85 64 81Z" fill="#362a3b" />
      <path
        d="M62 73Q60 62 56 57Q56 70 58 79L64 83ZM99 76Q109 68 112 59Q116 74 105 84Z"
        fill={light}
      />
      <path d="M68 78L70 81L73 79M89 79L92 81L94 78" fill="#ddd1b3" />
      <path d="M70 89L82 92L95 86L88 101L81 108L75 102Z" fill={herald ? '#8c7b63' : '#696076'} />
      <path
        d="M35 112L37 91L54 82L62 93L54 101L52 112ZM110 112L105 94L114 83L131 94L133 112Z"
        fill={herald ? '#a98053' : '#656073'}
      />
      <path
        d="M42 96L51 89L56 94M113 92L117 89L126 97M61 40L69 36M94 36L101 40"
        fill="none"
        stroke={light}
        strokeWidth=".7"
        opacity=".8"
      />
      {herald && (
        <g>
          <path d="M22 112L28 48L31 49L28 112Z" fill="#987750" />
          <path d="M29 57Q11 47 16 28Q20 39 30 42Q41 39 44 29Q49 49 29 57Z" fill="#c4a36d" />
          <path d="M29 47L28 35L33 33L35 43Z" fill="#e1c187" />
        </g>
      )}
    </g>
  );
}

export function DemonPortrait({ kind }: { kind: Fiend }) {
  if (kind === 'imp' || kind === 'juggler') return <Imp juggler={kind === 'juggler'} />;
  if (kind === 'matron') return <Matron />;
  if (kind === 'watcher') return <Watcher />;
  return <HornedPatron herald={kind === 'infernal'} />;
}
