import type { ReactNode } from 'react';
import { ArtScene } from '../../../shared/art/CardArt';

const ink = '#222c2c',
  bone = '#eddbb4',
  gold = '#bc945a',
  copper = '#a46248',
  sage = '#8f9f78';
function Etch({ d, color = bone }: { d: string; color?: string }) {
  return (
    <path d={d} fill="none" stroke={color} strokeWidth=".75" strokeLinecap="round" opacity=".7" />
  );
}
const portraits: Record<string, ReactNode> = {
  forgekeeper: (
    <>
      <path d="M29 105L42 78Q54 66 67 67L110 65Q126 79 136 108Z" fill={ink} />
      <path d="M45 81L62 70 82 94 102 72 122 82 131 112H37Z" fill={copper} />
      <path d="M53 79L59 77 69 112H60ZM108 77L115 80 106 112H99Z" fill={gold} />
      <path
        d="M65 28Q82 12 102 30L109 52 101 72 86 87 67 69 60 47Z"
        fill="#d2ab80"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d="M67 52Q72 64 78 66L90 65Q97 64 102 57 106 80 89 94 73 90 67 77 63 70 64 63Z"
        fill="#c5c3ae"
      />
      <path
        d="M65 58Q70 72 76 76L80 69Q79 78 84 84 93 79 98 65 99 82 91 90 73 85 67 74Z"
        fill="#7e8b81"
      />
      <path d="M61 38Q61 16 83 15 108 17 108 41L97 35 70 38Z" fill={ink} />
      <path
        d="M61 39L63 27Q87 17 106 29L110 42 102 47 70 48Z"
        fill="#6a7c78"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path d="M63 36L106 32 108 39 66 44Z" fill={gold} />
      <path
        d="M72 48L81 47M93 46L101 45M88 47L85 58 91 59M83 65L93 63"
        stroke={ink}
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M34 96L27 47 35 45 45 94Z" fill="#684631" stroke={ink} strokeWidth="1.5" />
      <path d="M14 36L41 28 51 44 22 53 14 48Z" fill="#82928b" stroke={ink} strokeWidth="1.5" />
      <path d="M14 36L21 32 49 36 41 40 21 46Z" fill={bone} />
      <path
        d="M43 99Q27 101 27 88L26 82Q29 77 34 82L36 91 43 88Z"
        fill="#d2ab80"
        stroke={ink}
        strokeWidth="1.3"
      />
      <Etch d="M21 39L35 35M68 30L88 26M71 55L77 54M94 52L99 51M71 87L79 93M111 90L116 103M50 99L54 110" />
      <path d="M126 40Q119 28 129 22Q126 31 133 31 139 40 132 47Z" fill={gold} />
    </>
  ),
  quartermaster: (
    <>
      <path d="M31 112Q33 87 50 73L72 67 96 62 112 78 128 112Z" fill="#344d53" />
      <path d="M45 82L62 74 79 101 101 72 113 85 117 112H41Z" fill="#5d7c80" />
      <path d="M59 75L70 95 78 87 82 99 97 71 81 83Z" fill={bone} />
      <path
        d="M67 23Q84 13 98 29L100 44Q101 48 104 51 106 54 99 55L98 60Q98 67 87 73L72 65Q67 55 68 48Z"
        fill="#c69472"
        stroke={ink}
        strokeWidth="1.4"
      />
      <path
        d="M71 25Q57 31 61 48L65 62 56 69 44 65Q55 58 53 43 49 23 66 19Q75 7 94 18L101 29 87 31Z"
        fill={ink}
      />
      <path d="M57 31Q62 21 72 21M58 47Q61 59 52 63" stroke={gold} strokeWidth=".85" fill="none" />
      <path d="M70 28Q78 31 84 30L81 46 75 51 81 66 89 71 75 66 69 48Z" fill="#a96d52" />
      <path d="M89 43L97 42M96 56L101 54M90 61L98 59" stroke={ink} strokeWidth="1.1" fill="none" />
      <circle cx="75" cy="53" r="3.2" stroke={gold} strokeWidth="1.5" fill="none" />
      <g transform="rotate(-9 85 95)">
        <path d="M59 79H109V112H59Z" fill={gold} stroke={ink} strokeWidth="1.5" />
        <path d="M64 82H103V109H64Z" fill={bone} />
        <path d="M72 83V107M78 89H98M78 94H98M78 99H94" stroke={copper} strokeWidth=".8" />
      </g>
      <path d="M44 102L69 97 78 100 76 107 52 111Z" fill="#c69472" stroke={ink} strokeWidth="1.3" />
      <path d="M111 94L112 65 116 65 116 96" fill={gold} stroke={ink} />
      <path d="M113 67Q109 53 124 45L121 60Z" fill={bone} />
      <Etch d="M46 90L53 96M73 101L64 103M86 32L93 31M115 59L121 50M31 34H43M36 29V39" />
    </>
  ),
  wildspeaker: (
    <>
      <path
        d="M58 48Q36 38 42 20L37 11M45 30L25 27 20 17M41 22L53 10M102 46Q123 31 117 15M120 27L138 22 142 13M116 17L106 7"
        stroke={gold}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M23 110Q33 89 42 62 44 34 78 21 108 27 118 62 125 84 143 111Z" fill={ink} />
      <path d="M76 26Q49 44 54 63L38 110 65 99 83 112 89 73Z" fill="#526f55" />
      <path d="M80 27Q104 35 112 64L105 89 128 108 105 107 95 83Z" fill={sage} />
      <path
        d="M74 36Q94 32 103 47L101 69 88 83 72 72 64 53Z"
        fill="#c7b68f"
        stroke={ink}
        strokeWidth="1.3"
      />
      <path d="M73 38L75 59 81 68 76 76 69 69 64 53Z" fill="#8c8e6b" />
      <path
        d="M76 52L84 55M92 55L100 50M88 54L86 67 93 65M83 72L93 71"
        fill="none"
        stroke={ink}
        strokeWidth="1.4"
      />
      <path d="M81 34L91 39 101 35 105 47 96 43 89 47 79 42 66 49Z" fill={bone} />
      <path d="M61 85L80 93 103 83 96 97 82 103Z" fill={gold} />
      <path d="M29 112L33 68" stroke="#916e47" strokeWidth="4" />
      <path d="M33 71Q13 67 18 50Q32 53 33 65 38 47 51 48Q50 64 33 71Z" fill={sage} />
      <Etch d="M21 55L32 67 46 53M55 54L48 75M58 75L51 98M105 53L108 69M91 94L86 97M85 38L91 40" />
    </>
  ),
  archivist: (
    <>
      <path d="M28 112Q34 83 55 73L78 68 101 71Q122 81 132 112Z" fill="#484456" />
      <path d="M49 80L66 70 80 92 100 72 113 81 105 111H44Z" fill="#777080" />
      <path d="M62 71L66 87 79 91 92 88 99 72 80 77Z" fill={bone} />
      <path
        d="M63 25Q70 12 89 17 107 22 109 40L105 66 95 76 77 74 63 59Z"
        fill="#c59e80"
        stroke={ink}
        strokeWidth="1.2"
      />
      <path
        d="M63 50Q49 48 52 31 54 15 72 16 85 7 99 15Q117 20 112 46L104 48 99 26 84 27 75 35 69 54Z"
        fill="#b9c2b4"
      />
      <path
        d="M57 32Q67 19 80 22M91 17Q107 19 108 33M58 43L60 35"
        stroke={bone}
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M84 49L83 60 91 61M82 67L95 65M96 61L101 59"
        stroke={ink}
        strokeWidth="1"
        fill="none"
      />
      <g fill="none" stroke={gold} strokeWidth="1.2">
        <ellipse cx="77" cy="49" rx="7" ry="5" />
        <ellipse cx="97" cy="46" rx="7" ry="5" />
        <path d="M84 47L90 46M70 48L65 44" />
      </g>
      <path d="M74 49L80 48M94 46L100 45" stroke={ink} strokeWidth=".8" />
      <path
        d="M26 91Q53 80 80 94 100 82 130 91L124 111H34Z"
        fill={gold}
        stroke={ink}
        strokeWidth="1.5"
      />
      <path d="M32 89Q56 82 80 94 102 85 124 91L119 106Q98 102 80 111 58 101 37 106Z" fill={bone} />
      <path
        d="M80 94V111M42 92Q62 91 74 98M43 96Q61 94 72 102M88 98L115 94M89 102L112 99"
        stroke="#8e7554"
        strokeWidth=".7"
        fill="none"
      />
      <path
        d="M35 103Q25 99 28 91 34 88 39 92L46 100 39 104ZM119 102L118 93Q123 86 130 92 134 101 126 107Z"
        fill="#c59e80"
        stroke={ink}
        strokeWidth="1"
      />
      <Etch d="M53 86L58 91M105 86L101 90M74 58L78 60M96 54L102 52" />
    </>
  ),
  oathkeeper: (
    <>
      <path
        d="M34 112L38 80 65 66 105 64 128 78 141 112Z"
        fill="#6a7880"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path d="M41 80L62 72 67 94 47 98ZM105 71L126 81 129 97 105 92Z" fill="#b1bbae" />
      <path d="M62 77L99 70 111 99 94 112H62Z" fill="#34464c" />
      <path
        d="M68 25Q82 11 99 25L106 54 95 73 77 76 62 55Z"
        fill="#94a69f"
        stroke={ink}
        strokeWidth="1.7"
      />
      <path d="M67 30L85 21 87 62 77 71 65 54Z" fill={bone} />
      <path d="M85 21L99 27 101 40 87 46Z" fill="#bfbd9a" />
      <path d="M64 43L86 47 104 39 103 47 88 54 66 49Z" fill={ink} />
      <path d="M80 58L82 66M87 57V65M93 54L94 61" stroke={ink} strokeWidth="1.2" />
      <path d="M77 22Q69 6 84 6 106 8 111 20L96 17 86 24Z" fill={copper} />
      <path d="M41 80L73 78 77 99 66 112H46L33 102Z" fill={gold} stroke={ink} strokeWidth="1.5" />
      <path d="M43 86L67 83 70 99 61 110 48 105 40 99Z" fill="#405e56" />
      <path d="M55 88L62 94 59 104 52 102 49 94Z" fill={bone} />
      <path d="M123 30L128 39 125 102H120L120 39Z" fill={bone} stroke={ink} strokeWidth="1.3" />
      <path d="M113 92L132 93M122 94V109" stroke={gold} strokeWidth="3" />
      <Etch d="M70 32L77 28M69 53L73 61M43 83L55 79M111 78L122 84M47 96L49 100M95 88L100 99" />
    </>
  ),
};

export function HeroArt({ id }: { id: string }) {
  return (
    <ArtScene
      palette={
        id === 'archivist'
          ? 'violet'
          : id === 'wildspeaker'
            ? 'moss'
            : id === 'quartermaster'
              ? 'tide'
              : 'gold'
      }
      variant="night"
      className={`hero-art hero-art-${id}`}
    >
      {portraits[id] ?? (
        <path d="M80 23L112 43 103 85 80 100 57 85 48 43Z" fill={gold} stroke={bone} />
      )}
    </ArtScene>
  );
}

export function HeroPowerArt({ id }: { id: string }) {
  return (
    <svg
      className="hero-power-art"
      data-hero-power={id}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      {id === 'forgekeeper' ? (
        <>
          <path
            d="M8 31H56L46 41H36L40 50H47V55H17V50H24L27 41H17Z"
            fill={gold}
            stroke={ink}
            strokeWidth="1.8"
          />
          <path d="M27 9L42 5 47 15 31 21Z" fill={bone} stroke={ink} strokeWidth="1.5" />
          <path d="M34 19L25 35" stroke={copper} strokeWidth="5" />
          <Etch d="M13 34H49M22 53H41M48 23L53 20M47 28H55" />
        </>
      ) : id === 'quartermaster' ? (
        <>
          <path
            d="M21 16L16 8Q32 15 48 8L43 18C47 31 56 38 52 49 48 58 15 58 11 49 7 39 19 30 21 16Z"
            fill={copper}
            stroke={ink}
            strokeWidth="1.6"
          />
          <path d="M21 19Q32 24 43 19M22 27Q16 40 18 47" stroke={bone} strokeWidth="1.5" />
          <ellipse cx="34" cy="39" rx="10" ry="11" fill={gold} stroke={ink} />
          <path d="M34 32V46M30 34H37M30 44H37" stroke={ink} />
        </>
      ) : id === 'wildspeaker' ? (
        <>
          <path
            d="M16 42C34 42 41 31 41 10L53 13C53 43 38 54 17 53Z"
            fill={bone}
            stroke={ink}
            strokeWidth="1.7"
          />
          <path d="M40 16L52 19M38 26L50 31M31 39L39 48" stroke={gold} strokeWidth="2" />
          <path
            d="M13 44Q4 31 12 23 24 28 20 40 23 29 34 29 33 43 18 47Z"
            fill={sage}
            stroke={ink}
          />
          <Etch d="M12 28L17 43M21 41L29 34" />
        </>
      ) : id === 'archivist' ? (
        <>
          <path
            d="M9 28Q20 21 32 28 44 21 55 28V51Q42 46 32 54 20 47 9 51Z"
            fill={bone}
            stroke={ink}
            strokeWidth="1.6"
          />
          <path d="M32 29V53M14 33L26 35M38 35L50 33M14 40L26 42M38 42L50 40" stroke={gold} />
          <path d="M46 19A17 17 0 0 0 18 15" stroke={gold} strokeWidth="3" />
          <path d="M18 6L15 20 29 17Z" fill={gold} stroke={ink} />
        </>
      ) : (
        <>
          <path
            d="M32 7L53 16 49 40Q44 52 32 58 19 52 15 40L11 16Z"
            fill={gold}
            stroke={ink}
            strokeWidth="1.7"
          />
          <path d="M32 14L46 21 43 38Q40 46 32 51 24 46 21 38L18 21Z" fill="#47685c" />
          <path d="M32 19V45M22 28L32 34 42 28" stroke={bone} strokeWidth="2.2" />
        </>
      )}
    </svg>
  );
}
