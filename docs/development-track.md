# Game depth and competitive AI

Direction accepted 2026-10-04: make the games more fun, complex and concrete; make their engines observable and AI-native; develop competitive policies through reproducible experiments. Human coaching is outside this track.

## First delivery: Last Hearth

Use one game end to end before extending the agent interface to the other two. Last Hearth already has seven local opponents, finite supply, seeded combat and complete replay support.

1. **Strategic hero powers.** Make hero abilities explicit typed content. Add the Archivist (return a friendly minion to hand, preserving buffs, to replay a Battlecry or rearrange board space) and Oathkeeper (give a chosen minion Taunt and permanent health). Test resource accounting, full hands, golden Discover consumption and power reset. Advance Hearth's rules version; preserve old save keys.
2. **Observable agent boundary.** Expose a versioned observation with the player's own recruitment state, public lobby summaries, last-seen scouting and legal commands. Exclude the environment seed/RNG, private rival hands/shops, exact shared-pool counts and future outcomes. Provide explicit step numbers and structured transition deltas. Keep evaluator replay access separate.
3. **External-agent protocol.** A local JSON-lines process accepts observations and versioned actions through stdin/stdout. Publish the content catalogue and command contract. Reject stale/invalid actions without advancing state. Save evaluator replays separately from policy responses. No model provider or billing dependency is required.
4. **Competitive policy experiment.** Compare a deterministic recruitment/positioning baseline with a bounded sampled-combat positioning policy. Both receive the same restricted observations. Simulate only the publicly scouted board with independent policy RNG; label estimates as conditional on that potentially stale board. Record decisions, budgets, alternative scores, outcomes and replay validation.
5. **Experiment discipline.** Freeze policy configuration before a reserved evaluation cohort. Match environment seeds and heroes, separate development and evaluation reports, preserve partial failures, report every denominator and policy compute. Do not turn a small paired sample into a general strength claim.

## Next game features

| Game        | Bounded candidate                                                 | Design question                                                               |
| ----------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Blindside   | Distinct starting decks and a difficulty ladder                   | Do deck constraints produce different purchases, discards and risk decisions? |
| Spire       | A coherent encounter/event expansion for both existing characters | Do route, removal and drafting decisions respond to the next threat?          |
| Last Hearth | More recruitment plans and opponent policy variants               | Can economic, tribe and positional strategies compete across heroes?          |

Each expansion needs an explicit interaction/timing contract, replay-version decision, legal-run checks and actual play review. Content quantity alone is not an acceptance criterion.

## Next engine refactors

- Add game-owned observation/action adapters to Blindside and Spire using the Hearth protocol shape; do not share their rules or reward functions.
- Add policy leagues and seat rotation once the single-seat baseline is reproducible. Current local opponents are a fixed environment, not a self-play population.
- Add richer structured combat events when a policy or experiment needs them; retain authoritative frames for playback.
- Add experiment sweeps, held-out configurations and failure inspection on top of immutable reports. Keep simulator correctness, policy performance and human enjoyment as separate evidence.
- Add model-backed agents through the same process boundary only after deterministic baselines establish cost and strength comparisons.

## Completion record

The five first-delivery stages are implemented in [Hearth AI](hearth-ai.md), with [verification receipts](completion.md) and a [frozen paired experiment](research/experiments/2026-10-04-hearth-ai-v1.md). The initial search candidate did not demonstrate an improvement on reserved seeds, so the heuristic baseline is retained. Proposed later slices remain future work.

## Second delivery: eight-seat Hearth arena

[Mixed Rivals and the arena](hearth-arena.md) implement rotating recruitment priority, complete-lobby resolution, per-seat controllers, explicit rival styles and an inspector separate from policy disclosure. Classic retains its v5 rules and saves. The new tempo, economy and composition preferences are experimental policies; they are not presumed stronger than the existing baseline. A fresh cohort crosses seat rotation with hidden/disclosed identities and reports uncertainty at the seed-block level.

The next policy decision should follow that evidence: inspect recruitment failures before adding more search. Further content expansion and other-game agent adapters remain separate slices; human coaching remains outside this track.

The [reserved arena evaluation](research/experiments/2026-10-04-hearth-arena-v1.md) completed 256/256 lobbies. Baseline mean placement was 3.0156 versus Tempo's 5.5000 hidden / 5.5938 disclosed; Classic remains the default. The next bounded policy slice should isolate upgrade cadence and unused-gold spending, with new reserved seeds.

## Third delivery: recruitment ablations and diagnostics

[Recruitment v2](hearth-recruitment-v2.md) freezes all v1 policies, adds independent upgrade-cadence and replacement-spending interventions, and provides a standalone replay decision explorer. A predeclared 400-lobby development grid and 800-lobby reserved grid balance all five heroes and all eight seats against both Classic and Mixed Rivals. Hidden/disclosed labels remain a separate evaluation condition. Classic stays the default pending evidence; tavern spells and other game-content expansion remain the next separate slice.
