# Shared policy workflow and storage ledger

These records establish technical delivery, not comparable game scores or new policy
strength. The [policy-development guide](../../engineering/policy-development.md)
owns current commands. Result JSON keeps original source/tool/bundle hashes and
case evidence unchanged. Local raw paths describe historical evidence; availability
now follows the [retention rule](../../engineering/maintenance.md#policy-iteration-retention).
Recovery links below identify precompaction prose rather than new source identities.

<a id="2026-10-16-policy-workflow"></a>

## 2026-10-16: six-game workflow

[Results](2026-10-16-policy-workflow.json) · [Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-policy-workflow.md).

Selectors `blindside`, `spire`, `hearth`, `emberwake`, `cartographer` and
`night-passage` support `run`, `record`, `benchmark` and `audit` with local TS
extensions. Audit dispatches by recorded schema/identity. Night Passage retains its
native controller, work latency, action/tick budgets and rollout schema; explicit
legacy training/held-out summaries retain their meanings. Unsupported generic
seed/options/decision-budget flags fail instead of silently changing native meaning.

| Witness                            | Population / budgets                                                                                                                | Observed result and limit                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Six CLI record→audit round trips   | Five shared adapters use two-decision episodes; Night Passage uses its custom module/native budgets                                 | All 6 pass integrity, native replay, permitted-input reconstruction and policy reproduction with matching source. Interface evidence, not a strength comparison.                                   |
| Selected Night Passage study       | `POLICY-ADOPTION-1-DEV-01..10` × bow/Standard × Quick/Balanced/Deliberate; 100 accepted actions including start and 50 actual ticks | All 30 cases are living timeouts, all pass four audits, zero errors. No large 450/900-attempt default matrix or new reserved strength study was run for dispatch verification.                     |
| Produced-manifest browser journeys | One native study case; one external custom-policy recording                                                                         | Original knowledge, late before/after navigation, evaluator hidden by default and byte-exact original download pass. Browser reproduction is correctly unavailable for the external custom policy. |

The native default study design separately freezes 10 development or 20 reserved
independent blocks × 3 policies × 3 tiers × 5 weapons =450/900 attempts, retaining
strata and paired uncertainty. Those are declared design sizes, not the executed 30-case
witness. Source-pinned modules reset episode memory; absent implementations leave
reproduction unavailable without invalidating independent replay/input checks.

Independent review found that successive reports sharing a content-addressed bundle
directory rejected identical existing bytes. The correction reuses identical bytes,
preserves/rejects mismatches, and has both cases covered. Historical verification:
507 application tests, 37 simulations, 7 focused workflow/tool regressions and 2
produced-manifest browser journeys pass; no rules/native controller/UI change or
geometry/native-asset claim. Cooperative modules are not hostile-code isolation.

<a id="2026-10-16-policy-artifact-compression"></a>

## 2026-10-16: exact-byte gzip storage

[Results](2026-10-16-policy-artifact-compression.json) · [Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-policy-artifact-compression.md).

The five shared adapters gained opt-in `--rollout-format json|gzip`; the historical
default was JSON. Native replay/audit JSON, rollout payload schemas, canonical
digests and native identities stayed unchanged. Original encoded bytes remain the
download/selection identity, including BOM and distinct gzip-header variants of
identical decoded JSON. Manifests retain encoded/decoded sizes and hashes.

Both complete worker witnesses reuse consumed `EMBERWAKE-STRENGTH-2-DEV-02`,
native 4/observation 3/performance 2; both win and pass four audits with exact source pins.
They are technical acceptance, not new independent seeds or calibration.

| Witness               | Setup                         | Decisions / native ticks |    Decoded / gzip bytes | Worker time |
| --------------------- | ----------------------------- | -----------------------: | ----------------------: | ----------: |
| Frozen policy 5       | Sorceress / Severe / Growth   |           7,559 / 35,490 | 112,389,735 / 2,194,677 |    21.987 s |
| Then-current policy 6 | Barbarian / Severe / Survival |           6,689 / 31,270 |  96,340,701 / 1,869,673 |    18.653 s |

About 98% smaller storage does not imply lower decoded audit memory, worker peak
memory or RSS ceilings. The worker 2,048 MiB old-generation limit is not an RSS limit;
the policy 5 memory snapshot is process-wide, includes threads and is not a peak.
Chrome exercised both full recordings while matching policies were current, including
original downloads and 390 px layout. A separate 106,458,472-byte policy 4 primitive
passed exact encoded/decoded checks without reproducing its historical policy.

Delivery uses `.json.gzip`: Vite/Fetch can transparently remove `.gz` HTTP containers.
Gzip-looking fetched URLs require gzip magic even without an encoding header; already
decoded/misnamed payloads offer local-file recovery instead of promising original gzip
bytes. Ordinary transport-compressed JSON and outer compression over intact containers
remain valid. Corrupt/truncated/concatenated gzip, invalid UTF-8 and a 150,000,001-byte
expansion fail without replacing selection.

Accepted shared encoded and decoded UTF-8 payloads are each capped at **150,000,000
bytes**. This bounds accepted artifacts, not hostile input or peak memory. Shared
caps are applied after excluding the native schema: a generated 150,000,001-byte valid
Night Passage plain artifact passes automatic/explicit native routing. The legacy
plain routing read remains unbounded; Night Passage compression is unsupported.

Historical checks: owner 13 artifact/CLI/pool/runtime tests and independent 12 tests
are separate scopes; independent review re-audits all 4 dimensions of frozen policy 5
and 30 source/tool pins without independently launching Chrome or the combined gate.
Root's isolated gate passes 554 application tests/37 simulations plus maintenance,
static and build checks. Failed prototype/routing/preflight attempts stay failures;
none becomes a successful study or application failure. No geometry, human-skill or
game-feel acceptance follows from these technical results.
