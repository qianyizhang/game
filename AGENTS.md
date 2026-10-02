# Card Workshop

Build readable, playable studies of Balatro, Slay the Spire 1, and Hearthstone Battlegrounds, in that order. The Hearthstone choice is Battlegrounds (tavern recruitment and automatic combat), not Tavern Brawl duels. All three are implemented: Blindside, Slay the Spire (Ironclad, Ascension 0) and Last Hearth. The original Slay the Spire implementation supersedes the earlier Emberpath hybrid.

## Boundaries

- Game rules are browser-independent TypeScript. UI submits commands; it cannot calculate authoritative scores or mutate rules state.
- Each game owns its rules and timing. Share small proven utilities, not a universal card-game engine.
- Separate content definitions, game rules, application persistence, and presentation.
- Randomness comes only from explicit seeded state. Replay contains the seed, rules version, and accepted commands.
- Persist only validated saves. Content/rule changes require a rules-version bump when they change replay meaning.
- Test interaction order, resource accounting, invalid actions, and run lifecycle. Keep tests meaningful.
- Preserve concurrent edits. No subagent delegation is required by this file.

## Checks

`npm run check` runs unit tests and the production build. `npm run test:browser` runs the disposable-profile browser suite with a single startup guard.

On this Mac, request approved execution outside the restricted command sandbox from the first browser-launching test command (`sandbox_permissions: require_escalated`). Ordinary checks stay sandboxed. Never use personal profiles, kill unrelated browsers, or retry unchanged LaunchServices/WindowServer startup failures. Headless and `--no-sandbox` do not fix outer sandbox permissions. Report blocked verification accurately.

## Communication

Lead with the result. Keep explanations concise and distinguish implemented features, verified behavior, and remaining work. Clear accepted decisions stay settled.
