# Workshop expansion

Accepted 2026-10-02. Finish each stage before moving to the next.

1. **Spire depth:** all nine original Act I–III boss encounters, cumulative Ascensions 0–5, Ironclad and a curated Silent pool supporting poison, Shivs, discard and defense. Improve enemy move restrictions and room/shop distributions. Preserve original identities and document local simplifications.
2. **Combat clarity:** paced playback by default, speed controls and inspection of authoritative resolution events. Presentation never computes the result.
3. **Practice lab:** rewind, branch and create custom scenarios separately from committed normal runs. Preserve the original run; practice histories remain explicitly marked.
4. **Local mods:** readable TypeScript content packs with validation, examples, previews and replay compatibility manifests. No visual effect editor or remote code loading.
5. **Other-game strategy:** Blindside packs, vouchers, blind skips/tags; Last Hearth opponent scouting and composition-aware bots.
6. **Playtesting workbench:** automatic local run summaries, picks/skips and encounter outcomes, with export/clear controls and fixed-seed comparisons. Keep normal, practice and automated evidence distinguishable.

Artwork is being edited concurrently. This work owns game rules, application tools, their interfaces, tests and documentation; preserve the existing art edits.

## Acceptance

- Rules remain browser-independent and independently owned by each game.
- Rule changes advance replay versions; incompatible histories fail clearly and old save keys remain untouched.
- Focused interaction tests, production build, legal full-run simulations and disposable-profile browser checks cover the new behavior.
- Record implementation limits and observed verification here when complete.

## Delivered

All six stages are implemented. Start with **Practice lab** in any game; the dialog contains replay/scenarios, content-pack previews and local playtesting evidence. Spire character and Ascension choices appear before Neow. Playback is paced by default. Blindside shops offer packs/vouchers and ready screens show skip tags. Last Hearth recruitment shows the next opponent’s last seen board.

The mechanism expansion introduced v3 with content manifests. The subsequent [Night Market content set](night-market.md) advances Blindside and Hearth to v4; Spire remains v3. Prior saves remain stored under their older keys; they are not migrated. Example packs are disabled until edited in `src/mods/`. The practice lab accepts validated setup fields, not arbitrary engine state. The evidence recorder is local, bounded and separates normal/practice/imported cohorts; automated exports have their own source label.

See [completion evidence](completion.md) for checks, [v3 playtests](research/playtests/2026-10-02-workshop-v3.md) for the 32-run cohort, and [modding](modding.md) for the repeatable experiment workflow. Human balance and pacing still need play; numerical/content parity with the commercial games is not claimed.

The 2026-10-04 [development track](development-track.md) continues with game depth and competitive AI. Its first delivery advances Hearth to v5 with two strategic heroes, a public agent interface and reproducible policy experiments. Human coaching is outside that track.
