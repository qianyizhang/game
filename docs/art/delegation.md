# Asset delegation protocol

Governs bounded native-asset delegation for 3D modeling experiments using **Sol 6.1 / high** for orchestration and the author–verifier loop, and **Astra / high** for art direction, initial prototyping, and final signoff. The [rulebook](art-direction.md) governs visual quality, and the [migration contract](migration.md) governs publication boundaries. Historical records in [batch retrospective](trials/native-batch-1.md), [Wolf forms](assets/creatures/wolf-evolutions.md), [Matriarch trial](trials/native-matriarch-trial.md), and [Matriarch refinement](trials/native-matriarch-refinement.md) retain their original ledgers and outcomes.

## Roles and authority

| Role                  | Assignment                    | Authority and exclusions                                                                                                       |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Trial orchestrator    | Root **gpt-6.1-sol / high**   | Coordinates scheduling, handoffs, exceptions, and budget decisions. Routes visual verdicts to Astra; cannot self-approve.      |
| Art director          | Reused **gpt-6-astra / high** | Owns scope, representation, native prototype, and final acceptance. May perform bounded final polish.                          |
| Author                | Fresh **gpt-6.1-sol / high**  | Develops approved construction into editable source, rig/idle, native edit, and frozen export evidence.                        |
| Reviewer (`verifier`) | Fresh **gpt-6.1-sol / high**  | Audits spec, independently inspects pixels, runs verification gates, and executes publication. Never edits candidate geometry. |

Workers are spawned with `fork_turns: none`, explicit model/effort, and compact path boundaries.

## Workflow stages

1. **Scope & Baseline:** Pin identity, gesture, and delivery limits. Author captures multi-view baseline renders (front, side, rear, detail, motion). Astra inspects pixels, identifies defects, and protects sound geometry.
2. **Audit & Prototype:** Verifier audits the specification. Astra constructs a native prototype of the primary transition in whole-creature clay, detail, and motion. Verifier records the `prototype` gate; author dispatch begins only after clearance.
3. **Author–Verifier Loop:** Author refines geometry within owned paths. Verifier inspects pixels and executes native/export/browser gates. Failures must specify **view / visible defect / cause / correction / success evidence** ([structural, surface, or technical](art-direction.md#structural-rejection-versus-surface-finishing)). Structural failures require Astra representation diagnosis before repair.
4. **Director Finish:** After verifier clearance, Astra reviews pixels. Astra may accept, execute bounded final polish, or issue a `reopen` (which resets clearance and requires fresh export and verification).
5. **Acceptance & Closeout:** Astra records formal acceptance via release review (`reviewer.role: parent`). The ledger records `acceptance`. Verifier executes publication, authorized cleanup, and semantic git commit with LFS binaries.

## Cumulative limits

| Scope                                | Threshold (stop condition)                                          |
| ------------------------------------ | ------------------------------------------------------------------- |
| Unresolved defect package            | **30 working minutes or 2 failed candidate revisions**              |
| Entire asset (all participants)      | **90 working minutes or 1,000 modeled Standard credit-equivalents** |
| Reserved for final review & closeout | **20 minutes and 200 credits**                                      |

Working time measures wall-clock time minus documented user waits. Overlapping agents count once for elapsed duration; usage is summed across all agents.

## Ledger CLI and handoffs

Ledger receipts are managed via [`trial.ts`](../../packages/workshop-tools/art/trial.ts):

```sh
node packages/workshop-tools/art/trial.ts init .work/sessions/<session>/trial config.json
node packages/workshop-tools/art/trial.ts credits .work/sessions/<session>/trial <root-thread-uuid>
node packages/workshop-tools/art/trial.ts record .work/sessions/<session>/trial event.json
node packages/workshop-tools/art/trial.ts status .work/sessions/<session>/trial
node packages/workshop-tools/art/trial.ts handoff .work/sessions/<session>/trial <role>
```

Handoff roles include `auditor`, `author`, `verifier`, `director`, `orchestrator`, and `publisher`.

### Initialization configuration (v3)

```json
{
  "kind": "init",
  "version": 3,
  "trial": "matriarch-sol-astra-trial",
  "asset": "matriarch",
  "limits": { "assetMinutes": 90, "packageMinutes": 30, "failedRevisions": 2, "credits": 1000 },
  "reserve": { "minutes": 20, "credits": 200 },
  "at": "2026-10-09T00:00:00.000Z",
  "spec": "Audited shared specification text",
  "baseline": [{ "path": "path/to/manifest.json", "sha256": "..." }],
  "roles": {
    "orchestrator": { "id": "ROOT_UUID", "model": "gpt-6.1-sol", "effort": "high" },
    "director": { "id": "ASTRA_ID", "model": "gpt-6-astra", "effort": "high" },
    "author": { "id": "AUTHOR_ID", "model": "gpt-6.1-sol", "effort": "high" },
    "verifier": { "id": "VERIFIER_ID", "model": "gpt-6.1-sol", "effort": "high" }
  }
}
```

### Event types

| Event                 | Required fields / behavior                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec`                | `text`, `reason`, `director`. Invalidates prior audit/prototype.                                                                                                    |
| `audit`               | `reviewer` (verifier ID), `specHash`, `approved` boolean, `findings`, `evidence`.                                                                                   |
| `usage`               | Cumulative `credits`, `through`, `coverage` (`complete`\|`partial`), `source`.                                                                                      |
| `start`               | `package`, `defect`, `ownedPaths`, `interfaces`, `acceptance`, `estimate`.                                                                                          |
| `prototype`           | `package`, `director`, `specHash`, `source` pin, `views: {whole, detail, motion}`, `rationale`.                                                                     |
| `review`              | `package`, `reviewer`, `specHash`, `candidate` pin, `verdict` (`clear`\|`fail`), `evidence`. If failed: `classification`, `cause`, `correction`, `successEvidence`. |
| `direction`           | After structural failure: `diagnosis`, `operation`, `action` (`repair`\|`takeover`).                                                                                |
| `reopen`              | Cleared `package`, `director`, `mode` (`polish`\|`takeover`), `rejected` boolean, `estimate`.                                                                       |
| `acceptance`          | Cleared `package`, `director`, exact `candidate` pin, release `review` pin.                                                                                         |
| `pause` / `resume`    | Bounded user wait intervals (`user-wait` reason and evidence).                                                                                                      |
| `intervention`        | `actor`, `model`, `effort`, `detail`, `evidence` (records reassignments).                                                                                           |
| `stop`                | `reason`, `evidence` (permanently denies further handoffs).                                                                                                         |
| `prototype-rejection` | Pins rejected initial construction before author handoff; counts against the 2-failure limit.                                                                       |

## Cost tracking and rate cards

Standalone usage collection without a ledger:

```sh
node packages/workshop-tools/art/credits.ts --root <thread-uuid> --since <ISO> --out <report.json>
```

- **Rate card:** Standard pricing snapshot ([`credit-rates.json`](../../packages/workshop-tools/art/credit-rates.json)) pinned to Astra (250 / 25 / 1250) and Sol 6.1 (50 / 2.5 / 250) per million tokens (uncached in / cached in / out).
- **Enforcement:** Verifier computes usage before dispatch, repair, and closeout. Unmetered gaps, stale data (>120s), or missing logs result in `partial` coverage, halting dispatch.
- **Retention:** Session receipts are stored in `.work/sessions/<trial>/` under [maintenance governance](../engineering/maintenance.md).
