# Agreed direction

Accepted 2026-10-02.

1. Complete one playable game at a time: Balatro, Slay the Spire 1, Hearthstone Battlegrounds.
2. Local desktop-first browser app: TypeScript, React, Vite. No account or server needed for play.
3. Preserve core decision making and interaction timing, with curated content and original presentation. Exact values and art are not goals.
4. Mod by editing typed data and small effect functions. Include an inspector, catalogue, example mod, and exercises.
5. First milestone: complete eight-ante Balatro-style run, save/resume, 35–45 Jokers, 12–18 consumables, varied bosses and several build directions.
6. Hearthstone means Battlegrounds: tavern recruitment, warband positioning, automated combat. Use a complete eight-player local lobby with seven bots, six tiers, finite supply, three heroes and combat playback; the earlier duel/deck-builder recommendation is superseded.
7. User correction on 2026-10-02 supersedes the Emberpath hybrid: build the original Slay the Spire, Ironclad first, three full-length acts, actual game identities and researched interactions. Initial scope is Ascension 0 with a curated content pool. Slay the Spire 2 is future interest, not part of this implementation.
8. Deliver all three playable games with per-game saves, catalogues, inspectors, research and mod exercises.

## Rule fidelity

Blindside preserves poker hand evaluation (including duplicate-card hands), chips × multiplier scoring, ordered per-card and Joker effects, redraw limits, shops, interest, deck editing, hand levels, escalating blinds, boss restrictions, and permadeath.

Its content and balance are original. Each game’s simplifications and exact supported timing are recorded in README and its research note, rather than silently described as an exact clone. No copied game assets are required.

References: [Balatro official FAQ](https://www.playbalatro.com/faq), [Slay the Spire official overview](https://www.megacrit.com/press-kits/slay-the-spire/), [Battlegrounds official introduction](https://hearthstone.blizzard.com/en-us/news/23156373/hearthstone-battlegrounds).

## Accepted expansion

The next build proceeds through Spire depth, combat clarity, replay lab, mods, other-game strategy and playtesting tools. The user expanded Spire scope to **all nine bosses, Ascensions 1–5 and the Silent**. Playback is fully paced by default with speed controls. Normal runs stay committed; rewind and custom scenarios live in a separate practice lab. Mods are readable validated local TypeScript packs with previews and replay version tracking. Evidence automatically records run summaries, picks/skips and encounter outcomes locally, with clear/export controls. These decisions supersede the initial Ironclad/A0-only scope above. See [workshop expansion](roadmap.md).

## Game depth and competitive AI · 2026-10-04

The user set two tracks: deeper, more concrete gameplay, and observable AI-native engines with competitive policies developed through experiments. Human coaching is out of scope. [Development track](roadmap.md) records the bounded roadmap. The first implementation grows Last Hearth from three to five heroes and establishes its public agent protocol and policy experiment; the original three-hero count above is superseded.

## Hearth arena and rival disclosure · 2026-10-04

The accepted next slice is an eight-seat policy arena plus Mixed Rivals. Recruitment priority rotates each round; each seat finishes before the next begins. Average placement is the primary objective, with first-place/top-four/survival secondary. Preserve Classic as a separate preset and save format. Record every seat's accepted commands so replay never reruns policies.

The user's annotation separates architecture from policy experiments: rival identities must always be inspectable through the evaluator/inspector, while policy observations may hide or disclose them. Pin the visibility condition in experiment configuration and compare both conditions against identical initial rivals. All other recommendations from the decision round were accepted. See [arena contract](../guide/hearth-arena.md).
