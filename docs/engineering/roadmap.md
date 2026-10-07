# Development direction and remaining work

The accepted direction is deeper, concrete gameplay and observable agent interfaces with reproducible policy experiments. Human coaching is outside this track. [Settled decisions](decisions.md) records the approved scope; [delivery history](../research/delivery-history.md) records dated verification.

## Delivered

- **Spire:** Ironclad and Silent, nine boss encounter families and cumulative Ascensions 0–5, with researched timing and documented local simplifications.
- **Workshop:** paced authoritative combat playback; separate practice branches and validated scenarios; trusted local TypeScript packs with previews and replay manifests; bounded local playtesting evidence with separate normal/practice/imported cohorts.
- **Blindside:** packs, vouchers, blind skips/tags and the 60-Joker content pool.
- **Last Hearth:** five strategic heroes, public agent protocol, eight-seat Mixed Rivals with evaluator inspection separate from policy disclosure, recruitment diagnostics and eight tavern spells. Current gameplay is v6 / arena v2. Original v5/v1 experiment environments and evidence remain frozen.

[Modding](../guide/modding.md), [playing engines](../guide/engines.md), [Hearth agents](hearth-agents.md), [Mixed Rivals](../guide/hearth-arena.md) and [tavern spells](../guide/tavern-spells.md) own current usage and contracts. The [content history](../research/content-expansions.md) preserves earlier v2/v4 pools and compatibility decisions.

## Evidence-led policy direction

Classic remains the reference/default. The first paired formation-search study did not demonstrate reserved-cohort improvement. The arena study completed 256/256 reserved lobbies: baseline mean placement 3.0156 versus Tempo 5.5000 hidden / 5.5938 disclosed. These measure the declared local population, not general strength.

The [recruitment study](../research/experiments/2026-10-04-hearth-recruitment-v2.md) completed and audited 1,200 lobbies. Earlier upgrading improved reserved Tempo mean placement from 6.40 to 5.05 against Classic bots, and 5.80 to 4.275 against hidden Mixed Rivals; Classic remained ahead at 4.60 and 3.625. Replacement funding added little. Preserve five-seed-block uncertainty and separate visibility conditions.

The next bounded policy study should isolate unit valuation with upgrade timing held fixed in the existing v5 environment, then hero-power/purchase priority. A spell-enabled v6 comparison needs its own protocol, configuration and fresh reserved cohort. Existing placement results do not transfer automatically. No policy promotion or new experiment is authorized by this roadmap alone.

## Remaining candidates

| Area                  | Bounded direction                                               | Evidence required                                                                |
| --------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Blindside             | Starting decks and a difficulty ladder                          | Changed purchase/discard/risk decisions and legal complete runs                  |
| Spire                 | Coherent encounter/event expansion for both characters          | Route, removal and drafting decisions responding to threats                      |
| Last Hearth           | Recruitment plans and rival policy variants                     | Frozen comparisons across heroes and declared populations                        |
| Agent adapters        | Game-owned Blindside and Spire observation/action boundaries    | Redaction, legal transitions and replay checks; no shared rules engine           |
| Policy tooling        | Additional leagues, compute-matched search and diagnostics      | Matched seeds, per-decision receipts, explicit exclusions and independent audits |
| Model-backed policies | Use the existing process boundary after deterministic baselines | Measured cost and strength; no provider dependence in core rules                 |

Each expansion needs an explicit interaction/timing contract, replay-version decision and actual play review. Simulator correctness, policy performance, visual acceptance and human enjoyment require separate evidence. Content counts alone do not establish acceptance.
