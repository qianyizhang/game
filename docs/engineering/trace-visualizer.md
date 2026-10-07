# Creation trace behavior debugger

A local, read-only viewer for following how Codex changed an artifact in response to feedback. The existing creation story, saved captures, source snapshots and raw actions remain connected in one offline HTML bundle. Commands are inert text; the viewer does not run models, upload traces or alter game state.

## Build and open

```sh
npm run trace:build
npm run test:trace
npm run check
npm run test:browser -- tests/browser/trace-visualizer.spec.ts --output test-results/trace-visualizer-checks
```

The command reports the new bundle path as JSON. Open that `index.html` directly, or visit its repository-relative URL through the development server. Each default build uses a fresh `test-results/trace-visualizer-<id>/` directory. Keep its adjacent `assets/` and `manifest.json`. The lean cleanup retained one rebuilt local preview at `test-results/trace-visualizer-current/`; older generated copies were retired while original inputs were preserved. Browser tests on macOS require approved execution outside the restricted sandbox, with the existing startup guard and disposable profiles (`AGENTS.md`).

The six private thread exports and historical artwork are already retained locally for this case. They are not committed. Case-specific browser tests skip explicitly when exports are absent; synthetic browser tests and all model tests work without private history. Tests use a separate output directory to preserve historical captures.

Optional positional arguments:

```sh
npm run trace:build -- INPUT_DIRECTORY NEW_OUTPUT_DIRECTORY CASE_STUDY_JSON
```

Arguments resolve from the repository root, independent of the invoking directory. An explicit output directory must be new, inside that root and disjoint from input. Existing output and symlinked output parents are refused. A failed build removes only the fresh directory created by that invocation; previous evidence is preserved. Use `npm run trace:build` or invoke `packages/workshop-tools/trace/build.ts` directly.

The maintained implementation, typed contracts, template and case recipe live in `packages/workshop-tools/trace/`. Node 24 executes its build modules directly. The separately typed viewer runtime is checked against the builder output and DOM elements, then emitted into the standalone HTML with the pinned TypeScript compiler. The tools package enforces strict TypeScript and typed ESLint for both sides. Missing turn timestamps stay unknown.

Input files are `<thread-id>.json` exports of `read_thread` with `includeOutputs: true`, `schemaVersion: 1`, a `thread` object and `turns`. Collect all pages, combine turns once, then set `page.hasMore` to false. Incomplete pagination and duplicate identities fail the build. Keep private input and output under ignored `test-results/`; do not publish the generated HTML.

## Model and evidence boundaries

```text
Source trace → normalized events → episode evidence
                                   ↓
                           artifact revisions
                                   ↓
                              assessments → authored story
```

| Layer             | Authority and contents                                                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source            | The collected export, identified by SHA-256. It may already omit or truncate history.                                                                                                                       |
| Normalized trace  | `ReadThreadExportAdapter` preserves observable messages, commands, outputs, patches, images, references and delegation. It adds no behavioral interpretation.                                               |
| Episode           | Curated request/work/inspection/assessment cycle; stored as `stages` for compatibility. Exact evidence can span threads and turns.                                                                          |
| Artifact revision | Stable episode/subject identity, retained capture angles and hashes, optional subject-specific sources, associated production and inspection refs. Association is not proof of exact source/render pairing. |
| Assessment        | Authored criterion, subject, status, assessor, basis, evidence and limits attached to an artifact revision.                                                                                                 |
| Story             | Existing question/change/finding/lesson prose. This is interpretation, not recovered private reasoning.                                                                                                     |

The sculpture case retains 23 episodes: early sculptures, five delegated review rounds, export repair, user rejection, living Hydra, four paired bird rounds, parent finishing and delivery. No historical conclusions were replaced by test results. Living Hydra received positive user feedback; final bird user approval is unrecorded. Both birds have mixed authorship.

## Investigate a revision

- **Creation story:** select an episode, read the request and finding, compare retained artifacts, then inspect the local evidence rows. Ownership names the worker and parent contributions. Counts describe only the selected records; “patch records” and paths do not count shell-based writes. Multi-thread episodes explicitly lack exact global interleaving.
- **Evidence drawer:** open a record or assessment without leaving the artifact. Expand recorded output separately, inspect available full normalized text, open its exact recorded action or source chat, and inspect retained source/diffs. Escape closes the drawer and returns keyboard focus. Episode and event identities are stored in the URL fragment, so reloading a deep link preserves context.
- **Compare revisions:** choose subject, view and before/after revision. The criterion matrix shows only authored assessments; no values carry forward. Multiple assessments may occupy one cell, for example an export failure followed by a pass. Each populated cell opens its assessor, basis, artifact identity, evidence and limits. `—` means no assessment attached.
- **Recorded actions:** search available text/output, filter by thread, turn, episode or episode evidence role. Green edges mark records referenced by the current episode; the selected exact record is highlighted. Current artifact context stays beside the list on desktop. Pagination limits the visible record count.
- **Source & provenance:** inspect snapshots and diffs by stable source key, actor relationships, source adapter/schema metadata, coverage, documents and SHA-256 manifest. Unknown event types retain identities here, without exposing their payloads.

Inspection signals are authored prompts to investigate, each with evidence. The case includes later user rejection and parent takeover. They are not automatically inferred root causes or claims about private cognition.

## Add a case or episode

Copy `packages/workshop-tools/trace/case-study.json`. Declare source thread IDs, display roles and optional parent IDs. Use a stable episode `id`; `thread` and `turn` identify its statement anchor. Prefer an exact `anchorRef`; the older visible-statement substring `anchor` remains supported. Missing and ambiguous anchors fail clearly.

Every episode must provide an `evidence` array. An empty array is permitted when only its statement anchor is available; the builder includes that anchor. References identify an observable normalized event, not an ordinal guessed from a screenshot:

```json
{
  "thread": "worker-thread-id",
  "turn": "source-turn-id",
  "event": "recorded-event-id",
  "role": "inspection"
}
```

Use `request`, `feedback`, `plan`, `action`, `edit`, `artifact`, `inspection`, `verification`, `assessment`, `handoff` or `other`. An event can have multiple roles. Repeated references merge into one evidence row. Unknown threads, turns, events, excluded records and invalid roles fail the build. Inspect the normalized JSON embedded in the generated HTML or use `normalizeThread` when authoring refs; IDs from the export remain unchanged. Missing source IDs use a deterministic turn/ordinal fallback, stable for the same collected input.

`actors` are explicit case annotations with `threadId`, `role`, optional `contribution` and `evidence`. Roles are `requester`, `maker`, `reviewer`, `parent`, `delegated_worker`, `verifier`. Do not infer ownership from model names or the final reporting thread. All delegation `relatedThreads` survive normalization, including uncollected receivers; the latter have no invented event history.

## Attach artifacts and source history

`capture`, `fallbackCapture`, `captures`, `source` and `sources` identify retained directories below `test-results/`. `captureSubjects` and `sourceFiles` restrict collection. Capture names are `<subject>-hero.png`, `-frame.png` or `-desktop.png`, plus `-side.png`, `-back.png`, `-large.png`, `-roundtrip-live.png`, `-roundtrip-exported.png`. Missing captures remain explicit. The current artwork adapter's default subjects are Hydra, Nightjar, Spiral, Vajra, Phoenix and Catalyst; `captureSubjects` supports other cases.

Source identity defaults to the repository-relative path, never the basename. For intentionally related snapshots, set an explicit full-path mapping in case or episode `sourceKeys`:

```json
{
  "sourceKeys": {
    "test-results/round1/source/nightjar.ts": "nightjar-model",
    "test-results/round2/source/nightjar.ts": "nightjar-model"
  },
  "sourceSubjects": { "nightjar-model": "nightjar" }
}
```

An episode-level `sourceKey` also works for one source. Two collected sources in the same episode cannot share a key. Different stages may deliberately reuse that logical key. Paths and keys remain separate; the diff compares the previous retained snapshot for the key. A diff can cover multiple edits. The collector checks repository containment and real paths before reading evidence.

Artifact records are generated per episode/subject with IDs such as `episode-20:nightjar`. Subjects can also be declared with `subjects` or `subject` when captures are missing. Optional episode `artifactEvidence[subject]` contains `producedBy` and `inspectedBy` reference arrays. Attach only established associations. Optional `artifactProvenance[subject]` can carry a retained `sourceArtifactId`, `buildReceipt`, camera/lighting knowledge or source pairing statement; do not upgrade unknown provenance without evidence. Hashes identify collected bytes, not historical immutability.

Document references accept a repository-relative string (collect current bytes) or `{ "path": "docs/review.md", "revision": "<full-40-character-commit-hash>" }` (collect a regular Git blob at that local commit). Pinned references retain the original text even after its file is edited or moved. Missing commits/files, symbolic refs and symlinks fail; there is no fallback to current content and no network fetch. The document and manifest record its revision and SHA-256. A pinned collection version does not establish the document version at every historical episode. The sculpture recipe pins its four art documents before their documentation migration; existing bundles remain untouched.

## Add assessments

An episode's `assessments` array contains objects like:

```json
{
  "criterion": "wing construction",
  "subject": "nightjar",
  "assessment": "issue",
  "actor": "Parent reviewer",
  "basis": "reviewer",
  "evidence": [
    { "thread": "parent-id", "turn": "turn-id", "event": "review-id", "role": "assessment" }
  ],
  "note": "Folded wing reads as a leaf-like slab; exact source pairing unknown."
}
```

Statuses: `issue`, `improved`, `passed`, `accepted`, `rejected`, `not_checked`, `unresolved`, `unknown`, `unrecorded`. Basis: `reviewer`, `user`, `verification`, `maker`, `record_limit`. The builder validates references and attaches the episode/subject artifact. Only explicit absence statuses (`unknown`, `unrecorded`, `not_checked`) may have no event, and require a limit note. Missing cells are not automatically turned into “not checked.” Use the same criterion spelling across revisions. An attempted change, passing check, reviewer acceptance and user approval remain different claims.

## Coverage and remaining limits

- Normalized, unsupported and intentionally excluded counts reconcile to total source items. Unsupported types retain type/count and thread/turn/event/ordinal identity; their raw payload is not displayed. Private reasoning and ambient browser context are deliberately excluded, separately from unsupported types. Zero unsupported records does not establish a complete historical transcript.
- `sourceTruncated` reflects explicit upstream flags. `displayTruncated` means only the viewer preview is shortened; full available normalized text remains embedded. Expanding cannot recover text absent from the export. The historical collector bounded some commands at 16,000 characters; unflagged upstream loss cannot be detected retrospectively.
- Turn timing and within-turn ordinals are retained. Cross-thread event timestamps and exact concurrent interleaving are unavailable. Grouped records are not a precise multi-agent timeline; incoming handoff prompts may be absent.
- Source snapshots and saved captures are collected as they exist now. Camera/lighting differences and unknown source-to-render pairing remain visible. No missing historical artifact is reconstructed or re-executed.
- Technical checks quoted in the story are historical evidence, not fresh verification of aesthetic quality. New viewer tests verify navigation, evidence integrity and rendering behavior only.
- `normalize.ts` owns the explicit source adapter boundary. A future adapter should emit the same observable events, identity and coverage fields with its own source format/version; the viewer need not parse raw logs. No universal trace parser, backend or external observability service is involved.

## Design acceptance and scope

The default investigation follows an artifact through a request, consequential action, inspected result and assessment. Story, Compare, Actions and Provenance keep that context available while disclosing exact records on demand. A useful revision lets the reader identify the trigger, before/after evidence, contributing actions, inspection, criterion, assessor and next owner, then open the supporting event without reading the entire log. Missing coverage and unknown source/render pairings stay visible.

The earlier design handoff drew conceptual inspiration from PAIR agent-trace-vis (overview/detail and semantic lanes), TraceView (consequential relationships) and trajectory products such as Braintrust/LangSmith (semantic paths back to raw evidence). These are design references, not dependencies or verified product comparisons. The maintained system remains offline, local and read-only, with authored assessments rather than automatic root-cause claims. Backend services, accounts, private-trace uploads, inferred private reasoning, fabricated timestamps and reconstructed historical artifacts are outside its scope.

The superseded 1,279-line handoff is preserved at Git `85462d4924c79328723ca6c30a2d32a3e12d568e:docs/viz.md`; [the document migration record](../../maintenance/document-migration.json) pins its exact bytes. This operational guide owns current behavior. Source/model tests, synthetic browser cases and available private-case integration verify separate boundaries; absent private inputs do not establish private-case coverage.
