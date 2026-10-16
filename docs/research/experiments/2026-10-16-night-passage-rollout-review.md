# Night Passage policy-play adoption · 2026-10-16

Night Passage already had restricted policy play, three gameplay tiers, three
constrained heuristic policies, calibrated outcomes and an isolated spectator.
The missing development surface was the link between a policy decision, its exact
knowledge and the accepted controls. This slice adds recording, independent audit
and navigable review under the [canonical standard](../../engineering/policy-development.md).

## Audit and implementation

| Contract                   | Finding and resulting behavior                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Score/difficulty/control   | Existing game-owned versions and fixed axes retained; historical calibration remains the performance evidence.                                                                                    |
| Extensible player          | `PolicyPlayer` supplies a fresh factory and public-config-only decision function to the existing episode loop. Custom factories require constrained controls and never receive evaluator handles. |
| Original knowledge         | Opt-in recording snapshots `Sight` before policy invocation, including aged perception, legal menu choices and control bounds.                                                                    |
| Proposals and consequences | Trace links accepted/rejected proposals, policy exceptions, work and cancelled/delivered controls to packing-independent replay units.                                                            |
| Replay and audit           | Recorded proposals reconstruct through the controller without rerunning the policy. Separate integrity, permitted-input and deterministic policy-reproduction checks expose the first mismatch.   |
| Rollout navigation         | Multiple local files, filters, descriptive aggregates, first/previous/next/last, numbered links, chamber/phase markers, before/after seeking and original downloads.                              |
| Knowledge comparison       | Recorded policy JSON is the default; exact evaluator state is an explicit review perspective. Replay viewing never mutates the playable save.                                                     |

The [agent guide](../../engineering/night-passage-agent.md#record-and-review-policy-knowledge)
owns commands, extension examples, artifact structure and audit interpretation.
The recorder pins and retains its compiled runtime; original calibration receipts,
policy formulas, rules/content/score identities and replay envelopes remain unchanged.

## Footguns and prevention

| Observed failure or risk                                                 | Prevention and evidence                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Timing-only traces cannot recover original policy knowledge              | Store the actual detached input before policy code runs; retain an input digest and reconstruct the permitted view from recorded proposals.                                                                                                                              |
| A legal replay can hide an input leak                                    | Keep reconstruction and information-boundary verdicts separate. A test injects a hidden cooldown field, recomputes hashes and still gets an exact-decision boundary failure.                                                                                             |
| Node/Chrome trigonometry differs by the last bits                        | Browser trace found movement y `0.05591110654606039` versus `0.055911106546060386`. CLI auditing stays exact; browser coordinate/angle checks declare `1e-10` absolute tolerance and report drift. Hashes, field visibility, discrete choices and clocks remain exact.   |
| Tick-only navigation merges different menu decisions                     | Use replay units counting each discrete command and frame tick; seek inside packed frames and distinguish same-tick retire/return/start boundaries.                                                                                                                      |
| A proposal is cancelled when the tick budget ends exactly at delivery    | Treat null delivery as cancellation even when waited ticks equal requested delay. Preserve the trace and partial score as a timeout.                                                                                                                                     |
| Opening a plain replay can leave unrelated policy knowledge visible      | Clear rollout selection and decision-link parameters when opening plain replay; verify save isolation and absence of stale knowledge.                                                                                                                                    |
| Pretty-printing an export changes original artifact bytes                | Keep uploaded text for original rollout downloads; new audit downloads are labeled current reconstructions.                                                                                                                                                              |
| Different configurations can be silently pooled                          | Group loaded episodes by rules/content/score, policy/version/configuration, controls/configuration, budgets, profile and runes. Selected-file summaries remain descriptive.                                                                                              |
| Artifact route globs also match a document query ending in the filename  | Match fixture URLs by pathname. The complete-run browser test originally received JSON instead of the app; the failure was in the harness.                                                                                                                               |
| A local file can inherit an older rollout URL                            | Keep the source URL with each entry; switching to a local file clears obsolete URL parameters so reload never opens unrelated knowledge.                                                                                                                                 |
| Older async loads can replace a newer selection                          | Ignore superseded file/URL loads; changing runs returns to the default policy perspective.                                                                                                                                                                               |
| Guessed paths and broad reads repeatedly failed in the development trace | Discover paths before reading; quote globs, refresh patch context after formatting and narrow explanatory reads before loading large receipt JSON. [Maintenance guidance](../../engineering/maintenance.md#prevent-repeated-trace-mistakes) owns these prevention rules. |

The development-trace review used this chat's local session
`01a1420e-5f0f-7fb2-a556-740f14d15046`, including failed-path/truncated-output records
at 2026-10-16 00:13–00:27 UTC. Browser failure traces and subsequent screenshots remain
in ignored `test-results/`; they are implementation diagnostics, not policy strength
evidence. Inspect actual recorded values before changing an audit's tolerance.

## Independent Astra review and fixes

A fresh Astra reviewer audited the working slice against base
`cdd6d0135bb8dae276f4634674c349bb3b9bef5f` independently of the implementation claims.
The review found four P2 defects, plus one incomplete-verdict defect during re-audit:

- Enforce action/tick/terminal stop conditions before replaying every decision;
  rehashed evidence cannot claim a lower action budget than the episode followed.
- Validate custom output before dereferencing it. Preserve original inputs and raw
  malformed output, including factory exceptions, as explicit error decisions.
- Select artifacts independently of playback availability. Invalid/unsupported replays
  retain inspectable audits, original knowledge and original downloads; stale arenas
  clear and later valid boundaries can recover playback.
- Invalidate asynchronous work on explicit selections and decision navigation,
  including pending initial replay URLs and delayed file reads.
- Leave unperformed audit checks unavailable after an early abort; assign passed
  only after complete coverage. A failed replay cannot masquerade as a completed
  permitted-input or policy-reproduction check.

Regression tests exercise each trigger. The reviewer re-audits fixes before this
vertical slice is committed. These findings establish prevention rules for the
shared plumbing adopted by subsequent games.

## Verification and remaining limits

- **Maintained checks:** formatting, tools/app lint, workspace types, Python checks,
  tools/DCC tests, inventory/link checks and production builds pass through `npm run check`.
- **Application and simulations:** 444 application tests across 73 files, plus 37
  seeded simulation tests across eight files pass. These include observation
  isolation, retained replay compatibility and the new rollout audit regressions.
- **Browser:** nine focused disposable-profile Chrome journeys cover the existing
  replay/save contract, multi-run review, exact original downloads, leak navigation,
  damaged-artifact recovery, superseded asynchronous imports, mobile layout and a complete recorded victory with reward-menu and terminal seeks.
  Desktop/390-pixel captures were inspected; no horizontal page overflow was observed.
- **Complete recording:** a Light/Deliberate bow development run on
  `a-light-in-the-dark` escaped with 14,081 points at 30,581 ticks. Its 12,664 recorded
  policy decisions reconstruct, match permitted inputs and reproduce under the exact
  CLI audit. The rollout is 60,679,013 bytes before any later source-pin metadata.
  This is a developer/replay witness, not an independent strength sample.
- **Fault checks:** rehashed hidden fields fail the knowledge audit while the legal
  replay remains reconstructible; truncation/tampering and mismatched totals fail;
  rejected proposals and empty-message policy exceptions remain execution errors;
  numeric tolerance cannot admit extra fields or altered decision clocks.

Local artifacts are protected under `test-results/night-passage-rollout-review/`.
The complete-run manifest records actual source/tool/runtime/bundle identities and
per-artifact hashes; an independent audit invocation writes a separate receipt.
Geometry/native authoring checks are outside this change: renderer implementations
and native asset delivery were not changed.

Old replays/control traces remain replayable but have no retroactively fabricated
policy knowledge. Exact-state runs remain replay-only diagnostics. The JSONL live
controller remains cooperative and its manual steps can underreport work; recorded
built-in episodes use evaluator-owned work. The browser inspects current-code
reconstructions; retained source/bundle/runtime pins are required for historical exact
reproduction. Unknown custom policies have an unavailable reproduction verdict until
the matching factory is supplied.

The reviewer provides original command/work diagnostics, not causal loss attribution
or alternative-rollout simulation. Validated prefix branching is deferred and labeled
in the guide. No new reserved strength matrix or human-fairness claim is made. The
existing [calibration](2026-10-14-night-passage-control.md) remains the bounded policy
performance evidence; this slice verifies developer extension and rollout review.
