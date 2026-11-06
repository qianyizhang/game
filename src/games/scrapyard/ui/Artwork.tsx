import { ART, type ArtId } from './art-data';

/** The catalogue and HTML choices use the same editable vectors and fit as Canvas sprites. */
export function ScrapArt({ id }: { id: ArtId }) {
  const art = ART[id];
  const [x, y, width, height] = art.viewBox;
  const scale = Math.min(art.width / width, art.height / height);
  const left = (art.width - width * scale) / 2;
  const top = (art.height - height * scale) / 2;
  return (
    <svg viewBox={`0 0 ${art.width} ${art.height}`} aria-hidden="true" focusable="false">
      <g transform={`translate(${left} ${top}) scale(${scale}) translate(${-x} ${-y})`}>
        {art.paths.map((path, index) => (
          <path
            key={index}
            d={path.d}
            fill={path.fill}
            stroke={path.stroke}
            strokeWidth={path.strokeWidth}
            strokeLinejoin={path.lineJoin}
            strokeLinecap={path.lineCap}
          />
        ))}
      </g>
    </svg>
  );
}
