# Handoff: Revise the `game` creation trace visualizer into a Codex behavior debugger

## Goal

Revise the existing creation trace visualizer in:

```text
qianyizhang/game
```

so it remains good at telling the curated **creation story**, but becomes substantially better for **understanding Codex behavior**.

The intended workflow is not generic LLM observability.

The tool should help answer:

```text
What was requested?
        ↓
What did Codex actually try?
        ↓
What artifact/revision did that produce?
        ↓
What did Codex inspect or verify?
        ↓
What problem was observed?
        ↓
What did it change next?
        ↓
Did the revision actually address the feedback?
```

Think of this as an **artifact-centered behavior debugger**, backed by trace evidence.

Do not turn it into a generic span viewer.

---

# 1. Preserve what already works

The existing visualizer has several strong ideas that should remain first-class:

- `Creation story`
- `Compare revisions`
- `Recorded actions`
- `Source & provenance`
- offline/local rendering
- read-only behavior
- explicit evidence limits
- saved visual captures
- retained source snapshots and diffs
- provenance hashes
- exact source-chat anchors
- distinction between reviewer acceptance and user approval
- explicit handling of missing historical evidence
- exclusion of private reasoning

Do not replace these with a new dashboard or observability UI.

The main task is to **connect these existing views more tightly**.

---

# 2. Current conceptual problem

At present the strongest unit is roughly:

```text
Stage
 ├─ authored question
 ├─ authored change
 ├─ authored finding
 ├─ authored lesson
 ├─ one statement anchor
 ├─ associated turn
 ├─ captures
 └─ source snapshots
```

This is good for a retrospective story.

It is weaker for investigation because a stage often links to an entire turn rather than the **specific actions that support the stage**.

Multiple conceptual rounds may occur in the same Codex turn.

The reader therefore has to manually search through:

```text
messages
commands
outputs
patches
image inspections
delegation
```

to reconstruct why the authored finding is justified.

The revised model should make the central unit an **episode backed by explicit evidence**.

---

# 3. Introduce an `Episode` concept

You may retain the current `stages` name on disk initially if avoiding migration is useful, but conceptually model each stage as an episode.

An episode represents:

> one meaningful request → work → artifact → inspection → assessment cycle.

Suggested shape:

```ts
type Episode = {
  id: string;
  title: string;
  status: string;

  question: string;
  change: string;
  finding: string;
  lesson?: string;

  // Existing evidence anchor.
  anchor: EvidenceRef;

  // NEW: exact trace evidence associated with the episode.
  evidence: EvidenceRef[];

  // Existing or improved artifact evidence.
  artifacts?: ArtifactRevisionRef[];

  // NEW: structured assessments.
  assessments?: Assessment[];

  // NEW: ownership / delegation state.
  actors?: EpisodeActor[];

  // Existing caveats or explicit limits.
  limits?: string[];
};
```

Do not over-engineer this into a large domain model.

Use plain typed objects and validation sufficient to fail early on malformed case-study data.

---

# 4. Add explicit event-level evidence references

This is the highest-priority change.

Today a stage points to a turn plus an optional statement substring.

Add the ability to explicitly associate individual trace events with an episode.

For example:

```json
{
  "title": "Bird round 3 · texture is judged in pixels",
  "turn": "...",
  "anchor": "Nightjar’s material review exposed",
  "evidence": [
    {
      "thread": "...",
      "turn": "...",
      "event": "...",
      "role": "change"
    },
    {
      "thread": "...",
      "turn": "...",
      "event": "...",
      "role": "inspection"
    },
    {
      "thread": "...",
      "turn": "...",
      "event": "...",
      "role": "assessment"
    }
  ]
}
```

Recommended evidence roles:

```text
request
feedback
plan
action
edit
artifact
inspection
verification
assessment
handoff
other
```

Keep these roles small and pragmatic.

An episode may reference events from **multiple threads**.

Do not assume:

```text
episode == one turn
```

or:

```text
episode == one thread
```

This is particularly important for delegated-worker → parent-review → worker-revision workflows.

---

# 5. Make evidence inspectable directly from the story

When an episode is selected, show an **Evidence** section before making the reader switch to the global Recorded Actions tab.

Suggested layout:

```text
Episode

Question / feedback
What changed
What review found

────────────────────────────

Evidence

REQUEST
"Make the bird..."

ACTION
edited src/...

INSPECTION
viewed nightjar-large.png

ASSESSMENT
"The rectangular texture pattern remains..."

────────────────────────────

Artifact comparison
Before | After
```

Each compact evidence row should support:

```text
expand
→ full event text/output

open in recorded actions
→ navigate to exact event

open source chat
→ when available

open source diff / artifact
→ when applicable
```

The goal is:

> click a finding → immediately inspect the evidence supporting that finding.

---

# 6. Keep raw actions as a secondary view

`Recorded actions` remains valuable.

Do not remove it.

Improve it so it can act as the raw evidence browser underneath the curated story.

Add support for:

- deep-linking/selecting a specific event
- highlighting events referenced by the current episode
- filtering by episode
- filtering by thread/actor
- filtering by event role
- existing text search
- displaying unsupported/truncated source coverage

Conceptually:

```text
Creation story
      ↓
selected episode
      ↓
selected evidence
      ↓
Recorded actions
```

The user should not need to re-find the event manually.

---

# 7. Do not silently discard unsupported event types

Review:

```text
scripts/trace-visualizer/normalize.mjs
```

The current normalizer has an allowlist of known event types and ignores the rest.

That is acceptable for a narrow prototype but dangerous for a behavior-analysis tool because:

```text
not displayed
```

can be mistaken for:

```text
did not happen
```

Change the normalization contract.

Unknown event types do **not necessarily need their raw contents displayed**.

Instead preserve coverage information such as:

```ts
type NormalizationCoverage = {
  totalItems: number;
  normalizedItems: number;
  unsupportedItems: Array<{
    type: string;
    count: number;
  }>;
  truncatedItems: number;
};
```

Show this visibly in the UI.

For example:

```text
Trace coverage
142 / 146 source items represented
4 unsupported:
  contextCompaction ×2
  unknownFutureEvent ×2
```

Do not fabricate semantics for unknown events.

Preserve enough source identity to investigate them later.

---

# 8. Preserve all delegation relationships

Review handling of:

```text
subAgentActivity
collabAgentToolCall
```

Do not reduce a many-receiver relationship to a single receiver if the source contains multiple thread IDs.

Normalize:

```ts
relatedThreads: string[]
```

rather than:

```ts
relatedThread?: string
```

where appropriate.

The viewer should be able to represent:

```text
Parent
 ├─ worker A
 ├─ worker B
 └─ reviewer
```

without discarding relationships.

---

# 9. Add an ownership / handoff lane

The current case study contains a particularly important phenomenon:

```text
delegated worker
      ↓
parent review
      ↓
worker revision
      ↓
guidance reaches limit
      ↓
parent takeover
      ↓
mixed-authorship final artifact
```

Make this explicit.

For an episode, allow actors like:

```ts
type EpisodeActor = {
  threadId: string;
  role: 'requester' | 'maker' | 'reviewer' | 'parent' | 'delegated_worker' | 'verifier';
  contribution?: string;
};
```

Do not infer these automatically when the evidence does not establish them.

Allow the case-study adapter to specify them explicitly.

In the Creation Story view, add a compact ownership indicator such as:

```text
OWNER
Sol worker → parent review → parent takeover
```

or:

```text
AUTHORED BY
Worker: construction
Parent: final material + geometry pass
```

The objective is to avoid misleading single-model attribution.

---

# 10. Add structured criterion assessments

The existing prose should remain.

Do **not** replace good narrative with a spreadsheet.

But add a small structured layer for recurring review criteria.

Example:

```json
{
  "criterion": "wing construction",
  "subject": "nightjar",
  "assessment": "issue",
  "actor": "parent reviewer",
  "evidence": ["EVENT_ID"],
  "note": "folded wing still reads as a leaf-like slab"
}
```

Suggested assessment vocabulary:

```text
issue
improved
passed
accepted
rejected
not_checked
unresolved
```

Keep important semantic distinctions:

```text
change attempted
≠ check passed
≠ reviewer accepted
≠ user approved
```

Do not collapse those states.

---

# 11. Add a criterion × revision comparison view

Extend `Compare revisions`.

In addition to selecting visual before/after images, show a compact assessment matrix for the selected subject.

Example:

| Criterion         | R1          | R2          | R3       | R4       | Final      |
| ----------------- | ----------- | ----------- | -------- | -------- | ---------- |
| body construction | issue       | improved    | improved | passed   | passed     |
| wing connection   | issue       | issue       | improved | improved | accepted   |
| surface texture   | not checked | not checked | rejected | improved | unresolved |
| export integrity  | —           | —           | —        | —        | passed     |
| user approval     | —           | —           | —        | —        | unrecorded |

Every non-empty cell should be clickable.

Clicking it should reveal:

```text
who made the assessment
exact evidence
artifact revision
notes / limits
```

Do not auto-fill missing cells.

Use:

```text
not checked
unknown
unrecorded
```

where appropriate.

---

# 12. Strengthen artifact identity

The project is artifact-centered, so artifact provenance needs to become more explicit.

Create a small `ArtifactRevision` record.

Example:

```ts
type ArtifactRevision = {
  id: string;
  subject: string;
  stageId: string;

  capture?: {
    path: string;
    sha256: string;
    angle: string;
  };

  source?: {
    path: string;
    sha256: string;
  };

  producedBy?: EvidenceRef[];
  inspectedBy?: EvidenceRef[];

  provenance?: {
    sourceArtifactId?: string;
    buildReceipt?: string;
    cameraKnown?: boolean;
    lightingKnown?: boolean;
  };
};
```

For historical evidence, do not pretend more certainty exists than the records provide.

Use explicit states such as:

```text
source pairing unknown
camera differs
lighting differs
revision reconstructed from retained snapshot
```

The existing caveats should remain visible.

---

# 13. Stop identifying source history only by basename

Inspect the builder's previous-source comparison.

Do not use only:

```text
basename(file)
```

as the long-term identity of a source artifact.

Repositories commonly contain:

```text
src/a/index.ts
src/b/index.ts
src/c/index.ts
```

Use an explicit stable key.

For example:

```ts
sourceKey = stage.sourceKey ?? repoRelativePath;
```

If historical case-study data intentionally wants two paths to represent the same logical artifact, allow:

```json
{
  "sourceKey": "nightjar-model"
}
```

Keep path and key separate.

---

# 14. Add trace-source metadata and adapters

Do not attempt to create a universal event parser.

Keep explicit adapters.

The existing `read_thread` normalizer should remain something like:

```text
ReadThreadExportAdapter
```

Its output feeds a normalized observable-event model.

Future sources might include:

```text
Codex exec JSONL
Codex app-server records
other local Codex logs
```

but do not implement them unless useful evidence is already available.

Design the normalization boundary so another adapter can be added later without rewriting the viewer.

Example:

```text
source format
     ↓
adapter
     ↓
NormalizedTrace
     ↓
episode/evidence model
     ↓
viewer
```

Preserve the raw source type/version in metadata.

---

# 15. Separate source truncation from viewer truncation

The UI currently deals with clipped command/output text.

Make the distinction explicit:

```text
source truncated upstream
```

versus:

```text
viewer preview shortened; full normalized value available
```

They have different evidentiary meaning.

For every event, prefer metadata along the lines of:

```ts
sourceTruncated: boolean;
displayTruncated: boolean;
```

Do not imply that expanding a UI control recovers data that was already absent from the source export.

---

# 16. Do not invent a precise multi-agent global timeline

The source does not necessarily provide reliable timestamps for every event across concurrent threads.

Preserve:

- exact ordinal order inside the source turn
- known turn timing
- parent/child relationships
- explicit handoffs
- known dependencies

Do not infer an exact interleaving of concurrent worker actions.

If displaying parallel activity, visually label it:

```text
Concurrent / exact interleaving unavailable
```

A correct partial order is preferable to a fake precise timeline.

---

# 17. Add a compact behavioral summary

For each episode, derive only **deterministic factual summaries** from normalized events.

Useful examples:

```text
8 commands
3 file edits
2 image inspections
1 delegated worker
2 verification commands
3 files changed
```

Potentially:

```text
first artifact capture
last artifact capture
changed files
```

Do not automatically derive claims such as:

```text
wasted effort
poor reasoning
ignored feedback
```

Those are interpretations.

They belong in authored assessments/findings unless a clearly defined rule supports them.

---

# 18. Add useful behavioral flags carefully

It is acceptable to add **inspection flags**, but they must not be presented as conclusions.

Examples:

```text
⚑ completion report appears before final recorded verification

⚑ artifact changed after the last recorded inspection

⚑ repeated failing command

⚑ user/reviewer rejection after earlier agent acceptance

⚑ parent takeover after delegated revision cycle
```

Each flag must link to evidence.

Call them something like:

```text
Signals
```

or:

```text
Things to inspect
```

not:

```text
Root causes
```

Do not infer private cognition.

---

# 19. Keep the UI artifact-centered

Recommended desktop composition:

```text
┌──────────────────────────────────────────────────────────────┐
│ Case title                    Actors      Evidence coverage   │
├───────────────┬─────────────────────────┬────────────────────┤
│               │                         │                    │
│ Episode path  │ Episode explanation     │ Artifact revision  │
│               │                         │                    │
│ Initial       │ request / criterion     │ BEFORE    AFTER    │
│ Review 1      │ changes                 │                    │
│ Review 2      │ evidence                │ subject / angle    │
│ Rebuild       │ assessment              │                    │
│ Takeover      │ remaining limits        │                    │
│ Delivery      │                         │                    │
│               │                         │                    │
├───────────────┴─────────────────────────┴────────────────────┤
│ Evidence drawer: event | command | diff | provenance         │
└──────────────────────────────────────────────────────────────┘
```

The artifact should not disappear while inspecting the behavior that produced it.

On narrower widths, stacking is fine.

Do not create an elaborate graph-first interface.

---

# 20. Suggested top-level navigation

Retain the existing tabs, but revise their roles:

```text
Story
Compare
Actions
Provenance
```

### Story

Primary investigation + explanation surface.

Contains:

```text
episode
artifact
assessment
evidence
actors
```

### Compare

Artifact/revision comparison plus criterion matrix.

### Actions

Raw normalized observable events.

### Provenance

Trace sources, source snapshots, manifests, hashes, coverage and limitations.

Avoid adding many more top-level tabs.

---

# 21. Use progressive disclosure

Most users should first see:

```text
request
change
artifact
assessment
```

Then expand into:

```text
exact command
full output
patch
source diff
trace metadata
hash
```

Do not dump the full trace onto the default page.

Long command output should remain collapsed initially.

---

# 22. Data-model separation

Keep these layers distinct:

```text
SOURCE
raw read_thread export

NORMALIZED TRACE
observable requests/messages/commands/edits/images/delegation/etc.

EPISODE
curated grouping of consequential evidence

ARTIFACT REVISION
retained output/source state

ASSESSMENT
review/user/verification status attached to a criterion

STORY
human-readable interpretation
```

Do not mix authored interpretation into normalized raw events.

That separation is important.

---

# 23. Likely files to modify

Start by inspecting:

```text
docs/trace-visualizer.md

scripts/trace-visualizer/
  build.mjs
  case-study.json
  normalize.mjs
  normalize.test.mjs
  viewer.html

tests/browser/trace-visualizer.spec.ts
```

Also inspect `AGENTS.md` before changing code.

Search for any additional visualizer-specific tests or helper files before implementation.

Do not assume this handoff lists every relevant file.

---

# 24. Implementation strategy

Do this incrementally.

## Phase 1 — evidence model

Implement first:

- explicit event references
- multi-thread evidence per episode
- all related delegation threads
- unsupported-event coverage reporting
- source/display truncation distinction
- stable source artifact identity

Add tests before major UI changes.

At the end of Phase 1, existing case-study output should still build.

---

## Phase 2 — story integration

Add:

- episode-local evidence list
- exact event deep links
- actor / ownership display
- behavioral fact summary
- evidence drawer

Do not redesign the entire visual language.

Preserve the existing restrained aesthetic where practical.

---

## Phase 3 — artifact and assessment comparison

Add:

- `ArtifactRevision`
- structured assessments
- criterion × revision matrix
- click-through from assessment to evidence
- clearer provenance caveats

Use the current bird/Hydra case to validate the design.

---

## Phase 4 — polish

Only after the workflow works:

- improve spacing/hierarchy
- add sticky contextual artifact pane if useful
- improve long-trace navigation
- consider virtualization only if actually needed
- improve keyboard navigation
- refine mobile layout

Do not start with cosmetic polish.

---

# 25. Current case study should be migrated carefully

Use the existing sculpture/Hydra/bird story as the primary migration fixture.

Do not rewrite its historical conclusions casually.

Preserve important distinctions already present, including:

- successful rendering/export does not establish artistic quality
- reviewer acceptance does not equal user approval
- later user rejection supersedes earlier reviewer acceptance for that criterion
- the living Hydra received positive user feedback
- final birds have mixed authorship
- later user approval of the final birds is not recorded
- technical verification does not establish aesthetic equivalence
- camera/lighting differences limit visual comparisons
- retained source snapshots do not necessarily prove exact source-to-render pairing

Where the existing evidence is insufficient for the new schema, encode:

```text
unknown
unrecorded
not checked
```

Do not infer missing history.

---

# 26. Tests

Add deterministic tests around the new model.

At minimum:

### Normalization

- known event types normalize correctly
- unknown types increment coverage instead of disappearing silently
- all receiver thread IDs survive
- upstream truncation remains distinguishable
- event IDs remain stable
- order within a turn is preserved

### Builder

- missing evidence reference fails the build
- evidence may span threads
- unknown thread/event reference fails clearly
- duplicate evidence does not render twice accidentally
- artifact `sourceKey` collision is detected
- relative paths remain inside the repository
- existing SHA-256 manifest behavior remains intact

### Viewer

Browser tests should verify:

- selecting an episode shows its evidence
- clicking evidence selects exact raw event
- actor/handoff information renders
- artifact comparison still works
- criterion cell opens supporting evidence
- unsupported-source coverage is visible
- missing evidence/artifact state is explicit
- mobile layout remains usable

Do not rely only on screenshot tests.

---

# 27. Documentation

Update:

```text
docs/trace-visualizer.md
```

Explain the conceptual model:

```text
source trace
→ normalized events
→ episode evidence
→ artifact revisions
→ assessments
→ authored story
```

Document:

- what is source-derived
- what is authored interpretation
- what is not captured
- evidence coverage behavior
- concurrency limitations
- provenance limitations
- how to add a new case
- how to add evidence refs
- how to add criteria/assessments
- how unknown event types behave

Keep the documentation operational rather than theoretical.

---

# 28. Non-goals

Do **not**:

- migrate the project to LangSmith/Langfuse/Phoenix
- add OpenTelemetry just for this feature
- create a backend service
- create a database
- create user accounts
- upload private traces
- expose hidden/private reasoning
- infer chain-of-thought
- build a universal trace standard
- replace the existing offline generated HTML model unnecessarily
- build a generic workflow engine
- build automatic LLM root-cause analysis
- rewrite the app in React merely for architecture consistency
- add graph visualization everywhere
- invent historical timestamps
- reconstruct missing historical artifacts
- turn every command into a node in a giant DAG

Keep the implementation small enough to remain understandable.

---

# 29. External ideas worth borrowing

Study, but do not copy wholesale:

### PAIR `agent-trace-vis`

Borrow:

- overview → detail workflow
- semantic lanes
- long-trace compression
- preserving conversation/tool/file distinctions

### TraceView

Borrow:

- explicit relationships between consequential steps
- filtering interesting/problematic relationships
- overview → selected iteration → evidence

### Braintrust / LangSmith trajectory products

Borrow conceptually:

- trajectory is different from span tree
- compare behavior across runs
- jump from a semantic trajectory back to raw trace evidence

The local artifact and provenance model in this repository should remain the center.

---

# 30. Design principle

The most important rule:

> Do not build a prettier log viewer. Build a debugger for understanding how Codex changed an artifact in response to evidence and feedback.

Every UI feature should help answer one of:

```text
What did Codex see?
What did it do?
What changed?
What did it inspect?
What evidence supported the assessment?
What criterion was still unmet?
Who owned the next revision?
Where did behavior materially change?
```

If a feature does not improve one of those questions, it is probably unnecessary.

---

# 31. Acceptance criteria

The revision is successful when I can open the existing sculpture case and, without reading raw logs end-to-end:

1. Select a review/revision episode.
2. See exactly what triggered it.
3. See the relevant before/after artifact evidence.
4. See which Codex actions materially contributed to that revision.
5. See what Codex actually inspected or verified.
6. See the reviewer/user assessment.
7. Distinguish technical verification from aesthetic/user acceptance.
8. Follow delegation and parent takeover.
9. Jump from any important claim to its exact recorded evidence.
10. See when source coverage is incomplete rather than silently assuming completeness.
11. Compare the same criterion across revisions.
12. Inspect the raw events when needed without losing the current artifact/context.

The default experience should answer:

> **“Why did this artifact evolve this way?”**

The raw trace remains available to answer:

> **“What exactly happened underneath?”**

---

# 32. Before finishing

Run the repository's documented checks.

Specifically verify:

- normal visualizer tests
- production build
- relevant browser tests
- rebuild of the case-study bundle using the available private local evidence
- no private trace/evidence files accidentally enter Git
- generated ignored artifacts remain ignored
- `git diff` contains only intended source/docs/test changes

Then review the generated visualizer manually using at least:

- one simple early stage
- one multi-round stage sharing a source turn
- one delegated-worker stage
- one parent-takeover stage
- final delivery/provenance stage

Do not consider the task complete merely because tests pass. The primary criterion is whether the revised viewer makes the behavior substantially easier to understand.
