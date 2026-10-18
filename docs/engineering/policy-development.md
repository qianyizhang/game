# Policy development and rollout review

Every playable game should support a developer-supplied policy, explicit difficulty
and outcome contracts, reproducible evaluation, and navigable rollout evidence.
A developer must be able to add a policy without editing rules, play a complete
episode through permitted observations and ordinary commands, and inspect how its
decisions produced the result.

This is the canonical development standard for all six games. It defines the target;
[policy evidence](../research/README.md#policy-evidence) distinguishes existing capabilities
from remaining work. Game documents own concrete APIs, rules, scores and reproduction
commands. [Domain vocabulary](glossary.md#policy-play) owns the terms.

When explaining work to readers, expand game abbreviations on first use and pair
specialist terms with a short plain-language explanation. The
[visual glossary](../guide/glossary.md) provides searchable definitions and examples:
for instance, “A0 (Ascension 0, Spire's baseline difficulty)” and “rollout (a recorded
bot attempt, including what it knew).” Use direct term links in the browser guide
when a reader needs more detail.

## Start with a complete vertical slice

For each game, deliver these together before moving to the next:

1. **Declare the contract:** permitted information, commands, score ranking,
   difficulty configurations and budgets. Name hidden information and diagnostic
   privileges explicitly. Done when the game guide gives an unambiguous example of
   a permitted decision and an information-boundary violation.
2. **Expose policy play:** detached observations and validated commands through the
   application's ordinary transition path, from setup to a terminal outcome.
   Done when a small external policy completes an episode without direct state access.
3. **Make extension local:** a policy factory, explicit configuration and per-episode
   memory, a runnable example, and documented selection/run commands. Done when a
   second policy can be added without editing rules, observation construction or
   the episode loop.
4. **Record and inspect:** retain a replay, decision trace, result and provenance;
   provide rollout navigation and separate policy/evaluator perspectives. Done when
   another developer can open a recorded failure, locate its decisions, verify the
   supplied inputs and reproduce the accepted-command outcome.
5. **Evaluate the matrix:** compare distinct policies across declared difficulty
   levels on development and fresh reserved cohorts. Done when the complete matrix,
   uncertainty, failures, audit and limits are published, including negative results.

Share small utilities after a second game demonstrates the same need. Games keep
their own rules, timing, observation schemas, score semantics and controller behavior.
The shared [playing/search interface](../guide/engines.md) exposes full seeded state;
it does not by itself satisfy the restricted policy-play contract.

## Keep ownership explicit

| Owner              | Responsibility                                                                                    | Policy access                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Rules              | Legality, resources, seeded transitions, terminal outcomes and score                              | Through the application command boundary                       |
| Player environment | Detached observations, permitted actions, phase/step identity and game-specific delivery controls | Public observation/action API                                  |
| Policy             | Choose an action from its permitted history; maintain its own memory                              | Observations, public definitions and declared policy resources |
| Evaluator          | Episode setup, private environment seed, budgets, exact outcomes, recordings and audit            | No evaluator handle or private state supplied to the policy    |
| Inspector          | Navigate recorded episodes and distinguish policy knowledge from evaluator knowledge              | Separate review surface, outside live policy execution         |

The episode loop is: evaluator supplies observation → policy returns a proposal →
player environment validates/delivers it → rules apply accepted commands → evaluator
records the result. In real-time games, old controls may continue while a new decision
is delayed. Replay records executed controls; the trace records proposed controls
and any delivery cancelled by a transition, death or budget stop.
In multi-seat games, record every actor's accepted commands so replay never reruns rivals.

### Policy extension contract

Prefer a small game-owned factory and decision function. Its inputs are the current
permitted observation, immutable public definitions/configuration, and explicitly
owned policy memory. Its outputs are an action proposal, next memory and optional
structured diagnostics. Pure policies can omit memory. Stateful policies reset for
each episode; episode state never leaks into another evaluation case.

- **Selection:** identify policy implementation/version and configuration separately
  from rules, difficulty and controls. A stable registry or CLI selection should
  allow adding a policy in its owning module plus one registration entry.
- **Actions:** use commands or frame-scoped action IDs as appropriate to the game.
  Reject malformed, stale, wrong-seat and illegal requests atomically. Record rejected
  proposals in the trace; only accepted commands enter authoritative replay.
- **Randomness:** give a stochastic policy its own declared seeded stream, independent
  of environment RNG. Record enough policy state/output to audit decisions. A policy
  receives no environment seed or seed-derived case name.
- **Compute:** declare decision/episode budgets and supported search. Wall time is a
  diagnostic unless the protocol explicitly makes it part of action delivery.
  Deterministic work units are a documented proxy with named omissions. Turn-based
  games need no artificial real-time controller merely to match Night Passage.
- **Diagnostics:** retain chosen-action reasons, considered alternatives and value/work
  components when available. These explain implemented logic; they are not causal
  proof, win probabilities or private reasoning. Missing diagnostics remain explicit.
- **External models:** keep provider calls outside rules. Retain sanitized requests,
  responses, tool results, model/settings and measured cost/usage when available;
  exclude credentials. Recorded outputs permit review even when regeneration differs.

Use the [Night Passage policy factory](../../src/games/night-passage/agent/policy.ts)
and [Hearth recruitment policies](../../src/games/battlegrounds/ai/recruitment-policy.ts)
as concrete examples, not a required universal interface. Each game guide must show
the smallest working policy, how to run it, how to open its rollout and which files
an extension touches.

## Define information fairness before measuring strength

List permitted and withheld fields for every phase, including menus, terminal views,
legal-action lists and errors. Public definitions may describe mechanics; future
draws, hidden deck order, exact supply, private rivals and environment RNG stay with
the evaluator unless a separately labeled diagnostic explicitly permits them.
Precise structured coordinates or warning timing may be allowed without being
equivalent to human perception. State the advantage beside results.

Global journal counts and monotonically allocated entity IDs can disclose hidden
actors' activity even when private objects are omitted. Keep evaluator-only clocks
outside inputs; where IDs depend on hidden allocations, assign stable opaque aliases
from permitted observed history and bind commands evaluator-side.

Policy modules receive no full session, live storage, replay export, evaluator callback
or closure over hidden state. Observation construction must detach nested data.
Search may use a declared public-information model with independent samples; stepping
the true hidden seeded state is a privileged diagnostic, even if only the resulting
action is returned. Legal menus and rejection messages also need review for leaks.

For example, a Spire policy may defend against a public enemy intent; consulting the
hidden draw order to choose its card is an information-boundary violation. A Hearth
policy may use a rival's declared last-seen board; the evaluator's current private
board belongs only in the review perspective.

Verify the boundary with complete legal journeys and focused counterexamples:

- Mutating received data cannot mutate the game or another seat's view.
- **Generation is not disclosure:** phase/fog/seat boundaries determine visibility.
  An unopened chest may already hold a generated reward; a nonempty rules field is
  not permission to expose it. Mask unrevealed values and test populated hidden fields.
- States with the same permitted history and public legal choices expose identical
  policy inputs despite different hidden state. With identical policy memory and
  policy RNG, their next decisions also agree. Preserve legitimately observed history
  when constructing this check; current visible-state equality alone is insufficient.
- Rejected/stale commands preserve state and replay and reveal no extra private data.
- An intentional hidden-field leak or privileged callback is caught by the boundary
  checks used for that game's adoption.

**Replay validity and policy fairness are separate verdicts.** A legal winning replay
does not prove that its policy respected the information boundary. Source/dependency
review, input reconstruction and boundary tests support a fairness audit; reason
labels and hashes alone cannot prove absence of hidden access. Current in-process and
JSONL interfaces are cooperative research boundaries. Claims about untrusted policy
code require a separately demonstrated isolation mechanism. Label full-state or
self-reported-work runs as diagnostic when they do not meet a comparison's contract.

## Score, difficulty and strategy are separate axes

| Axis                | Required contract                                                                 | Interpretation                                                      |
| ------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Outcome and score   | Versioned objective, ranking/tie-breaks, partial progress and terminal accounting | Use game-native units; scores across games are not interchangeable  |
| Gameplay difficulty | Named fixed configurations with concrete rule/opponent changes                    | Harder names alone do not establish harder measured play            |
| Player resources    | Observation privileges, search/work allowance and action-delivery constraints     | Hold fixed when estimating a strategy effect                        |
| Policy strategy     | Versioned decision rules, configuration, memory and policy RNG                    | More search or a different name does not establish greater strength |

Define a primary ranking before running a comparison: for example wins → mean score
including failures → winning time, or mean placement with first-place/top-four rates
secondary. Distinguish cumulative game progression from a selectable difficulty
ladder. Declare setup, hero/weapon/deck, content and starting resources beside scores.
Define deaths, game draws, budget stops and invalid execution separately; errors do
not become ordinary losses. Budget stops remain in attempted-run denominators.

When wins saturate, a versioned score can distinguish how policies win without
changing native balance. Declare an ordered component vector in `StudyDefinition.score`
and return matching numeric `metrics.score` components from the game adapter. Earlier
components take precedence; an efficient loss must never outrank a victory. Keep
farmable XP, gold and damage out of the ranking unless the game explicitly makes
them the objective. Winning efficiency uses native time or accepted commands,
including zero-turn menu loops where relevant, rather than policy decision count.
Report components and paired better/tied/worse counts; do not average an ordinal
vector into a fabricated scalar score. Historical rescoring is a labeled sidecar,
with old bytes and identities retained. It is exploratory if chosen after outcomes.

Score discrimination does not establish win-rate or human difficulty. Equal native
paths should remain ties; multiplying by the difficulty label or rewarding a larger
starting HP budget cannot establish a harder challenge. Freeze the objective before
fresh comparisons, retain counterexamples and report a saturated ladder honestly.

Each adopted game needs a baseline and at least two additional meaningful policy
variants, plus at least three documented gameplay difficulty configurations. Reuse
existing levels where available. Variants can isolate tactical search effort or
express different strategic priorities; label which they do. Avoid deliberately
broken opponents or policies introduced solely to manufacture a ranking.

For the policy × difficulty matrix, keep controls and episode budgets fixed. Measure
control/search budgets separately. Report outcomes, primary score, progress, work/cost
and relevant diagnostics. Seek useful performance separation without requiring every
pair or seed to order monotonically. If all policies saturate or differences remain
uncertain, publish that result and continue development before claiming calibrated
difficulty or differentiated policy strength. Human difficulty/enjoyment requires
separate evidence.
For rare binary outcomes, zero observed variance does not establish a zero-width
population interval. Use a suitable binomial/paired method or mark uncertainty
unavailable; retain original reports and source-pin corrected analyses.

## Make every rollout reviewable

### Routine iteration and retention

Benchmarks default to **summary-only storage**: protocol, compiled policy bundle,
per-case outcomes/audit verdicts and aggregates. Recording/auditing still runs during
the study; large observations are discarded after each case instead of written to
storage. This reduces disk use, not the transient decoded memory needed by audits.
Use `record` for selected diagnostic episodes, or `benchmark --retain-rollouts all`
when a named investigation needs every detailed recording. The protocol/report
records `rolloutRetention`; a summary-only report makes no claim that its inputs can
later be reopened. Explicitly retained shared rollouts default to lossless gzip.

After a policy is superseded, retain its source/bundle, outcome and lessons, then
prune bulk observations and intermediate artifacts. Follow the
[iteration retention rule](maintenance.md#policy-iteration-retention); permanent
raw-input archives and pixel-perfect retrospective reproduction are not requirements
for routine iteration. Evaluation boundaries and honest denominators still apply.

### Deliberately retained recordings

These requirements apply while a detailed recording is retained, not to every routine
benchmark result. Use existing game formats. Logical artifacts
may share a file; this table is not a new mandatory wire schema.

| Artifact                | Minimum retained information                                                                                                                                                                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run manifest            | Game/rules/content/score/API identities; policy/controller identity and configuration; difficulty; private evaluator setup and policy RNG identity; declared cohorts/budgets; actual source/bundle hashes and runtime                                                         |
| Accepted-command replay | Seed/setup and exact supported rules/content identity; ordered accepted commands for every actor; actual executed controls where timing matters                                                                                                                               |
| Decision trace          | Episode/decision/actor identity; observation/action-menu identity; exact policy input or reproducible reconstruction reference and digest; proposed action, acceptance/error, accepted-command range and state/result linkage; available diagnostics and work/delivery timing |
| Episode result          | Won/lost/drawn/timeout/error as applicable; score components, progress, resource/work totals, terminal state identity and replay/trace hashes                                                                                                                                 |
| Audit receipt           | Which checks ran, source/artifact identities, first mismatch and separate reconstruction, decision-reproduction and information-boundary verdicts                                                                                                                             |

Record policy memory/reset semantics and policy RNG progress sufficiently to reproduce
stateful decisions, or mark decision reproduction unavailable. Reconstructing a
redacted/delayed observation requires its historical controller state, not the current
game view. A digest without retained bytes or a pinned reconstruction path is
insufficient. Never regenerate an old input using today's policy or observation code
and label it original. Identify new reconstructions and their tools separately.

Multi-actor recordings must retain every actor's accepted commands. Audit a focal
proposal against its recorded native span; automatic rivals must not rerun to reconstruct
history. The shared recorder delegates this to a game-owned journal adapter when needed.

A rollout must reconstruct its accepted-command state and score without policy code,
provider calls or fresh randomness. For deterministic policies, audit the recorded
inputs and proposed actions with the pinned policy/configuration. For stochastic or
model outputs, replay retained decisions independently of any optional regeneration.
Compare recomputed metrics with results; detect mismatched, truncated or tampered
evidence. A verdict becomes passed only after its complete check; an early abort
leaves unperformed checks unavailable, never implicitly passed. Hashes identify bytes; they do not certify truth or fairness.

Keep raw evidence in fresh output directories, with compact durable receipts and
reproduction instructions in the existing documentation homes. State which dependencies
are required to open an old run. Unsupported versions or unavailable evidence show an
explicit limitation. Preserve exact bytes while retained; deliberately pruned inputs
are unavailable rather than reconstructed and relabeled as originals. Follow
[retention governance](maintenance.md#retention-and-deletion-authority); a new run or
source refactor never overwrites frozen evidence.

Shared record producers and explicitly retained study rollouts use a lossless gzip container by default. Use
`--rollout-format json` only when a declared plaintext consumer requires it. Full
original observations remain in the decoded JSON: repeated maps, definitions and
visible state support independent input audits, while gzip removes their disk
repetition. This does not change observations, policy identity or replay meaning.
New compressed artifacts use
`.json.gzip`; `.gz` can trigger automatic HTTP decoding that loses the saved container
bytes before browser inspection. Freeze the storage format and source-pinned encoder
before execution; manifests and study rows identify the exact encoded bytes, decoded
JSON bytes, and review path. Native replay, audit JSON, rollout schema and native
identities remain unchanged. CLI audit and the generic inspector detect containers by
magic bytes and retain exact original bytes for download, including local `.gz` files.
Accepted shared containers and decoded UTF-8 JSON are each limited to 150,000,000 bytes.
The common CLI preserves Night Passage’s legacy plaintext schema routing, whose
initial read/parse has no such allocation bound; this is not a peak-memory or hostile-file
isolation guarantee. The browser’s encoded and decoded reads remain bounded. Compression
reduces retained disk space; it does not reduce the decoded graph required for audit.
Remote `.gz` and `.gzip` links require gzip magic even when the response lacks an
encoding header. If the container is absent, explain possible server decoding or a
misnamed file and offer local-file recovery rather than relabel decoded JSON as the
original. Night Passage's separate native recorder does not support this
container option.

Source freezes identify executable source/build identities once. Keep changed policy
sources or a compiled bundle and compact protocol/outcome records; prior experiments
need only a result/lesson reference. Recursively copying an earlier evidence tree
under `source-snapshot/` multiplies storage and is unnecessary. Existing historical
hashes stay historical even after their payloads are intentionally pruned.

### Navigation is part of completion

Provide a browser or standalone inspector with these journeys:

- **Find a run:** list/filter by game, policy/configuration, difficulty, controls,
  outcome and cohort; show score/progress and artifact/audit availability. Evaluator
  case/seed labels are review metadata, never live policy inputs.
- **Navigate decisions:** previous/next, first/last, direct episode/decision link and
  game-relevant round/chamber/turn markers. Connect each decision to its observation
  tick, delivery and accepted-command range. Preserve recorded rejection/error rows.
- **Watch consequences:** play/pause, speed, seek/restart and before/after state.
  Backward seek reconstructs an isolated timeline; opening a rollout never replaces
  the user's playable save. For turn-based games, decision stepping may be the primary
  playback instead of a continuous animation.
- **Inspect knowledge:** default to the exact recorded policy view and action menu.
  Offer a clearly labeled evaluator view alongside it, with field provenance and
  withheld information distinguished. Flag input/hash/reconstruction mismatches at
  the first affected decision. Keep evaluator data outside the live policy path.
- **Compare:** show policy × difficulty aggregates with denominators, then drill into
  paired runs. Align divergent histories by meaningful events, not an assumption that
  equal decision numbers mean equal states. An alternative proposal on the same input
  is not an outcome prediction; simulating it creates a separately identified branch
  with its own policy/controller continuation and replay.
- **Export:** download original replay, trace, manifest/result and audit references;
  export validated prefixes where supported. Preserve controller provenance and label
  manually continued or branched runs separately from the original policy episode.

Start with simple files and the game's existing replay presentation. Index or chunk
large traces only when needed for usable seeking; acceleration checkpoints must be
validated against authoritative reconstruction. A viewer that silently recomputes
today's policy proposals cannot substitute for recorded historical decisions.

## Evaluate without moving the goalposts

Use development runs to refine policies and difficulty. Before reserved evaluation,
freeze actual source/bundle identities, information/score/control contracts, policy
configurations, seed namespaces, population assignments, budgets, metrics and handling
of incomplete cases. Reserve fresh seed blocks; inspected evaluation outcomes become
development evidence if they inform tuning.

Compare policies on matched starting conditions and rotate seats where relevant.
Cross heroes/weapons with seeds when estimating their separate effects; otherwise
state the confounding. Report uncertainty at the independent seed/block level,
not as though correlated seat rotations were independent samples. Declare sample
size and desired precision before execution; the same episode count is not appropriate
for every game. Shared seeds can consume RNG differently after decisions diverge.

Retain the outcome and audit verdict for every attempted case and failure; this does
not require permanently retaining every observation or replay. A run with execution errors, source drift,
missing cases or failed audit cannot support promotion; report failures and follow the
predeclared complete-block rule. Include insensitive-policy/disclosure controls where
relevant. Review representative successes, failures and a suspected leak in the
inspector; selective successful replays are not a population result.

Use the [testing policy](testing.md) and [verification gates](checks.md#gate-selection)
for implementation checks. Keep rules correctness, rollout reconstruction, information
fairness, measured policy performance and human acceptance as separate findings.

### Calibration footguns from recorded traces

Use the [policy footguns](policy-footguns.md) before implementation, study admission
and publication. They condense the retained trace findings into checks for control,
information, calibration, provenance and execution. Dated reports own the original
counterexamples; a local correctness repair never substitutes for a complete study.

## Settled adoption choices

- **Difficulty:** preserve historical replay meanings. Existing Standard gameplay was
  the initial default; later approved, versioned rebalances cover Cartographer and
  Emberwake. Their game contracts own the current ladders.
- **Strategies:** Immediate/Survival/Growth express priorities, not a strength order.
  Night Passage keeps Quick/Balanced/Deliberate effort and separate control presets.
- **Episodes:** Emberwake benchmarks stop at first death; normal play keeps respawns.
- **Evidence:** start with ten development and twenty disjoint reserved seed blocks,
  then preregister the actual design, budgets and uncertainty method before execution.
  A larger prefix of an inspected namespace is not fresh evidence.
- **Ownership:** share recording/review plumbing; retain game-owned observations,
  commands, timing and score. One owner coordinates shared pinned-source changes.
- **Closeout:** use a fresh Astra review, resolve material findings, polish, verify
  and commit only owned changes. Preserve negative results and consumed identities.
- **Emberwake stop:** native7/policy8 remains accepted. Policy12 was the final rejected
  attempt; calibration remains unresolved, the saved goal is paused, and the proposed
  victory-primary study was not started. No successor experiment is authorized.

## Common CLI, game-owned policies

Use `npm run engine:policy -- run|record|benchmark|audit` across all six games.
Every extension is a trusted local TS module, compiled and source-pinned with its
selected game. The factory's public input, command type, work model and timing remain
game-owned.

| CLI selector    | Factory and strategies                                  | Extension example                                         | Owning contract                         |
| --------------- | ------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| `night-passage` | Native `PolicyPlayer`; Quick/Balanced/Deliberate effort | [example](../../src/games/night-passage/agent/example.ts) | [Night Passage](night-passage-agent.md) |
| `blindside`     | `PolicyFactory`; Immediate/Survival/Growth              | [example](../../src/games/balatro/agent/example.ts)       | [Blindside](blindside-agent.md)         |
| `spire`         | `PolicyFactory`; Immediate/Survival/Growth              | [example](../../src/games/spire/agent/example.ts)         | [Spire](spire-agent.md)                 |
| `hearth`        | `PolicyFactory`; Immediate/Survival/Growth              | [example](../../src/games/battlegrounds/agent/example.ts) | [Last Hearth](hearth-policy.md)         |
| `emberwake`     | `PolicyFactory`; Immediate/Survival/Growth              | [example](../../packages/diablo2/src/agent/example.ts)    | [Emberwake](emberwake-policy.md)        |
| `cartographer`  | `PolicyFactory`; Immediate/Survival/Growth              | [example](../../src/games/cartographer/agent/example.ts)  | [Cartographer](cartographer-policy.md)  |

```sh
npm run engine:policy -- record --game cartographer --policy-module src/games/cartographer/agent/example.ts --out test-results/new-policy-episode
npm run engine:policy -- audit --input test-results/new-policy-episode/rollout.json.gzip --out test-results/new-policy-audit.json --policy-module src/games/cartographer/agent/example.ts
```

The [tools command contract](../../packages/workshop-tools/README.md#policy-adoption-commands) owns flags, source pinning, study dispatch and audit routing. Game guides own setup and timing; Night Passage retains its native controller and distinct budgets. Keep new selector/wire-ID mappings covered by an actual record → CLI audit regression.
