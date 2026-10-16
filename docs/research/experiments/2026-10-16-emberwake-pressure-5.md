# Emberwake native5 pressure candidate

**Native5 adopts the fixed D pressure profile selected from completed development. Fresh difficulty calibration remains unproven.** Policy8, observation3 and completion/time score2 stay unchanged. Historical v2/v3/v4 games retain their original rules and separate saves.

## Fixed mechanics

| Tier     | Hostile incoming multiplier | Player per-impact ceiling         | Health-potion recovery |
| -------- | --------------------------- | --------------------------------- | ---------------------- |
| Relaxed  | 0.75                        | Unlimited                         | 0 seconds              |
| Standard | 8                           | 55% of current derived maximum HP | 20 seconds             |
| Severe   | 12                          | 70% of current derived maximum HP | 60 seconds             |

Player damage applies mitigation and the tier multiplier once, then native rounding and the minimum-one floor. The player-only ceiling takes the minimum with `max(1, floor(maxHp * fraction))`. Ally damage remains uncapped, with its existing floating arithmetic and the tier multiplier applied once. Enemy health, spawn order, content, maps, rewards, skills and mana rules remain unchanged. The existing public portal sensor and life-recovery semantics apply to both v4 and v5.

**Counterexample:** a per-hit ceiling does not prevent a lethal volley. The original D8 Severe Barbarian DEV08 window records three same-tick 134-damage impacts killing a 363/363 HP player; each is below its 254-damage ceiling. A custom one-HP maximum can also die to the minimum-one floor. No human reaction-time or playability guarantee follows from the ceiling.

## Why this profile

The [policy8 development record](2026-10-16-emberwake-recovery-policy-8.md) retains 198 consumed attempts: 108 victories, 76 deaths, 14 living budget stops and zero API errors. Standard Survival wins are 8/10, 7/10, 9/10 for Barbarian/Sorceress/Necromancer; Severe wins are 1/10, 4/10, 5/10. Practical score2 comparisons support taking D to fresh confirmation, without claiming universal ordering or population calibration. Earlier A/B/C failures and D7 failures remain intact. The two originally traced Severe Barbarian campaigns still die later despite their local control repairs.

## Historical boundaries

- **V4:** incoming 0.75/3/6, no player ceiling, recovery 0/20/60 seconds, scaled uncapped ally impacts and public radius-eight/LOS portal guard.
- **V3:** incoming 0.75/1/1.3, no ceiling, instant life drinks, unscaled allies and original distance-three native portal guard.
- **V2 and sandbox:** original Standard arithmetic and separate sandbox controls persist.
- **Save ownership:** application metadata owns each explicit version's slot, replay format and session mode. Domain version predicates contain no UI/persistence labels. Import/continue/export and reload keep the loaded identity. First upgrade selects existing v5, then v4, then v3; v2 remains explicitly restorable. New v5 journeys do not rewrite protected or unreadable historical slots.

The existing 24-checkpoint original v4 fixture stays byte-identical, as do existing v3/v2 fixtures. The original v4 consumer appears once and uses fixed historical constants. Current pressure never retargets that historical assertion.

## Exact native adoption and historical continuity

The bounded integration owns 15 source/test/browser paths. A functional policy progression witness now explicitly uses Relaxed, preserving its offered-action, finite-work and skill-use assertions; it is not a Standard strength gate. Its original harder-Standard failure remains retained. The policy8 runtime and example identity remain unchanged.

All **198 original D8 journals** reconstruct through the retained official5 native bundle with complete states, accepted journals and tick accounting exact after changing only replay format, replay rules identity and expected state rules identity. This covers **808,513 accepted commands** and preserves **158 terminal-padding ticks**. It reuses recorded decisions and is neither fresh policy execution nor confirmation.

The same retained bundle reproduces **42 historical cases** with original headers: three v2, fifteen v3 and twenty-four v4. Original state, accepted next-command continuation, rejected-command identity and export/import roundtrip remain exact. All source, tool and input pins remain unchanged at closure.

## Verified gates and inspectable worker evidence

- **Independent native proof:** fresh Astra independently reconstructs all 198 adopted journals and all 42 historical witnesses, verifying 467 source/input/tool/bundle/snapshot hashes before and after with no drift. The retained output producer is a reference copy; the pinned canonical `.work` producer/helper graph is the runnable source, not the output copy alone.
- **Checks:** owner 71 focused tests; independent Astra 27 targeted tests; final isolated maintenance, 563 application tests across 93 files and 37 seeded tests across 8 files pass. Geometry is unaffected and was not run. The only post-adoption source change adds browser coverage; all native/runtime bytes remain fixed.
- **Browser:** 16/16 disposable-profile journeys pass with the repository startup guard under approved execution. They cover v4-over-v3 save priority, original v3/v4 profile/replay/export/continuation, unreadable v4 preservation through mount/recovery/new5/reload/export, and isolated historical slots. Original policy knowledge, decision/tick navigation, native before/after state, evaluator opt-in, 390 px review and exact gzip download also pass.
- **Actual four-worker stress:** four independently executed copies of one consumed Necromancer Relaxed Growth case reach 8,000 decisions and 37,840 native ticks each, remain living nonwins, and pass all four audits. Each 119,124,958-byte JSON compresses losslessly to 2,480,890 bytes. Separate slot directories prevent collisions. These are resource stress executions, not four independent population samples.
- **Resource measurement:** actual casePool uses four threads with 2,048 MiB old-generation settings each; the shared encoded/decoded limit stays 150,000,000 bytes. Sampled process-wide RSS reaches 5,702,008,832 bytes (5.310 GiB), with 59 pool samples and a 501.44 ms maximum pool sampling gap. Sampling can miss peaks, includes the main thread/workers, and is not a hard RSS ceiling. Pool time 28.815 seconds overlaps the root gate and is not isolated throughput.
- **Real pressure worker:** consumed Barbarian Severe Survival `EMBERWAKE-COHERENT-POLICY3-DEV-09` wins in 34,940 ticks/7,610 decisions and passes all four audits. JSON 108,784,498 bytes compresses to 2,092,000 bytes. Actual worker config uses `POLICY-STREAM-1`; the D8 selection used `INDEPENDENT-POLICY-2`. Their native journals and complete states nevertheless match afterward under identity-only normalization. This does not claim matched configurations or fresh strength evidence.
- **Closure:** all 31 runtime/tool sources, 15 owned sources and three historical fixtures are retained before dispatch and unchanged after both worker phases. No limits increase, retries or production edits occur during the proofs.

No fresh reserved case has executed. The planned confirmation keeps score2 and freezes all references, criteria, source/tool graphs, budgets and container limits before case1. The [companion receipt](2026-10-16-emberwake-pressure-5.json) pins this slice’s source, checks, independent proofs and original artifacts; calibration remains open.
