# Card Workshop

Build readable, playable studies of Balatro, Slay the Spire 1, and Hearthstone Battlegrounds, in that order. The Hearthstone choice is Battlegrounds (tavern recruitment and automatic combat), not Tavern Brawl duels. All three are implemented: Blindside, Slay the Spire (Ironclad and Silent, Ascensions 0–5) and Last Hearth. The original Slay the Spire implementation supersedes the earlier Emberpath hybrid.

## Boundaries

- Game rules are browser-independent TypeScript. UI submits commands; it cannot calculate authoritative scores or mutate rules state.
- Each game owns its rules and timing. Share small proven utilities, not a universal card-game engine.
- Separate content definitions, game rules, application persistence, and presentation.
- Randomness comes only from explicit seeded state. Replay contains the seed, rules version, and accepted commands.
- Persist only validated saves. Content/rule changes require a rules-version bump when they change replay meaning.
- Test interaction order, resource accounting, invalid actions, and run lifecycle. Keep tests meaningful.
- Prefer overall behavior and end-to-end journeys. For test additions, consolidation or removal, read [testing policy](docs/engineering/testing.md).
- Preserve concurrent edits. No subagent delegation is required by this file.

## Checks

Use the pinned Node/npm runtime with `nvm use`, and Python from `.python-version` through `uv`.

For maintenance, script changes, documentation placement, cleanup or check coverage, read
[maintenance governance](docs/engineering/maintenance.md). New source must enter an
enforced check scope. `npm run check:maintenance` verifies maintained tooling and static
checks; `npm run check` also runs application tests and seeded simulations.
Report those scopes separately.

Before using the installed review skills, read [their project mapping](docs/engineering/agent-skills.md).
It maps upstream document names to this repository's homes and records the pinned source.
For domain naming or interface changes, read the relevant [glossary](docs/engineering/glossary.md) context and [ADRs](docs/engineering/decisions/README.md); use domain-modeling when changing those meanings.

For SVG or 3D artwork, read [the Card Workshop art skill](skills/card-art/SKILL.md) and the [aesthetic rulebook](docs/art/art-direction.md). The rulebook is the shared visual standard; the skill covers creation and review. [SVG sources](docs/art/svg.md) and [3D sources](docs/art/3d.md) locate renderers and export integration. Passing technical checks does not establish visual quality.

Use `npm run check` for ordinary changes; geometry tests are opt-in. For changes affecting
3D construction, animation, rendering/export or DCC delivery, use `npm run check:full`.
Read [verification contracts](docs/engineering/checks.md#gate-selection) for scope
selection and reporting. `npm run test:browser` runs the disposable-profile browser suite
with a single startup guard.

On this Mac, request approved execution outside the restricted command sandbox from the first browser-launching test command (`sandbox_permissions: require_escalated`). Ordinary checks stay sandboxed. Never use personal profiles, kill unrelated browsers, or retry unchanged LaunchServices/WindowServer startup failures. Headless and `--no-sandbox` do not fix outer sandbox permissions. Report blocked verification accurately.

## Communication

Lead with the result. Keep explanations concise and distinguish implemented features, verified behavior, and remaining work. Clear accepted decisions stay settled.
