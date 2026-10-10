# Emberwake persistent regions and independent rendering

Recorded 2026-10-10 following the user's request to expand the playable demo into connected regions and multi-level dungeons, and to improve sluggish animation.

The original demo had one 41×29 map per act and rendered only after a 100 ms simulation update. Larger rectangles alone would not provide dungeon traversal, and adding an animation library would leave the simulation and rendering coupled.

An act now owns a graph of named persistent regions. Each region owns a variable-size terrain map and local entities, loot, fog and objectives. A dungeon groups ordered floor regions; named portals with reciprocal arrival IDs represent both stairs and outdoor connections. Shared act ward requirements guard the deepest floor, and a defeated boss unlocks the next act. The validator checks geometry, connections, reachable wards and floor continuity before play. The baseline has two outdoor regions and three dungeon floors per act. Exported mods contain expanded JSON geometry; the built-in room kit is an authoring convenience, not executable mod code.

Rules remain seeded, browser-independent TypeScript. Simulation advances in 50 ms steps; content cooldowns and speeds retain their 100 ms duration units and scale by one half each step. The browser uses requestAnimationFrame with bounded catch-up, interpolates confirmed positions, caches terrain/visibility, and updates React's HUD at a lower frequency. Pausing and hidden windows exclude elapsed time. Snapshot copying touches active/destination region state and shares inactive worlds and immutable terrain. The renderer cannot calculate authoritative movement or damage.

This avoids introducing a second owner of combat or replay meaning. Anime.js supplies animation/timeline orchestration; it does not by itself supply game collision, region persistence or deterministic combat. A future renderer can replace Canvas behind the same commands and state if asset or rendering demands warrant it. References: [Anime.js engine](https://animejs.com/documentation/engine/) and [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

The graph and clock change replay meaning. Rules `emberwake-2`, content `2.0.0`, replay format v2 and a new local storage key make that boundary explicit. The v1 storage slot remains untouched and exportable; baseline commit `d0db60e` is its recovery source. Current loaders reject old histories in accordance with [accepted-command reconstruction](0002-reconstruct-from-accepted-commands.md).

Verification includes legal-command campaigns and exact reconstruction for all three heroes, persistent floor and gate contracts, malformed world content, snapshot isolation, refresh-independent timing, and browser interaction/rendering checks. Imported browser campaigns or staircase approaches are labelled as reconstructed fixtures, not full live browser playthroughs.
