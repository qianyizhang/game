import { assets } from 'virtual:card-workshop-dcc';
import type { PublishedAsset } from './delivery-types';

export type {
  PublishedAsset,
  PublishedAssetInfo,
  PublishedBrief,
  PublishedPoseSamples,
  PublishedSavedPoseSamples,
  PublishedStats,
} from './delivery-types';

export function getPublishedAsset(id: string): PublishedAsset {
  if (!Object.hasOwn(assets, id)) throw new Error(`No published asset: ${id}`);
  return assets[id];
}

export function listPublishedAssets(): PublishedAsset[] {
  return Object.values(assets).sort((left, right) => left.id.localeCompare(right.id));
}
