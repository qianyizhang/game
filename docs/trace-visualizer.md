# Creation trace visualizer

A local, read-only tool for understanding how an artifact was made. It is separate from the game application and does not change game state.

The case follows **Showcase 3D asset examples**, **Refine Sol’s work and style guide**, and **Refine Hydra 3D model**, plus three delegated Sol makers. Its 23 stages connect the initial sculptures, five audit rounds, rejection, a living Hydra with positive user feedback, four guided rounds per bird, explicit parent takeovers, and reloaded-export verification. The two bird tracks overlap; paired round stages summarize each track without inventing exact interleaving.

## Open and rebuild

The generated example is `test-results/trace-visualizer/index.html`. Open it directly in a browser, or use the normal development server and visit `/test-results/trace-visualizer/index.html`. The HTML and adjacent `assets/` work offline; no external service is required.

```sh
node scripts/trace-visualizer/build.mjs
npm run test:trace
npm run test:browser -- tests/browser/trace-visualizer.spec.ts --output test-results/trace-visualizer-checks
```

On macOS, run the browser command with approved execution outside the restricted sandbox, as required by `AGENTS.md`. It uses the repository's startup guard and disposable profiles. The separate output directory preserves previous artwork evidence. These three case-specific browser tests rebuild the bundle first and skip explicitly when the local thread exports are absent; the normalizer tests require no private evidence and run as part of `npm run check`.

The builder takes three optional positional arguments:

```sh
node scripts/trace-visualizer/build.mjs INPUT_DIRECTORY OUTPUT_DIRECTORY CASE_STUDY_JSON
```

Input files are `<thread-id>.json` exports from Codex's `read_thread` tool with `includeOutputs: true`. They use `schemaVersion: 1`, a `thread` object, and a `turns` array. Collect every page, combine its turns once, and set `page.hasMore` to false only after collecting all pages. The builder refuses incomplete paginated input. The exported inputs used for this example are retained locally under `test-results/trace-visualizer-input/`; they are not committed. Recreating the example in another checkout requires those authorized exports and the referenced evidence folders.

## Views

- **Creation story:** a curated explanation with exact statement anchors and links to the source chat. Earlier reviewer acceptance remains visible alongside the later user rejection.
- **Compare revisions:** saved captures of the same subject, selectable by revision and camera view, including enlarged captures and live/exported material pairs where retained. A stage subject selector lets the joint bird rounds show either subject. Missing captures remain explicit; no new historical image is synthesized.
- **Recorded actions:** visible messages, commands, available outputs, image inspections, reference lookups, delegation and patches. Search includes command output. Commands are inert text.
- **Source & provenance:** full retained source and diffs against the previous available snapshot of the same filename, thread roles, collected guidance documents and a SHA-256 manifest.

## Add another creation story

Copy `scripts/trace-visualizer/case-study.json`. Set the title, exact source thread IDs, roles and optional parent relationship. Each stage points to an existing turn ID and optionally an exact substring of a visible statement as its anchor. Without an explicit anchor, the last visible agent message in that turn is used. The builder fails when a turn or anchor is missing.

Write stage `question`, `change`, `finding` and `lesson` as interpretations supported by those records. Keep decisions attributable: an agent's acceptance is not user approval. `capture` and optional `fallbackCapture` identify evidence directories under `test-results/`; `source` identifies an optional retained source directory. Use `captures` and `sources` arrays for paired review tracks. Optional `sourceFiles` restricts those snapshots to named owned files, avoiding ambiguous comparisons between concurrent shared files. Optional `captureSubjects` restricts a delivery folder to the subject described by the stage; `subject` selects its initial preview. Captures use `<subject>-hero.png`, `-frame.png` or `-desktop.png`, and `-side.png`, `-back.png`, `-large.png`, `-roundtrip-live.png` or `-roundtrip-exported.png`. The current case adapter recognizes Hydra, Nightjar, Spiral, Vajra, Phoenix and Catalyst; edit the subject list in the builder and viewer for other subjects. The trace normalizer is independent of that artwork adapter.

## Limits and preservation

- The living Hydra received positive user feedback; final user approval of the two birds is not recorded. Both final birds have mixed authorship after parent takeover.
- The story is authored interpretation, not recovered private reasoning. Reasoning records and ambient browser context are excluded.
- Order is exact within the exported turn; the API does not provide per-event timestamps. Overlapping maker/reviewer turns are grouped, with no invented event-level chronology. Incoming delegation prompts may be absent from the export.
- Source exports may truncate commands, outputs and patches. Labels preserve known truncation. Shell writes appear under commands; the patch filter is not a complete file-change log.
- The input capture bounds long command text to 16,000 characters and outputs to the tool limit. The tool's excerpts are not a full transcript backup.
- Assets and source snapshots are read from existing evidence folders. Their current hashes identify the collected bytes, not proof of immutability since the historical review. Source snapshots do not prove an exact source-to-image pairing. No intermediate revision is re-executed.
- Comparisons may differ in camera or lighting. Browser and unit results quoted in the story are historical records, not fresh verification of the artwork.
- Generated HTML contains conversation excerpts. Inputs, rendered bundles and copied media stay under ignored `test-results/`. Nothing is uploaded. The small reusable viewer, builder and case interpretation can be versioned independently.
- The collector only attaches evidence inside this repository and resolves symlinks before reading. Rebuilds overwrite generated `index.html` and `manifest.json`, but never delete existing evidence or modify the models.
