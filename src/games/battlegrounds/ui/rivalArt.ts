import type { RivalStyle } from '../domain/arena';
import type { WorkshopSymbolKind } from '../../../shared/art/WorkshopArt';

const symbols: Record<RivalStyle, WorkshopSymbolKind> = {
  'baseline-v1': 'classic',
  'tempo-v1': 'tempo',
  'economy-v1': 'economy',
  'composition-v1': 'composition',
};

export const rivalArtKind = (style: RivalStyle): WorkshopSymbolKind => symbols[style];
