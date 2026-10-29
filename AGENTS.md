# Card Workshop

Use `$CODEX_HOME/AGENTS.md` (default `~/.codex/AGENTS.md`) and its practice guides
when present; local contracts and checks below still apply.

For local Codex and cloud jobs, use repo-kit's
[GitHub guide](https://github.com/qianyizhang/repo-kit/blob/main/user/practices/github.md)
for issue/PR/follow-up communication and bounded delivery. Repository-specific QA
and authorization rules still govern.

Build readable, playable studies of Balatro, Slay the Spire 1, and Hearthstone Battlegrounds, in that order. Battlegrounds means tavern recruitment and automatic combat.

## Boundaries

- Game rules are browser-independent TypeScript. UI submits commands; it cannot calculate authoritative scores or mutate rules state.
- Each game owns its rules and timing. Share small proven utilities, not a universal card-game engine.
- Separate content definitions, game rules, application persistence, and presentation.
- Randomness comes only from explicit seeded state. Replay contains the seed, rules version, and accepted commands.
- Persist only validated saves. Content/rule changes require a rules-version bump when they change replay meaning.
- Test interaction order, resource accounting, invalid actions, and run lifecycle. Keep tests meaningful.
- Prefer overall behavior and end-to-end journeys. For test additions, consolidation or removal, read [testing policy](docs/engineering/testing.md).
- For policy interfaces, rollout recording/review, or strength/difficulty/score evaluation, read [policy development](docs/engineering/policy-development.md) and the owning game's contract before implementation or study preparation. Apply its trace-derived preflight checks before dispatch.

## Governance

- Build the core flow first; mark deferred branches with `TODO` or `NotImplemented`.
- Structure files into cohesive modules with clear hierarchy; avoid flat directory dumping.
- For maintenance, script changes, documentation placement, cleanup or check coverage, read [maintenance governance](docs/engineering/maintenance.md).
- For policy experiments, keep summaries and lessons by default; follow the [iteration retention rule](docs/engineering/maintenance.md#policy-iteration-retention) when saving or closing runs.

## Checks

Use the pinned Node/npm runtime with `nvm use`, and Python from `.python-version` through `uv`.
New source must enter an enforced check scope. `npm run check:maintenance` verifies maintained tooling and static checks; `npm run check` also runs application tests and seeded simulations. Report those scopes separately.

Before using the installed review skills, read [their project mapping](docs/engineering/agent-skills.md).
It maps upstream document names to this repository's homes; repo-kit owns the
shared user-level installation and source lock.
For domain naming or interface changes, read the relevant [glossary](docs/engineering/glossary.md) context and [ADRs](docs/engineering/decisions/README.md); use domain-modeling when changing those meanings.

For SVG or 3D artwork, read [the Card Workshop art skill](skills/card-art/SKILL.md) and the [aesthetic rulebook](docs/art/art-direction.md). The rulebook is the shared visual standard; the skill covers creation and review. [SVG sources](docs/art/svg.md) and [3D sources](docs/art/3d.md) locate renderers and export integration. Passing technical checks does not establish visual quality.

[Verification contracts](docs/engineering/checks.md#gate-selection) own local gate
selection, CI scope, runtime prerequisites and reporting. Choose checks by affected
behavior and dependencies; feature changes must reuse or add relevant E2E journeys.
Documentation-only edits use `npm run format:maintenance`. Report chosen scopes and
blocked coverage; keep technical, native and visual verdicts separate.
