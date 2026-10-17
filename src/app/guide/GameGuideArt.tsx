import type { GameId } from '../GamePicker';

/** Six engraved plates: the dominant silhouette describes each game's central action. */
export function GameGuideArt({ game, className }: { game: GameId; className?: string }) {
  return (
    <svg
      viewBox="0 0 360 192"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="360" height="192" fill="#183c33" />
      <path d="M0 144 63 111 119 129 195 75 264 118 322 86 360 102V192H0Z" fill="#315244" />
      <path d="M0 166 77 143 145 158 236 130 360 155V192H0Z" fill="#102d29" />
      <circle cx="286" cy="47" r="25" fill="#d7bc7c" />
      <path d="M20 22H116M20 28H75M309 165H339M324 171H339" stroke="#70836a" />
      {game === 'balatro' ? (
        <PokerPlate />
      ) : game === 'spire' ? (
        <SpirePlate />
      ) : game === 'battlegrounds' ? (
        <HearthPlate />
      ) : game === 'diablo2' ? (
        <EmberPlate />
      ) : game === 'cartographer' ? (
        <MapPlate />
      ) : (
        <PassagePlate />
      )}
      <path d="M12 12H348V180H12Z" stroke="#d7bc7c" strokeOpacity=".35" />
    </svg>
  );
}

function PokerPlate() {
  return (
    <>
      <ellipse cx="184" cy="164" rx="116" ry="13" fill="#061f1b" />
      {[-22, -6, 13].map((angle, index) => (
        <g key={angle} transform={`rotate(${angle} 176 140) translate(${index * 44 - 39} 0)`}>
          <rect
            x="121"
            y="35"
            width="76"
            height="116"
            rx="5"
            fill="#e9dbb7"
            stroke="#997d49"
            strokeWidth="2"
          />
          <path d="M129 43H189V143H129Z" stroke="#a1946f" />
          <path
            d={
              index === 1
                ? 'M159 66 179 91 159 119 139 91Z'
                : 'M159 64C150 80 137 84 139 97 140 108 151 110 157 102L152 118H168L162 102C174 113 188 98 176 87Z'
            }
            fill={index === 1 ? '#b45a40' : '#25473c'}
          />
          <path d="M135 49V60M132 55H138M180 129V137M177 133H183" stroke="#9d753f" />
        </g>
      ))}
      <g fill="#cb9d50" stroke="#edd399">
        <ellipse cx="269" cy="150" rx="21" ry="7" />
        <path d="M248 140V149C250 159 288 159 290 149V140" fill="#a07739" />
        <ellipse cx="269" cy="140" rx="21" ry="7" />
      </g>
    </>
  );
}

function SpirePlate() {
  return (
    <>
      <path d="M147 160 157 71 170 71 170 43 181 22 190 43 190 71 202 71 216 160Z" fill="#b6b6a0" />
      <path d="M181 22 190 43V71H202L216 160H183Z" fill="#6e8071" />
      <path
        d="M157 80H203M154 107H207M150 135H212M176 51H184M175 92H184M174 119H185"
        stroke="#314c42"
        strokeWidth="3"
      />
      <path
        d="M66 166C104 153 116 162 144 147 179 129 131 123 146 105"
        stroke="#d5b779"
        strokeWidth="3"
        strokeDasharray="4 5"
      />
      <path d="M84 157 97 118 111 107 122 143 110 166Z" fill="#9e4e38" />
      <path d="M96 119 101 100 115 97 121 108 112 121Z" fill="#d5c8a6" />
      <path d="M105 103 112 82 118 99 124 104 116 111Z" fill="#85938a" />
      <path d="M112 126 133 139 148 103" stroke="#d5c8a6" strokeWidth="6" />
      <path d="M141 113 159 65 162 101 149 121Z" fill="#c2c8b3" stroke="#72877c" />
      <path d="M139 115 154 121" stroke="#ba914e" strokeWidth="4" />
      <path d="M91 151 85 173M111 154 118 173" stroke="#172b27" strokeWidth="8" />
    </>
  );
}

function HearthPlate() {
  return (
    <>
      <path d="M43 146V70L178 20 314 70V146" stroke="#a67e49" strokeWidth="8" />
      <path d="M57 77H300M68 80V148M288 80V148" stroke="#6d6947" strokeWidth="4" />
      <path d="M40 147H318L307 171H51Z" fill="#9c7547" />
      <path d="M51 153H306M62 161H296" stroke="#d4ac69" />
      <path d="M153 146V98C149 73 166 57 183 61 203 64 208 80 207 97V146Z" fill="#b4b995" />
      <path
        d="M165 61 161 45 178 58M190 62 206 47 204 75"
        fill="#b4b995"
        stroke="#d9cca4"
        strokeWidth="3"
      />
      <path d="M178 64C164 89 166 118 182 146H207V98C208 78 202 65 190 62" fill="#7d9476" />
      <path d="M168 85 179 82M191 82 200 87" stroke="#263f35" strokeWidth="3" />
      <path d="M173 99Q185 106 199 98M176 113 181 125 195 116" stroke="#e7d8b2" strokeWidth="3" />
      <path d="M88 146 83 114 95 92 116 99 125 124 120 146Z" fill="#ad704d" />
      <path d="M89 106 81 91 99 98M109 99 120 88 120 113" fill="#cc9a61" />
      <path d="M96 116 104 112 115 120 107 130 98 127Z" fill="#e1c597" />
      <path d="M236 146 229 119 243 97 262 107 276 142Z" fill="#6f8c88" />
      <path d="M244 100 239 83 254 98 269 86 263 112" fill="#9aaba0" />
      <path d="M244 119 259 118M250 131 261 126" stroke="#e4d4ac" strokeWidth="3" />
    </>
  );
}

function EmberPlate() {
  return (
    <>
      <path d="M218 163V84C218 31 306 27 306 84V163Z" fill="#846b4e" />
      <path d="M233 160V87C233 48 292 48 292 87V160Z" fill="#102421" />
      <path
        d="M241 155C226 128 256 105 252 79 278 91 269 111 281 120 295 139 278 157 269 160Z"
        fill="#b65a36"
      />
      <path d="M251 157C245 141 265 133 264 116 281 134 276 148 269 158Z" fill="#edbd65" />
      <path
        d="M220 85H233M292 84H305M220 116H233M292 115H305M241 52 248 65M281 53 277 65"
        stroke="#b8a17a"
        strokeWidth="2"
      />
      <path d="M109 94 129 89 148 109 163 161 105 169 95 137Z" fill="#8f4935" />
      <path d="M114 95 115 77 132 74 140 91 131 102Z" fill="#ccb68b" />
      <path d="M111 82 114 70 131 66 140 77 135 87 128 77Z" fill="#222f29" />
      <path d="M111 104 102 131 119 138M138 109 155 122 175 113" stroke="#bca47c" strokeWidth="8" />
      <path d="M172 119 187 69 191 108 179 123Z" fill="#c2c8ad" />
      <path d="M165 122 185 126" stroke="#d6ab5b" strokeWidth="4" />
      <path d="M119 155 112 176M140 155 149 176" stroke="#1a2824" strokeWidth="10" />
      <path d="M61 159 74 147 90 153 86 170H65Z" fill="#c89b4b" stroke="#e4c47a" />
    </>
  );
}

function MapPlate() {
  return (
    <>
      <path d="M58 39 281 29 311 158 77 173Z" fill="#d9c69b" stroke="#a98a55" strokeWidth="2" />
      <path
        d="M77 53 113 55V90H80ZM119 54 168 51V92H120ZM175 51 219 49V88H176ZM124 99 168 98V139H127ZM176 96 221 94V134H178ZM230 96 273 92 282 131 231 133Z"
        fill="#587460"
        stroke="#334e40"
        strokeWidth="2"
      />
      <path
        d="M95 73H145V118H200V113H255M145 73H197V113"
        stroke="#e7ca84"
        strokeWidth="3"
        strokeDasharray="4 4"
      />
      <path d="M138 72 145 61 151 73 145 84Z" fill="#b15a3e" />
      <path d="M244 112 247 103 254 109 262 102 265 115Z" fill="#d5ab53" />
      <path d="M95 153 110 152M117 151 144 149M243 47 264 45M246 53 268 51" stroke="#9b8257" />
      <path
        d="M267 165 295 97 301 90 305 102 277 170Z"
        fill="#a75538"
        stroke="#552f26"
        strokeWidth="2"
      />
      <path d="M267 165 264 178 277 170Z" fill="#e5d1a0" />
      <path d="M264 178 267 170 270 174Z" fill="#243e33" />
    </>
  );
}

function PassagePlate() {
  return (
    <>
      <path d="M28 177V54L61 29 84 53V157M291 170V71L317 46 341 67V177" fill="#4a6554" />
      <path d="M40 63H71M40 83H71M305 80H330M305 100H330" stroke="#839078" strokeWidth="3" />
      <path d="M105 192 174 112H204L263 192" fill="#5c715c" />
      <path d="M139 177 174 163M159 150 197 140M192 126 207 129" stroke="#a4a582" strokeWidth="2" />
      <path d="M168 103C159 114 150 140 140 161L165 156 184 167 202 151 190 113Z" fill="#737996" />
      <path d="M176 111 174 142 184 167 202 151 190 113Z" fill="#404e6b" />
      <path d="M171 105 172 90 185 86 193 97 187 113Z" fill="#d3c2a2" />
      <path d="M165 103 170 85 184 78 195 91 195 104 182 95 172 107Z" fill="#9ca4ad" />
      <path d="M169 116 155 127 131 111M190 118 210 137 230 125" stroke="#a5a8ab" strokeWidth="6" />
      <path d="M129 112 110 81 105 61 121 75 138 108Z" fill="#e1d7b3" stroke="#85938d" />
      <path d="M126 114 140 107" stroke="#d4ad62" strokeWidth="4" />
      <path d="M163 155 158 177M186 157 194 177" stroke="#1a2b2b" strokeWidth="8" />
      <path d="M229 124V110M221 112H237L240 137H218Z" stroke="#d5b877" strokeWidth="2" />
      <path d="M224 117H234V133H224Z" fill="#e5bc69" />
      <path d="M250 155 272 141 285 155M250 160 272 146 285 160" stroke="#c07b52" strokeWidth="2" />
    </>
  );
}
