# Emberwake persistent regions and independent rendering

Recorded 2026-10-10 following the user's request to expand the playable demo into connected regions and multi-level dungeons, and to improve sluggish animation.

The original demo had one 41×29 map per act and rendered only after a 100 ms simulation update. Larger rectangles alone would not provide dungeon traversal, and adding an animation library would leave the simulation and rendering coupled.

An act now owns a graph of named persistent regions. Each region owns a variable-size terrain map and local entities, loot, fog and objectives. A dungeon groups ordered floor regions; named portals with reciprocal arrival IDs represent both stairs and outdoor connections. Shared act ward requirements guard the deepest floor, and a defeated boss unlocks the next act. The validator checks geometry, connections, reachable wards and floor continuity before play. The baseline has two outdoor regions and three dungeon floors per act. Exported mods contain expanded JSON geometry; the built-in room kit is an authoring convenience, not executable mod code.

Rules remain seeded, browser-independent TypeScript. Simulation advances in 50 ms steps; content cooldowns and speeds retain their 100 ms duration units and scale by one half each step. The browser uses requestAnimationFrame with bounded catch-up, interpolates confirmed positions, caches terrain/visibility, and updates React's HUD at a lower frequency. Pausing and hidden windows exclude elapsed time. Snapshot copying touches active/destination region state and shares inactive worlds and immutable terrain. The renderer cannot calculate authoritative movement or damage.

This avoids introducing a second owner of combat or replay meaning. Anime.js supplies animation/timeline orchestration; it does not by itself supply game collision, region persistence or deterministic combat. A future renderer can replace Canvas behind the same commands and state if asset or rendering demands warrant it. References: [Anime.js engine](https://animejs.com/documentation/engine/) and [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

The graph and clock change replay meaning. Rules `emberwake-2`, content `2.0.0`, replay format v2 and a new local storage key make that boundary explicit. The v1 storage slot remains untouched and exportable; baseline commit `d0db60e` is its recovery source. Current loaders reject old histories in accordance with [accepted-command reconstruction](0002-reconstruct-from-accepted-commands.md).

Verification includes legal-command campaigns and exact reconstruction for all three heroes, persistent floor and gate contracts, malformed world content, snapshot isolation, refresh-independent timing, and browser interaction/rendering checks. Imported browser campaigns or staircase approaches are labelled as reconstructed fixtures, not full live browser playthroughs.

## 2026-10-16 campaign difficulty compatibility

Campaign rules `emberwake-3` add explicit Relaxed/Standard/Severe incoming-damage tiers and replay format v3. Standard retains v2 arithmetic, RNG and content meaning. This is a bounded compatibility addition: the current importer reconstructs `emberwake-2` v2 campaigns under their original Standard semantics, preserving their original storage slot and continuation. Sandbox rules remain `emberwake-2-sandbox-1` with replay format v2. The chooser explicitly restores or exports a previous v2 campaign; current v3 saves use a separate slot. The original v1 recovery boundary above remains unchanged.

Policy attempts stop on first death independently of ordinary gameplay's respawn command. Recorded requested ticks remain native replay syntax; executed ticks stop at death. The policy review therefore keeps original decision inputs and requested-unit navigation alongside actual simulation time.

## 2026-10-16 versioned pressure and recovery

The user approved rebalancing the whole ladder, including Standard, while preserving
old replays. Score v2 first made native completion efficiency explicit. Development
then showed that instant healing could absorb substantially larger hostile hits,
while a portal's native hidden-enemy guard could reject an offered public action.
Changing score cannot repair that action contract or create sustained healing pressure.

Rules `emberwake-4` therefore isolate a new pressure candidate: incoming hostile
damage multipliers 0.75/3/6, coherent player/summon impact scaling and life-potion
recovery of 0/20/60 seconds. The native portal guard and public menu share the same
visible living, nonwarded enemy predicate. This records an implementation choice;
measured tier ordering remains subject to fresh frozen evaluation. Native time, not
the difficulty label, continues to determine winning efficiency under score v2.

Historical v3 preserves its exact arithmetic, potion and portal behavior; v2 and
sandbox retain their earlier environments. Replay format and save slot v4 are
separate. First upgrade resumes an existing v3 campaign without migration, and
explicit restore/export controls keep both earlier campaign slots recoverable.
Historical lifecycle fixtures name their original rules version; they must not be
reported as current-ladder policy evidence.
