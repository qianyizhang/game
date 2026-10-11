# Copper fox

Copper is a new stylized woodland fox, delivered only in the DCC workbench:
`/?workbench=dcc&compare=fox`. It preserves the existing canid and gallery defaults.

## Saved sources

- `motion.blend` owns five editable control actions: alert breath (3.6 s), quiet walk
  (0.8 s), light trot (0.5 s), listen (3.2 s), and ground scent (4 s).
- `fox/source.blend` owns the connected sculpt, regional pigment, fitted face and ear
  pieces, skin weights, control rig and derived character actions.
- `fox/retarget.json` records proportion fitting and the unchanged mesh/weight digest.
- `../../assets/fox/fox.glb` is baked deformation delivery; adjacent receipts pin source,
  motion, exporter and contact evidence. Pose arrays are temporary verification data.

The character has a narrow wedge muzzle, tall cupped ears, light ribcage, dark stockings
and full cream-tipped brush. Native refinements fitted lip widths, closed ear apexes and
removed outer-leg pigment bands. The saved source is authoritative; a recipe reconstruction
is a new candidate, not an instruction to overwrite this character.

## Commands

Use the pinned Node runtime. Native and browser commands require approved execution on
this Mac; ordinary validation stays sandboxed.

```sh
npm run dcc:fox -- check
npm run dcc:fox -- bootstrap --root test-results/fox-candidate
npm run dcc:fox -- fit --root test-results/fox-candidate
npm run dcc:fox -- export --root test-results/fox-candidate --output test-results/fox-export
npm run dcc:fox -- review --output test-results/fox-review --clip sniff --frame 120
npm run dcc:fox -- verify --output test-results/fox-native
FOX_NATIVE_RESULTS=test-results/fox-native npm run test:browser -- tests/browser/fox.spec.ts
FOX_REVIEW_FRAMES=1 npm run test:browser -- tests/browser/fox.spec.ts
```

Outputs must be fresh. `verify` copies the sources, edits the saved scenting head control,
saves/reloads, fits without remeshing, exports, and samples original/edited poses. The
browser compares both deliveries against fresh native samples and requires a visible
geometric change from the edit. Remove temporary pose arrays only after a successful
agreement run; keep its compact report. `FOX_REVIEW_FRAMES` records actual 1× canvas
playback, frame-clock traces and phase images; these support visual review, not an
automatic aesthetic verdict.

## Extension boundary

The [canid recipes](../canid/authoring/README.md) contain the fox construction adapter,
fox anatomy, pigment and edit proof. Fox uses the refined family's saved controls and
proportion-aware fitting rather than regenerating a gait during export. The listening
revision rescales saved controls and their contact/marker timing together. Ground scent
is a new saved performance with four planted paws.

`MotionStudy` in `src/canid-assets.ts` supplies character assets, motion metadata, source
links and optional camera framing to the existing player. It contains no species rules.
`verifyCanid` and the native sampler accept explicit character IDs while retaining the
three-character defaults. The fox CLI is a short explicit adapter over native operations.

For a boar or bird, reuse the saved-source, motion-contract, baked playback, evidence and
fresh-output boundaries. Choose anatomy, skeleton, controls and support sites for that
species; do not force a canid shoulder, paw probes or gait onto an unsuitable animal.
A different skeleton needs its own native fitting/export adapter. The viewer consumes
baked clips independently of how those were authored.

## Visual review boundary

The campaign owner performs construction and visual self-review. This is not independent
review, motion capture or biomechanical validation. Native contact measurements are in
model units, not calibrated metres. Retained selected consumer images and 1× recordings
are under `assets/fox/evidence/`; the [visual record](../../assets/fox/visual-review.json)
identifies inspected views, motion judgments, repairs and limits separately from technical checks.
