# Policy development and rollout review

Every playable game should support a developer-supplied policy, explicit difficulty
and outcome contracts, reproducible evaluation, and navigable rollout evidence.
A developer must be able to add a policy without editing rules, play a complete
episode through permitted observations and ordinary commands, and inspect how its
decisions produced the result.

This is the canonical development standard for all six games. It defines the target;
the [adoption sequence](#adoption-sequence) distinguishes existing capabilities from
remaining work. Game documents own concrete APIs, rules, scores and reproduction
commands. [Domain vocabulary](glossary.md#policy-play) owns the terms.

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

### Retain a coherent evidence set

Use existing game formats where they satisfy these requirements. Logical artifacts
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
explicit limitation, preserving original bytes and recovery paths. Follow
[retention governance](maintenance.md#retention-and-deletion-authority); a new run or
source refactor never overwrites frozen evidence.

Shared record/study producers may retain the rollout as plain JSON (default) or a
lossless gzip container with `--rollout-format gzip`. New compressed artifacts use
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

Retain every attempted case and failure. A run with execution errors, source drift,
missing cases or failed audit cannot support promotion; report failures and follow the
predeclared complete-block rule. Include insensitive-policy/disclosure controls where
relevant. Review representative successes, failures and a suspected leak in the
inspector; selective successful replays are not a population result.

Use the [testing policy](testing.md) and [verification gates](checks.md#gate-selection)
for implementation checks. Keep rules correctness, rollout reconstruction, information
fairness, measured policy performance and human acceptance as separate findings.

### Calibration footguns from recorded traces

- **Duplicate combat arithmetic:** a separate projector missed retaliation ordering,
  healing after death, and deterministic intent cancellation. Reuse the native deterministic
  resolver on an explicit public-only synthetic state; cut branches involving hidden
  draws, random effects or private phases, and check complete encounter outcomes.
- **Safe-looking stalls:** reducing immediate HP loss can accumulate an unbeatable
  persistent enemy defense. Inspect long-turn traces and require a native regression
  for the traced failure, including eventual victory or defeat.
- **Unstable reference selection:** a winner on ten development seeds failed the
  reserved study. Preserve that failure; fix references before a fresh confirmation
  and never replace them after inspecting its outcomes.
- **Incomplete promotion checks:** a primary matrix can pass while companion cases
  are missing or timed out. Freeze and validate every required matrix, seed/policy
  grid, exact source-pin set and audit; statistical flags cannot override integrity.
- **Reused seed prefixes:** increasing block count under one namespace reuses the
  earlier blocks. Fresh evidence requires a new namespace, not a larger denominator.
- **Correctness versus strength:** a more faithful public model can make the policy
  worse when its utility underprices exhausted cards or setup costs. Retain negative
  experiments; native parity is a correctness result, not proof of stronger play.
- **Functional witnesses versus balance:** a short progression test should declare
  its intended tier. A rebalance can invalidate an implicit current-Standard success
  assumption for every policy. Preserve the original failure, keep the functional
  journey explicit, and assess strength with the separate frozen study criteria.
- **Budget endpoints:** distinguish execution failure from failure to win within a
  declared budget. If timeouts count as nonwins, freeze that rule before execution,
  apply it to both candidate and control, retain every denominator and report native
  completion separately. Never reinterpret a failed all-terminal protocol afterward.
- **Every recovery owner matters:** portal entry and each ordinary town tick can
  both restore HP and mana. Changing only one owner leaves a lawful bypass. Inspect
  all restoration paths before adding recovery pressure, and preserve escape as a
  separate capability from healing. Existing lawful refuge use is not cheating.
- **Cross-hero balance assumptions:** a recovery limit intended to constrain one
  class can burden other classes more. Inspect original or explicitly reconstructed
  HP/mana dependency across all heroes, retain different survival lengths, and check
  actual damage breakpoints before adding a resource system or raising multipliers.
- **Check the whole ladder after a rebalance:** native6 Standard relief passed the
  upper-tier checks but failed Necromancer's lower-tier and policy-separation checks.
  Keep the complete contrast family and viability gates fixed, inspect practical
  ties, and retain failed candidates before changing pressure again.
- **Exact time versus material separation:** in Emberwake’s failed fresh confirmation,
  Necromancer Survival Standard–Severe had 23 exact directional winning-time pairs
  become practical ties. Report exact and
  practical counts together; freeze the tolerance and full contrast family before
  execution. A large count of tiny time differences does not establish meaningful
  difficulty separation, and a failed threshold cannot be relaxed afterward.
- **Witness identity and expected outcomes:** two full seed namespaces can share a
  `DEV-01` suffix while one recorded attempt times out and the other wins. Bind a
  technical witness to its full seed, setup, policy version/configuration and artifact hash;
  derive and validate its expected native outcome before dispatch. Preserve a
  mistaken frozen attempt as failed, then repair the harness in a new attempt.
  Record planned jobs, pool starts, returned rows and validated artifacts
  separately; a rejected pool can leave actual completion unknown.
- **Quiet workers and process ownership:** process handles can be local to their
  owning agent. A different agent’s unknown handle does not prove that execution
  stopped. Ask the owner to poll the original handle, retain start/closure markers
  and closed artifact counts, and never restart solely after an observation timeout.
- **Repeated confirmations:** a correction within one study does not cover adaptive
  repeated attempts. Retain failed studies and state the scope of multiplicity control;
  larger samples improve precision, not the policy itself.
- **Shared source freezes:** study provenance includes shared analysis/tool files even
  when a different game's source is under development. One owner coordinates shared
  mutations; freeze the entire pinned graph across active studies, and retain drift
  failures. Independent game-owned edits may overlap only outside that graph.
- **Policy aliases versus replay IDs:** a permitted policy command may contain an
  observation-scoped target alias. Derive historical continuations from accepted native
  journal commands; dispatching the recorded proposal directly can target another entity.
- **Known-route promises:** sampled center points can miss unknown footprint corners,
  especially with fractional starts and axis-separated native sliding. Check the entire
  swept body corridor on masked terrain and exercise paired hidden-wall/floor states.
  A control that intentionally explores unknown space needs an explicit different contract.
- **Trace resource limits:** test the actual recorded/audited case in a worker before a
  bulk matrix. The parser envelope, decoded object graphs, hashing and serialization
  need separate headroom. A V8 old-generation limit is not a process RSS limit; retain
  observed memory and distinguish infrastructure failure from policy outcomes.
  For large cohorts, retain hashes and small receipts in memory while streaming
  recordings and final states one case at a time; loading every parsed state before
  decoding a large trace can exhaust the diagnostic heap before any replay executes.
- **Fixture and receipt publication:** a reused output path can publish a new fixture
  before an exclusive receipt write fails, leaving two different generations beside
  each other. Use a fresh directory per attempt, preflight all exclusive outputs,
  verify the complete candidate, then publish the tracked fixture atomically. Retain
  the failed attempt and recover its original bytes against the earlier hash.
  Analysis-derived journals and states need a later receipt linked to original raw
  hashes; they cannot be claimed as files pinned by the earlier execution closure.
- **Late mode identity:** generation can run before a sandbox or historical mode is
  tagged. A new version-based spawn rule can then alter the initial world even when
  later commands use the correct mode. Set the authoritative identity before rule
  execution, and compare complete generated states, RNG and dynamic spawns against
  the frozen original.
- **Reason labels are not control-flow proof:** a shared fallback can execute under a
  successful-sounding diagnostic. Verify recorded commands and original inputs before
  asserting a change was unused or behavior preserving; retain reproduction mismatches.
- **Matched seeds do not fix later rewards:** different accepted combat decisions can
  consume shared seeded randomness differently, changing later offers and routes.
  Compare whole attempts under the frozen paired design; do not explain a tier effect
  as though both policies received identical later encounters. More damage can also
  trigger a safer policy branch, so per-seed difficulty monotonicity is not guaranteed.
- **Visibility is not hit confirmation:** a legal cast and apparent line of sight can
  still produce no damage around a collision corner. Inspect disclosed HP over time;
  use bounded public-history stall detection and offered repositioning before changing
  monster health or granting private geometry. A dead draw or failed control is a
  correctness witness, not proof that its repair improves campaign win rate.
- **Recovery changes action priority:** instant healing can hide missing defensive
  control. When a versioned rule adds recovery, expose it in the menu and live HUD,
  make rejected drinks atomic, and test low-health movement before offensive casts.
  Preserve old potion/replay arithmetic; measure the changed policy separately.
- **Per-impact ceilings:** limiting one hit does not prevent several hits in one
  accepted advance from killing a full-health player. Record raw mitigated damage,
  applied rule damage and HP-clipped loss separately; inspect the complete advance
  with its starting HP. Retain original nonfatal ceiling demonstrations as well as
  deaths, rather than later reconstructing the only available policy inputs.
- **Recovery fallthrough:** a defensive state flag does not enforce defensive control.
  When no offered retreat improves clearance, a recovering policy can fall through
  into pursuit or a damaging leap. Trace the selected command, test the no-retreat
  branch, and cancel pursuit before a safe hold when the public danger permits it.
  A short survival counterfactual establishes that branch's behavior, not campaign
  strength; label reconstructed public inputs separately from originally saved ones.
- **Untimed danger envelopes:** every movement segment includes its start, so a shot
  crossing that position later can make every route appear equally unsafe. Prove
  that a safer-action comparison can distinguish the intended case. If using relative
  motion, keep its horizon and public inputs explicit, retain conservative movement
  allowances, and verify a controlled native crossing rather than claiming an exact
  prediction of walls, future shots or enemy motion.
- **Delegated policy versions:** an example or wrapper can keep its version while
  importing a changed baseline. Its behavior has still changed. Bump the wrapper's
  identity with its delegated policy, test the version relationship directly, and
  retain the earlier source/bundle for historical reproduction rather than treating
  an unchanged wrapper body as proof.
- **Defensive passivity:** retreat or holding can lose to a disclosed weak attacker
  that an offered, nonmoving instant skill would finish without advancing time.
  Reuse exact public native damage arithmetic, cover every known live threat, and
  keep warnings and hostile shots ahead of this narrow option. A successful local
  continuation does not establish campaign strength or safety against hidden foes.
- **Decision cadence versus forecast horizon:** a threat just beyond the next
  observation can become unavoidable before the following movement takes effect.
  Choose and disclose a forecast horizon separately from the action cadence, account
  for public stamina, slowing and initial alignment, and reproduce the earlier
  offered escape on the original prefix. Longer geometry is still an approximation.
- **Syntax-only draft checks:** parsing does not resolve imports, argument positions
  or call signatures. Broad text replacement can alter an ordinary function call
  while appearing to update only imports. Use contextual edits, inspect affected
  callers and check the proposed files semantically against the real project before
  applying them. Generate bundle-entry imports from resolved repository paths and
  check that each file exists; resolve retained manifest paths against their recorded
  build root. Keep invalid draft checks separate from runtime outcomes.
- **Opening a save is not a new command:** mount cleanup can rewrite a reconstructed
  historical save even before play, and an unconditional input release can append a
  stop command to a paused import. Flush changed sessions only and release active
  controls. First-upgrade and restore journeys must compare untouched stored bytes,
  not just equivalent reconstructed states.

## Settled adoption choices

Accepted 2026-10-16 after the design interview:

- **Difficulty:** give missing ladders three real player-selectable configurations,
  preserving current gameplay as Standard and historical replay meanings. Calibrate
  pressure/opponent differences rather than assigning names alone. The later accepted
  Cartographer calibration slice may rebalance Standard and the full ladder under a
  new rules version, with exact v1/v2 replay preservation.
  Emberwake has the same approved versioned-rebalance option. Its score-first slice
  measured completion efficiency without changing native balance; the subsequent
  rules-v4 candidate introduces explicit recovery and coherent hostile pressure while
  retaining exact historical environments. After the v4 development screen, the user
  chose further gameplay pressure under a new version while keeping completion/time
  scoring. The native6 consumed candidate tested uniform Standard damage relief
  (×5 instead of v5’s ×8), retaining Severe and exact v5/4/3/2 histories. It failed
  Necromancer’s lower-tier and policy-separation checks despite passing the upper-tier
  checks. Preserve this negative screen and its original native6 environment; another
  declared development candidate must pass before fresh confirmation. Neither the
  native5 confirmation nor native6 development is relabeled.
- **Strategies:** the remaining games start with immediate-gain, survival and
  long-term-growth priorities, adapted to their mechanics. Night Passage retains
  its existing effort spectrum and frozen comparison.
- **Emberwake episodes:** first death ends a scored benchmark attempt. Ordinary
  gameplay keeps respawns; respawn-assisted diagnostics use separate conditions.
- **Developer entry:** consistent run/record/benchmark/audit commands accept built-in
  policies and a local TypeScript policy module. Preserve existing commands.
- **Shared review:** extract evidence plumbing and review navigation when the second
  game proves the seam. Each game keeps its observation/action types, timing, metrics
  and presentation adapter; rules remain independent.
- **Cohorts:** begin with ten development seed blocks and twenty fresh reserved
  evaluation blocks, balancing relevant characters/heroes/weapons and matched
  conditions. Freeze the complete design before evaluation; expand if needed to
  establish useful differentiation while reporting uncertainty and negative results.
- **Closeout:** after each vertical slice, use a fresh Astra reviewer, resolve material
  findings, polish/clean up, verify and make a scoped commit. Independent game-owned
  development may proceed concurrently; shared mutations and commit closeouts have
  one owner, and each slice still receives its own fresh review and scoped commit.

## Adoption sequence

Accepted direction on 2026-10-16: establish this guide first, then complete one game
at a time. The rows link adopted mechanisms and their measured limits. Dated reports
bound playing-strength and difficulty claims; unresolved calibration stays explicit.

| Order | Game                 | Starting point and remaining adoption work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Night Passage        | [Adoption audit](../research/experiments/2026-10-16-night-passage-rollout-review.md) and [workflow evidence](../research/experiments/2026-10-16-policy-workflow.md): constrained native policies, local TS factories, original-input review and per-case audited study backend behind the common CLI. Existing calibration remains strength evidence; old recordings lack original knowledge and prefix branching is not offered.                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2     | Blindside            | [Policy contract](blindside-agent.md): restricted observations, local TS factories, immediate/survival/growth strategies, three selectable target tiers, v4 replay continuity, shared recording/audit/navigation and isolated original-input review. Dated evaluation evidence accompanies this adoption; uncertainty remains explicit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3     | Spire                | [Policy contract](spire-agent.md): public legal menus, extensible factories, all native Ascensions 0–5 and original-input review. [Fresh confirmation](../research/experiments/2026-10-16-spire-strength-confirmation-4.md) meets preregistered strength and difficulty criteria: Survival wins 98/86/32 Ironclad and 135/74/43 Silent attempts per 400 A0/A3/A5 seeds. Earlier failed confirmations remain intact; human difficulty is untested.                                                                                                                                                                                                                                                                                                                                                                                           |
| 4     | Last Hearth          | [Policy contract](hearth-policy.md) and [adoption evidence](../research/experiments/2026-10-16-hearth-policy.md): v6 spell-aware policies, opaque public identity, three starting-health tiers, all-actor native replay audit, isolated original-input review and 1,350 audited episodes. Original v1/v2 environments and frozen v5 results remain intact; strength ordering is qualified.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 5     | Emberwake            | [Policy contract](emberwake-policy.md): public navigation, extensible priorities, first-death campaigns and packed-tick review; [policy v8](../research/experiments/2026-10-16-emberwake-recovery-policy-8.md) repairs recovery, instant finishers and projectile escape. Score v2 ranks completion and native time. Native5 remains the committed baseline; its [fresh confirmation](../research/experiments/2026-10-16-emberwake-strength-confirmation-5.md) retains 1,170 attempts and fails Necromancer Standard–Severe separation (net 0.15, Holm p=0.149613). The [native6 Standard-relief screen](../research/experiments/2026-10-17-emberwake-standard-relief-6.md) retains 198 consumed attempts and fails two of nine contrasts. Both negatives remain intact; further versioned development and fresh confirmation are required. |
| 6     | Dungeon Cartographer | [Policy contract](cartographer-policy.md): v3 encounter pressure, extensible public priorities, ordinal health/efficiency score and exact v1/v2 native replay. [Fresh confirmation](../research/experiments/2026-10-16-cartographer-strength-confirmation-3.md) meets five declared criteria over 900 attempts: Survival wins 100/83/30 per 100 Relaxed/Standard/Severe seeds. Independent raw/native/statistical review passed; human difficulty is untested.                                                                                                                                                                                                                                                                                                                                                                              |

For each game, close with a working extension example, complete-episode evidence,
boundary tests including a leak counterexample, audited replay/decision linkage,
usable inspection journeys, and the frozen policy × difficulty report. Record
uncertain performance separation as remaining calibration work. Keep historical
formats and evidence intact; adopt this contract through versioned new work.

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
npm run engine:policy -- audit --input test-results/new-policy-episode/rollout.json --out test-results/new-policy-audit.json --policy-module src/games/cartographer/agent/example.ts
```

`--setup` contains game-owned configuration. The five shared-recording adapters use
`--max-decisions`, independent `--policy-seed` and JSON `--policy-options`. Night Passage
uses native `--max-actions` (including evaluator start), `--max-ticks` and public
`PlayerConfig`; unsupported shared flags fail explicitly. Native work totals determine
control latency and must retain their breakdown.

`benchmark --split development|evaluation` freezes a ten/twenty-block study before
execution and retains original rollout/audit evidence for each attempted case. Report
game-owned setups and separate character/hero/weapon strata. Night Passage's native
audited backend preserves its delayed controller and score model. Its explicit
`--suite training|held-out` path and old native `benchmark`/`evaluate` commands retain
their labelled historical semantics. A summary-only legacy run cannot supply missing
original knowledge retroactively or substitute for a recorded study.

Audit auto-detects each recorded identity, including Night Passage's native schema.
An implementation that is absent leaves policy reproduction unavailable while native
replay and information-boundary checks remain independent. Keep new selector/wire-ID
mappings covered by an actual record → CLI audit regression.
