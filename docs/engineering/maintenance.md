# Maintenance governance

Every maintained source must enter an enforced check scope. The inventory gate rejects uncovered files and documentation outside canonical homes; it has no migration exemptions. [Migration and cleanup history](history/cleanup-triage.md) records the completed 2026-10-07 work and original-source recovery.

## Check scope and finish line

Use [verification contracts](checks.md#gate-selection) for commands, gate selection and execution requirements, and the [testing policy](testing.md) for meaningful coverage. Report maintenance, application/simulation, geometry and browser/native scopes separately; technical checks do not establish aesthetic acceptance.

Use `nvm install && nvm use`, hydrate native binaries with `git lfs install --local` and `git lfs pull`, then run `npm ci` and `uv sync --locked`. Runtime versions come from [`.node-version`](../../.node-version), [`.python-version`](../../.python-version) and [`package.json`](../../package.json); dependency versions come from the lockfiles. Git LFS follows the [native storage decision](decisions/0004-native-asset-storage.md); the inventory check names unhydrated binaries before delivery validation.

Upgrade TypeScript and typed ESLint together when peer support and repository checks agree. Native authoring uses the system Blender 5.2 LTS app and matching pinned bpy stubs. Native scripts retain a Python 3.11 syntax subset for historical recipes; standalone checks use the pinned Python 3.12 runtime. See the [runtime migration and gates](blender-runtime.md). Four Blender-stub assignment exceptions cover Workbench/Cycles engine enums and sRGB/Non-Color color-space names. Native rendering and isolated construction exercise these calls; there is no blanket missing-import or untyped-file suppression.

## Source ownership

- The application owns rules, content, sessions and presentation. Game rules remain browser-independent and seeded.
- Repo-kit owns the optional [Repo Workbench plugin](repo-workbench.md); Card Workshop owns its saved map, authored case definitions and private evidence.
- `@card-workshop/tools` owns maintenance commands. Future script families move into this workspace with documented inputs, outputs, dependencies and meaningful tests.
- `@card-workshop/dcc-workbench` owns Blender authoring and asset delivery. Its editable artist source is independent of rebuild recipes.
- Moves and new files must enter the owning checker scopes in the same change.
- Let the owning module and import path supply naming context. Omit repeated game/module prefixes; retain qualifiers that distinguish operations exposed together, such as arena and recruitment. Use import aliases when different modules meet at one caller.
- Preserve concurrent changes. Record starting status and source hashes, edit only the slice, and report the owned delta. Do not reset or broadly stage the worktree.
- A move or formatting change can change experiment source pins and asset receipts. Preserve historical reports, hashes and rules versions; retain experiment payloads only under the retention rule below. Validate new outputs as new results; never rewrite old evidence to match current code.

## Issue and pull request lifecycle

Scan for problems and track actionable findings as issues with concise problem,
impact, evidence (including an authorized screenshot or illustration when useful),
acceptance criteria and out-of-scope notes. Reuse existing semantic labels when useful.
A tiny, self-contained fix may explain the problem in its PR instead of creating an
issue; say why a separate issue was unnecessary.

Keep issue status current, including work already implemented locally but not pushed.
Distinguish not started, local implementation/unpushed, validation pending and delivery
blocked; identify a recoverable branch, commit or artifact and the next action for
local work. Work items may continue, pause or be cancelled independently; record
dependencies rather than silently changing related work. Closing as not planned is
distinct from completion and does not itself authorize artifact deletion; follow the
existing retention rules.

Open a draft/WIP PR after concrete progress. Link related issues and PRs as needed:
their relationship can be many-to-many. Use scoped commits and record checks and
remaining work. Reference partially addressed issues without auto-closing them.
Mark a PR ready only when its scoped acceptance criteria and applicable checks have
supporting evidence for the exact tested commit, with limitations explicit; retain
separate technical, visual and runtime verdicts under the owning contracts.
Merge only with applicable authorization. Close an issue as completed only after its
acceptance is met, and track residual work. Repository docs, issues and PRs are the
source of truth; keep chat summaries concise.

Keep issue/PR scope balanced: split oversized issues into independently closable
outcomes with explicit dependencies, not one ticket per mechanical commit. After
each merge, add a concise comment to every relevant issue: delivered change/PR,
checks, remaining work and current status; partial delivery leaves the issue open.
When a surface's actionable backlog is cleared, audit that surface and propose the
next evidence-backed batch of meaningful improvements. Do not create filler;
blocked or paused issues remain visible and are not counted as completed.

## Commit closeout

Group related fixes into a coherent, verified commit before publication. Use a title that
names the resulting behavior; commit only the owned paths. Keep published history stable
and make subsequent corrections as new commits. The [2026-10-11 storage migration](history/git-storage-2026-10-11.md)
is a completed, explicitly authorized exception with original-history backups and a commit map.

## Documentation homes

`docs/README.md` is the entry point. `guide/` owns current user behavior; `engineering/` owns architecture, maintenance and decisions; `art/` owns visual standards and asset records; `research/` owns mechanics, experiment protocols and findings. Package READMEs own their commands and integration contracts.

Original paths and hashes are preserved in the [document migration record](../../maintenance/document-migration.json); [cleanup history](history/cleanup-triage.md#source-recovery) explains recovery. New top-level review or completion documents fail the gate. Consolidate duplicate descriptions, then update inbound links in the same slice. Keep one authoritative rulebook. Durable documents describe current contracts or explicitly dated research, not a transcript of work.

Canonical Markdown links must resolve within the repository inventory, including directories with inventoried contents. Ignored local evidence may be named as a code-formatted path, but cannot be a required link: its local existence does not establish availability in CI or a fresh clone.

Before removing a script, inspect imports, npm commands, CI, documentation and frozen reproduction callers. Retain a historical source pin at its recorded revision. Before removing a dated report, preserve its lasting conclusions and an exact Git recovery reference. Update callers and verify the affected behavior in the same change.

## Retention and deletion authority

New manual review output follows installed `practices/artifacts.md`: one bundle
per major outcome in ignored `.artifacts/<outcome>/`, with its README owning the
outcome, source reference, final checks, limits and retention. Promote useful
conclusions and delete spent captures/logs at closeout. Review leftovers older
than 30 days; retain only a named active need with a next review date.

Native release manifests, research results and recovery maps retain their real
consumers. The automated prune receipts below remain executable safety contracts;
this manual-bundle policy does not change that command or broaden its roots.

`npm run maintenance -- inventory` reports streamed content hashes, every occurrence path and tracked-text references for the artifact roots. It does not grant deletion authority. [Verification contracts](checks.md#retention-and-inventory) describe its consistency and reference limits.

| Material                                                  | Home                                                           | Lifetime                                         |
| --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| Active discussions and handoffs                           | `.work/sessions/<session>/`                                    | Protected while open or pinned                   |
| Closed session notes                                      | Same, with valid closure receipt and tracked promotion targets | 30 days after closure                            |
| Reproducible disposable renders and test output           | `test-results/disposable/<run>/`                               | 14 days after closure                            |
| Artist sources, backups and named regression fixtures     | Existing source/fixture homes                                  | Protected; explicit migration decision required  |
| Policy experiment observations and intermediate artifacts | Fresh experiment output                                        | Temporary; apply the policy iteration rule below |

`npm run maintenance -- prune` is read-only. `npm run maintenance -- prune --apply` automatically deletes only eligible entries in the first two opt-in roots. The monthly local maintenance automation runs tests and governance checks first, then uses this same command. No files are eligible merely because they are old or ignored by Git.

Each candidate has a versioned `.retention.json` with `kind`, `state`, `pinned`, UTC `closedAt` and SHA-256 `files`. Sessions also name Git-tracked durable `promotedTo` documents. Open, unclassified, pinned, changed, source-containing, tracked or symlinked entries are retained. Apply rechecks the planned bytes and removes only the enumerated files. New arrivals stop directory removal. Root-level `test-results/` evidence and `dcc-backups/` are outside automatic deletion authority.

The DCC review renderer writes four PNGs into a fresh run directory and closes it only after all four succeed. Interrupted runs remain unclassified and protected. Pin a needed review by setting its receipt's `pinned` to true before expiry; retain a separately identified durable evidence set before linking it as lasting proof.

### Policy iteration retention

Optimize for fast forward iteration. Routine policy experiments do not require
pixel-perfect reproduction or retrospective audit. Keep enough to understand a
choice and avoid repeating a failed idea; keeping every observation is not a goal.
This rule supersedes older instructions to preserve all raw policy evidence.

- **Default output:** keep the protocol, source/policy identity, compiled policy
  bundle, per-case outcomes and audit verdicts, aggregate comparison and limitations.
  Every error/timeout remains in the denominator. Shared and Night Passage study
  commands default to summary-only storage; `record` explicitly captures an episode.
- **Superseded policies:** keep the policy source or compiled bundle once, the
  outcome, rejection reason and useful lesson in the research home. Prune their
  observations, full replay matrices, screenshots, repeated source trees and
  intermediate diagnostics after conclusions are recorded. An archive or restore
  test is not required for these disposable payloads.
- **Detailed capture:** use `--retain-rollouts all` only for a named active debugging
  question or a study that explicitly needs later input inspection. Prefer selected
  `record` cases. Close the question, promote a minimal useful regression fixture,
  then delete the bulk capture; ordinary closed captures should expire within 14 days.
  A longer exception needs an owner, reason and expiry, rather than an indefinite hold.
- **Storage design:** reuse existing source control and compiled bundles. Copy only
  changed policy sources when Git cannot recover them. Choose compression for
  retained recordings; build a new codec, archive store or restoration system only
  for a demonstrated consumer requirement. Video is an optional visual explanation,
  not the default replacement for structured observations.
- **Honest history:** retain published metrics and negative results without rewriting
  them. Record that raw inputs were pruned and old file links may be unavailable.
  An old audit verdict describes the checks performed then; it does not promise
  that the complete run can still be reopened today.

This standing rule authorizes pruning classified, closed policy payloads after
preserving their compact conclusions. It does not authorize deleting active runs,
actual user saves, artist sources, unique acquisitions, original Git-history backups
or named regression fixtures. Automatic `maintenance prune` remains limited to its
existing receipt-qualified roots; this rule does not broaden that command.

### 2026-10-18 storage disposition

`test-results` fell from **145.87 to 6.7 GiB**; surviving same-disk recovery holds
**0.47 GiB**. Permanent pruning removed closed policy recordings, obsolete synthetic
fixtures and large scratch diagnostics after preserving policy code/bundles, results,
lessons and selected inspector/regression examples.

Local `.work/policy-retention-2026-10-18/` records the scope and completion. In
`.work/artifact-archives/evidence-2026-10-18/`, only `retained-plan.json` and
`RECOVERY.txt` describe current recovery; older manifests are historical. Pruned
policy payloads are intentionally unrecoverable.

## Maintenance cadence

- Per change: run the relevant maintained gate, expand coverage with the code, and update the authoritative documentation.
- Weekly: review dependency-update PRs. npm and GitHub Actions are configured; review Python pins and regenerate `uv.lock` deliberately.
- Monthly: execute the guarded local cleanup. Notify on actual deletion, failed checks or required user decisions; stay quiet when nothing is actionable.
- Per completed session: promote lasting conclusions, resolve or hand off open work, then explicitly close temporary notes. Close a completed handoff only after its durable promotion is committed and its retained files are hashed.

## Prevent repeated trace mistakes

When investigating a failed development run, inspect its first error or trace before
repeating it. Promote a concrete failure and its prevention into the owning contract;
keep the lasting lesson and use the policy iteration rule for raw histories.

- **Discover paths first:** use `rg --files` to locate modules/configuration rather
  than guessing names from old layouts. Refresh the relevant lines after formatting
  before applying a contextual patch. Quote globs passed to tools so zsh does not
  reject them before the tool runs.
- **Bound reads:** search explanatory Markdown before frozen receipt JSON; use narrow
  patterns and line ranges. Avoid wrapping several long outputs in serialized JSON
  that exhausts the shared output budget. If output truncates, narrow the next read
  to the missing evidence rather than repeating the broad command. Browser error
  contexts may contain entire uploaded JSON on a single line; cap line length as
  well as line count before displaying them.
- **Separate failure scopes:** batch independent reads without making a missing path
  suppress unrelated evidence. Treat tooling failure, execution restriction, artifact
  corruption, numeric runtime drift and application assertion failures separately.
- **Verify isolated candidates with Git metadata:** when preserving concurrent edits,
  use a disposable clone plus exact owned files for the full gate. A source archive
  lacks the Git metadata used by maintenance tests; that failure is an incomplete
  verification environment, not an application regression. Creating a clone does
  not change the caller's working directory: verify the gate's explicit working
  directory and logged project path before attributing its result.
- **Keep retained evidence exact:** while a detailed recording is retained, preserve its original input bytes and source/runtime pins.
  Any numerical tolerance belongs to an explicit diagnostic with its field scope,
  bound and observed differences; never apply it to hashes or silently normalize a
  frozen result. Follow the game's policy guide for the concrete audit contract.

- **Dispatch historical environments completely:** version-aware decode alone is
  insufficient. Accepted actions, replay prefixes, practice branches and evidence
  metadata must use the replay's original rule environment. Preserve byte/state
  witnesses before introducing compatibility; new defaults must not rewrite them.
- **Validate evidence before rendering:** a guarded artifact envelope must also check
  decision-row structure and rendered result types. Preserve damaged replay fields for inspection, while rejecting
  null rows that would crash the review surface before it can show an audit.
- **Use the same filesystem identity on macOS and Linux:** before comparing existing
  paths or deriving containment/dependency keys, resolve both the repository root and
  targets with `realpath`. Resolving only a target can silently drop CI dependencies
  when the root is a symlink; macOS `/var` and `/private/var` expose the same fault.
  Use `path.relative`, not prefix replacement or root-length slicing, and normalize
  separators only when writing repository locators. Test with an explicit symlinked
  root, a trailing separator and an outside file on both platforms; do not depend on
  a host's temporary-directory spelling or skip the regression on Linux. For outputs
  that do not exist yet, resolve the existing parent and retain the owning boundary's
  traversal/symlink checks.
  For generated policy entries, exclude the canonical path before pinning and verify
  source pins after temporary cleanup. Verify retained locators against their recorded
  hashes before publishing receipts. Canonicalization does not authorize following
  symlinks during cleanup.

Browser fixture routing belongs in the [testing policy](testing.md#artifact-fixture-routes); public-position navigation and complete seed identities belong in [policy preflight checks](policy-footguns.md). Keep specialized failure examples with their owning contracts.
