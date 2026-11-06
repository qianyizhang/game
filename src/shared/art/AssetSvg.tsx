import { useId, type SVGProps } from 'react';
import { selectedArt, type ArtSelection } from './selection';
export { selectedArt } from './selection';

/** Keep inherited inks and native vector paths, while making paint IDs unique per instance. */
export function SelectedArtContent({
  selection,
  width = '100%',
  height = '100%',
}: {
  selection: ArtSelection;
  width?: string;
  height?: string;
}) {
  const prefix = useId().replace(/[^\w-]/g, '_');
  const ids = new Map(
    [...selection.svg.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => [
      match[1],
      `${prefix}-${match[1]}`,
    ]),
  );
  let svg = selection.svg.replace(/<\?xml[^>]*>/, '').trim();
  if (/^<svg\b[^>]*\/>$/.test(svg)) svg = svg.replace(/\/>$/, '></svg>');
  svg = svg.replace(
    /\bid=(["'])([^"']+)\1/g,
    (_: string, quote: string, id: string) => `id=${quote}${ids.get(id)!}${quote}`,
  );
  svg = svg.replace(
    /url\((["']?)#([^)'"\s]+)\1\)/g,
    (_: string, quote: string, id: string) => `url(${quote}#${ids.get(id) ?? id}${quote})`,
  );
  svg = svg.replace(
    /^<svg\b([^>]*)>/,
    (_: string, attributes: string) =>
      `<svg${attributes.replace(/\s(?:class|width|height|x|y)=(["']).*?\1/g, '')} x="0" y="0" width="${width}" height="${height}">`,
  );
  // Only the static local-resource SVG subset admitted by the history store reaches this boundary.
  return <g data-art-selection={selection.revision} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Preserve the consumer's layout, labels and gameplay-facing semantics. */
export function AssetSvg({
  assetId,
  children,
  ...props
}: SVGProps<SVGSVGElement> & { assetId?: string }) {
  const selection = selectedArt(assetId);
  return (
    <svg {...props} data-art-asset={assetId} data-art-selection={selection?.revision}>
      {selection ? <SelectedArtContent selection={selection} /> : children}
    </svg>
  );
}
