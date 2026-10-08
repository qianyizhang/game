/** Browser contract for the build-selected delivery module. No authoring paths or Node APIs. */
export interface PublishedBrief {
  id: string;
  title: string;
  subtitle: string;
  interpretation: string;
  gesture: string;
  polish: string[];
  palette: { name: string; color: string }[];
  nativeFeatures: string[];
  animation?: { name: string; seconds: number; fps: number };
  budgets: { maxBytes: number; maxTriangles: number; maxJoints: number };
  reference: string;
  reviewStatus: string;
}
export interface PublishedStats {
  bytes: number;
  triangles: number;
  meshes: number;
  materials: number;
  textures: number;
  joints: number;
  animations: { name?: string; seconds: number; channels: number }[];
}
export interface PublishedAssetInfo {
  kind: 'release' | 'legacy';
  receiptDigest: string;
  modelSha256: string;
  blender: string;
  stats: PublishedStats;
  reviewScope?: 'workbench' | 'gallery';
  reviewDecision?: 'accepted' | 'rejected';
}
export interface PublishedPoseSamples {
  space: 'glTF world, Y up';
  samples: { seconds: number; points: [number, number, number][] }[];
}
export interface PublishedSavedPoseSamples {
  schemaVersion: 1;
  id: string;
  space: 'glTF world, Y up';
  objects: { name: string; role: 'skinned' | 'rigid'; vertexCount: number }[];
  samples: {
    seconds: number;
    objects: { name: string; points: [number, number, number][] }[];
  }[];
}
export interface PublishedAsset {
  id: string;
  legacyStudyId: string;
  brief: PublishedBrief;
  info: PublishedAssetInfo;
  modelUrl: string;
  sourceUrl: string;
  posesUrl?: string;
}
