# Bounded art delegation

This protocol governs bounded native-asset delegation. The original **Storm Roc adoption trial (2026-10-08)** stopped before repair authoring; a later explicit user instruction authorized parent refinement, followed by this scaffold revision and a new-model trial. Preserve the original trial's limits, receipts and outcome. The [batch retrospective](assets/native-batch-1.md) owns those results. Use the [rulebook](art-direction.md) for quality and [migration contract](migration.md) for publication. This is a workflow trial, not a model capability benchmark.

## Workflow and completion

1. **Astra specifies.** Pin the existing whole-creature delivery and matched front/side/rear renders. Use the existing export/browser harness; six clay/material views and a motion extreme are enough to start unless a named defect needs detail. Avoid a second unchanged import-review campaign. Write a short shared specification: identity and gesture, dominant defect, permitted representation, attachment and motion constraints, reference evidence, path ownership, acceptance criteria and exclusions. Include an early motion probe and name the meaningful native edit up front. Prefer matched renders; add concept images only when unresolved shape justifies their cost.
2. **Sol audits the specification.** Use a separate Sol 6.1 high-effort reviewer to challenge ambiguity, feasibility, interfaces and observable acceptance. Revise the same trial's specification if needed and re-audit; elapsed time and credits continue. The auditor may become the verifier. Completion requires an approved audit of the exact specification hash, not a polite agreement with the plan.
3. **Sol authors a bounded package.** Give author and verifier the same frozen specification with role-specific instructions. The director owns accounting and one final integration pass; workers return one frozen candidate and a short receipt, without separate accounting polls or duplicate reports. Use fresh, minimal handoffs rather than inherited full transcripts. Keep one author and one verifier, reusing their contexts for the same defect. A package owns one defect-sized region with explicit attachment/motion interfaces and paths. Keep one package for a coherent source migration when no separate visual defect needs repair: import/save, the declared native operation and its fitted motion proof. Split only where a real construction defect requires independent clearance. Shared helpers stay with Astra unless explicitly assigned. The author is not alone in the checkout and preserves concurrent edits.
4. **Sol verifies independently.** Freeze the candidate and a manifest of source/capture hashes. The verifier inspects actual candidate pixels before reading the author's self-assessment. Its receipt names **view / visible defect / intended correction** and clears the package or returns a repair within the same limits. Whole-creature integration and a motion probe are part of every package's clearance. Clearing a local region alone is insufficient. New defect labels must not disguise a restart of the same unresolved defect.
5. **Astra is the final gate.** Escalate ambiguity, representation changes and scope decisions immediately. Astra independently inspects final source and consumer delivery and applies existing native/export/browser/publication checks to exact bytes. Record any direct modeling as an intervention. Verifier clearance, technical verification, parent acceptance and user approval remain separate claims. Complete animation only after construction is stable; early probes already established that fitted parts can move.
6. **Close the pilot.** Preserve the strongest candidate and the baseline whether accepted or unfinished. Record quality verdict, elapsed working minutes, cumulative credits and coverage, package failures, role/model effort, interventions and remaining defects. Compare with the dated prior audit using the same accounting boundaries. Expand only after the retrospective; an incomplete asset is never reported as accepted merely because the trial ended.

## Cumulative limits

| Scope               | Stop before the next dispatch or revision at              |
| ------------------- | --------------------------------------------------------- |
| Each defect/package | **30 working minutes or 2 failed candidate revisions**    |
| Entire asset        | **90 working minutes or 250 Standard credit-equivalents** |

These remain the recommended limits for new subject trials; they are not a new user-approved numeric allowance. **New ledgers use version 2**, pinning their limits and final-review reserve in the immutable initialization receipt. Version 1 always retains the historical 90/30/2/250 contract. Altering defaults or using another trial cannot change old receipts. A material allowance increase still needs an explicit decision. Start the asset clock at the first attributable baseline/specification work, including work already in flight at adoption. Include Astra, Sol author, Sol auditor/verifier, helpers, renders, integration and rework. Record earlier work retrospectively before proceeding. A representation change, new agent, new package label, restart or parent takeover never resets the asset budget or an unresolved defect's counters. Two failures includes the first rejected candidate and its rejected repair.

Before dispatch, state the remaining asset allowance and the expected cost of the next bounded step **including parent coordination and final review**, using comparable receipts when available. An affordable worker call alone does not establish enough allowance for the whole step. Fit the step to the remaining budget; if that cannot be justified, preserve the checkpoint. This is allocation within the existing cap. For the next trial reserve **20 minutes and 60 modeled credits** for native/browser integration, parent visual review and minimal closeout. Pin a whole-step `estimate` with its evidence basis on each package start; the CLI refuses a start that cannot leave the reserve. Once either reserve boundary is reached, new production handoffs stop while final review and evidence recording remain possible. These are planning estimates, not claims of measured worker cost or an automatic cap extension.

Prepare and verify shared accounting infrastructure before a future production trial begins; retain its development cost in the separate strategy-overhead report and include it in all-in comparisons. For an already active trial, rollout delays and accounting work remain in its original history. Label such a result an adoption/setup trial when no repair package starts. Do not claim an author/verifier efficiency result from a baseline-and-specification checkpoint, or repeat frozen baseline/spec work merely to begin a cleaner-looking trial.

Elapsed working time is wall-clock time minus explicitly evidenced user-wait intervals. Overlapping agents count once for elapsed time; their usage is summed for cost. Tool waits, rendering and ordinary scheduling delays count. Separately report any sum of agent durations; never call it elapsed time.

At a cap, freeze evidence and return a bounded unfinished result. Astra may record diagnosis and closeout evidence but cannot launch another authoring loop under the exhausted trial. A later extension needs an explicit user decision and retains original totals. Within remaining budget, Astra may revise the shared specification: record the reason, require a fresh Sol audit and send both roles the new hash. Existing ownership boundaries, package clocks and failure counts remain in force; changes cannot disguise a fresh trial. Steering the working chat's existing goal means retaining completed milestones and requiring this pilot/retrospective before expansion, not creating a competing goal or marking an unfinished asset complete.

Keep cap closeout to the smallest evidence-preserving pass: batch the stop receipt, remaining defects and one concise disposition. Reserve its expected cost before the cap. Defer optional report expansion, repeated unchanged checks and additional orchestration passes while awaiting a user decision. Show later closeout usage separately and in the updated cumulative total; the first cap-detection receipt is not the final cost. Do not repeatedly ask for an extension or treat an audit message as authorization to resume.

## Ledger and handoffs

The checked tool is [`trial.ts`](../../packages/workshop-tools/art/trial.ts). Keep trial receipts in a **new child directory** of the working session, separate from the active candidate. All CLI paths resolve from the repository root. Use the pinned Node runtime. The parent directory must already exist.

```sh
node packages/workshop-tools/art/trial.ts init .work/sessions/<session>/stormroc-trial config.json
node packages/workshop-tools/art/trial.ts credits .work/sessions/<session>/stormroc-trial <working-thread-uuid>
node packages/workshop-tools/art/trial.ts record .work/sessions/<session>/stormroc-trial event.json
node packages/workshop-tools/art/trial.ts status .work/sessions/<session>/stormroc-trial
node packages/workshop-tools/art/trial.ts handoff .work/sessions/<session>/stormroc-trial auditor
```

`handoff` also accepts `author`, `verifier` and `director`; redirect output to an ignored handoff file. Author/verifier handoffs require an approved spec audit and an active package. The director refreshes usage and checks status immediately before every dispatch and repair. Reuse that fresh snapshot for handoff generation; workers do not rescan the ledger. A nonzero exit blocks dispatch: **2** is a budget/telemetry hold; **1** is invalid data or a refused handoff. Recording evidence may succeed while status remains blocked.

The initialization object is:

```json
{
  "kind": "init",
  "version": 2,
  "trial": "next-subject-trial",
  "asset": "subject-id",
  "limits": { "assetMinutes": 90, "packageMinutes": 30, "failedRevisions": 2, "credits": 250 },
  "reserve": { "minutes": 20, "credits": 60 },
  "at": "2026-10-08T00:00:00.000Z",
  "spec": "Replace with the actual shared specification and reference paths.",
  "baseline": [{ "path": "path/to/baseline-manifest.json", "sha256": "REPLACE_WITH_REAL_SHA256" }],
  "roles": {
    "director": { "id": "working-chat", "model": "gpt-6-astra", "effort": "xhigh" },
    "author": { "id": "sol-author", "model": "gpt-6.1-sol", "effort": "high" },
    "verifier": { "id": "sol-verifier", "model": "gpt-6.1-sol", "effort": "high" }
  }
}
```

Replace example timestamps, identities, paths and hash with actual evidence. A baseline manifest should pin the source, delivery and matched captures. Initialization checks its bytes. Named role IDs must be distinct; use stable assignment IDs and record actual agent/session IDs in intervention receipts if not yet known. The tool records declared models; the dispatcher must explicitly select Sol instead of inheriting Astra.

Each event has `kind` and `at` (canonical UTC ISO timestamp with milliseconds), plus the following fields. Receipt order is chronological. `specHash` is the exact SHA-256 of the specification text, available in status output even on a telemetry hold.

| Kind           | Additional fields and meaning                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec`         | `text`, `reason`, `director` role ID. Invalidates the previous audit while preserving ownership, clocks and failure counts.                                                                                                 |
| `audit`        | `reviewer` verifier ID, `specHash`, `approved` boolean, `findings`, nonempty `evidence` path list.                                                                                                                          |
| `usage`        | `credits` cumulative nonnegative total, `through` timestamp, `coverage` (`complete` or `partial`), `source` evidence reference and accounting description.                                                                  |
| `start`        | Unique `package` ID, `defect`, `ownedPaths` list, `interfaces`, `acceptance`. Version 2 also requires `estimate: {minutes, credits, basis}` for the whole step. One active package at a time.                               |
| `review`       | Active `package`, `reviewer` verifier ID, `specHash`, `candidate` object with `path` and `sha256`, `verdict` (`clear` or `fail`), nonempty `evidence` list, `critique`. Candidate manifest bytes are checked when recorded. |
| `pause`        | `reason` must be `user-wait`; `evidence` describes the pending user input.                                                                                                                                                  |
| `resume`       | No extra fields; closes the open user wait.                                                                                                                                                                                 |
| `intervention` | `actor`, `model`, `effort`, `detail`, nonempty `evidence` list. Includes reassignment, takeover and material Astra corrections.                                                                                             |
| `stop`         | `reason`, nonempty `evidence` list. Permanently denies new handoffs while allowing late evidence.                                                                                                                           |

`init` refuses existing directories. `record` appends exclusive numbered receipts linked by byte hashes; concurrent appends cannot overwrite one another. A repeated package ID cannot restart its clock. Keep receipts intact and back them up with closeout evidence. The chain detects accidental edits/reordering of retained history; it is not a signed audit log, cannot detect deletion of its tail, and does not authenticate the named reviewers. Preserved evidence and Astra review remain necessary.

## Cost evidence and enforcement limits

**Use the CLI; do not research rates or write a new accounting script during asset work.** `trial.ts credits DIR WORKING_THREAD_UUID` reads the ledger's original start, discovers the local working thread and its descendant agents, applies the pinned rate card, writes an exclusive usage report and appends a cumulative `usage` event. Run it immediately before dispatch or repair; it exits 2 if coverage or the trial gate is blocked. A successful collection never bypasses the time, cost or failure caps. The report identifies source paths, exact line numbers, response IDs, file-prefix hashes, model/effort and per-thread totals without message bodies or private reasoning. The ledger pins both report bytes and rate-card bytes. Repeating collection recomputes the cumulative total; it does not add the previous snapshot again.

For a read-only report without a ledger, use:

```sh
node packages/workshop-tools/art/credits.ts --root <working-thread-uuid> --since <asset-start-ISO> --out <new-report.json>
```

`--through ISO` freezes a historical cutoff; `--sessions-root DIR` uses an explicit log fixture/root. Defaults are `$CODEX_HOME/sessions` and its existing `archived_sessions` sibling, or `~/.codex` when unset. The collector indexes metadata, then streams only the selected lineage at bounded file sizes. It deduplicates by owning thread and response ID, excludes inherited usage from other threads and cumulative `token_count` totals, and includes reasoning tokens only through the already inclusive output counter. Model changes use their corresponding rates. Entire responses recorded at or after the start count, including boundary-straddling responses; there is no invented timestamp proration.

Freshness means **the logs were scanned within 120 seconds**, not that an idle agent must generate another usage record. `through` is the collection cutoff; `lastUsageAt` is reported separately. `complete` means the discovered, persisted per-response records reconcile with supported counters/rates and no detected coverage gaps. It does **not** mean a live response has already reported its usage. Open task markers are shown as possible in-flight turns, not proof of active execution. This checkpoint lag is an explicit overrun risk, not grounds for repeatedly querying models just to create fresh telemetry. The dispatcher still accounts for all participants; unrelated external helpers, missing undiscoverable logs and external charges require separate reconciliation. Monitor/scaffold-repair overhead remains separate from the asset ledger and visible in the all-in strategy assessment.

Unknown model rates, conflicting duplicates, malformed/truncated logs, missing discovered child logs, unsupported counters and detected unmetered image calls produce named gaps and `partial` coverage. Missing, partial or stale coverage holds dispatch; unknown cost is not zero. The collector returns the known subtotal with those gaps. Preserve its report and request a bounded scaffold correction here; do not begin another web-search/accounting loop. If a previously recorded manual total exceeds the collected total, the ledger refuses a decrease: reconcile its evidence rather than resetting it. Directly recorded manual receipts remain available for evidenced external charges, with their scope disclosed.

The checked [rate card](../../packages/workshop-tools/art/credit-rates.json) is a frozen **2026-10-08** snapshot of the [official Standard credit rates](https://learn.chatgpt.com/docs/pricing). Astra is **250 / 25 / 1250**, Sol 6.1 **50 / 2.5 / 250** per million uncached input / cached input / output tokens. The strategy/scaffold owner maintains this card when the accounting contract changes; routine runs perform no web request. A ledger refuses a changed rate-card hash or root identity without explicit reconciliation. This trial's denominator is normalized **Standard credit-equivalents** across speed modes: the tool does not apply Fast/Ultrafast billing multipliers or claim actual purchased credits, subscription quota, invoices or final billed cost.

The tool enforces a checkpoint decision, not a runtime scheduler. In-flight tools and responses can exceed a limit; report the overrun and dispatch no further authoring work. The CLI cannot kill agents, observe unlogged interventions, prevent manual edits or guarantee that a consumer obeys its exit code. Session receipts are ignored working data and require explicit validation; maintained tests exercise synthetic receipts. Ledger closure does not authorize deletion of source, baseline or review evidence; [retention governance](../engineering/maintenance.md) still applies.
