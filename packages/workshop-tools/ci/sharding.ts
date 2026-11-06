// Relative seconds from successful main run 42155222936 (2026-11-06).
// Hints affect scheduling only. Unknown/new journeys receive a conservative default.
export const browserSeconds: Record<string, number> = {
  'tests/browser/art-export.spec.ts': 7.3,
  'tests/browser/art3d.spec.ts': 107.5,
  'tests/browser/artwork.spec.ts': 15.2,
  'tests/browser/asset-gallery.spec.ts': 4.4,
  'tests/browser/battlegrounds.spec.ts': 13.1,
  'tests/browser/blindside-consumables.spec.ts': 2.0,
  'tests/browser/blindside-feedback.spec.ts': 4.6,
  'tests/browser/blindside-policy.spec.ts': 7.2,
  'tests/browser/cartographer-cues.spec.ts': 3.0,
  'tests/browser/cartographer-inhabitants.spec.ts': 6.4,
  'tests/browser/cartographer-policy.spec.ts': 8.0,
  'tests/browser/cartographer.spec.ts': 20.5,
  'tests/browser/challenge-art.spec.ts': 9.6,
  'tests/browser/challenges.spec.ts': 24.2,
  'tests/browser/diablo2.spec.ts': 50.9,
  'tests/browser/emberwake-crypt.spec.ts': 4.4,
  'tests/browser/emberwake-frost.spec.ts': 4.3,
  'tests/browser/emberwake-policy.spec.ts': 39.1,
  'tests/browser/engine.spec.ts': 5.4,
  'tests/browser/expansion.spec.ts': 8.8,
  'tests/browser/feature-art.spec.ts': 11.0,
  'tests/browser/game-guide.spec.ts': 18.1,
  'tests/browser/generated-dungeon.spec.ts': 3.6,
  'tests/browser/golden-claw.spec.ts': 2.6,
  'tests/browser/hearth-arena.spec.ts': 9.7,
  'tests/browser/hearth-drake.spec.ts': 5.3,
  'tests/browser/hearth-elementals.spec.ts': 7.7,
  'tests/browser/hearth-policy.spec.ts': 6.9,
  'tests/browser/hearth-shield.spec.ts': 3.9,
  'tests/browser/lantern-keep.spec.ts': 5.6,
  'tests/browser/lifecycle.spec.ts': 6.2,
  'tests/browser/native-assets.spec.ts': 48.6,
  'tests/browser/night-market.spec.ts': 10.6,
  'tests/browser/night-passage-agent.spec.ts': 103.7,
  'tests/browser/night-passage-audio.spec.ts': 5.4,
  'tests/browser/night-passage-rollout.spec.ts': 68.2,
  'tests/browser/night-passage-scene.spec.ts': 48.3,
  'tests/browser/night-passage-threats.spec.ts': 4.2,
  'tests/browser/night-passage.spec.ts': 121.0,
  'tests/browser/policy-layout.spec.ts': 13.7,
  'tests/browser/recruitment-inspector.spec.ts': 3.2,
  'tests/browser/replay-import.spec.ts': 8.3,
  'tests/browser/scrapyard.spec.ts': 98.4,
  'tests/browser/shell.spec.ts': 20.3,
  'tests/browser/spire-city-art.spec.ts': 10.5,
  'tests/browser/spire-constructs.spec.ts': 6.4,
  'tests/browser/spire-policy.spec.ts': 3.6,
  'tests/browser/spire.spec.ts': 33.2,
  'tests/browser/study-capture-failure.spec.ts': 21.0,
  'tests/browser/study-delivery.spec.ts': 6.3,
  'tests/browser/study-loading.spec.ts': 63.0,
  'tests/browser/study-mount-failure.spec.ts': 10.3,
  'tests/browser/study-recording-resize.spec.ts': 33.1,
  'tests/browser/tavern-spells.spec.ts': 9.3,
  'tests/browser/workshop.spec.ts': 12.6,
};

/** Longest-first packing keeps complete files together and each selected file runs once. */
export function browserGroups(files: string[], count: number): string[][] {
  const groups = Array.from({ length: count }, () => [] as string[]);
  const totals = Array<number>(count).fill(0);
  for (const file of [...files].sort(
    (a, b) => (browserSeconds[b] ?? 60) - (browserSeconds[a] ?? 60) || a.localeCompare(b),
  )) {
    const index = totals.indexOf(Math.min(...totals));
    groups[index].push(file);
    totals[index] += browserSeconds[file] ?? 60;
  }
  return groups.map((group) => group.sort());
}
