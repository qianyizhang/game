# Reconstruct saves from accepted commands

Recorded 2026-10-07 from the existing [replay architecture](../architecture.md#determinism-and-persistence) and [arena journal contract](../../guide/hearth-arena.md); this records an established decision.

A saved run identifies its starting conditions, rules and content and records only accepted commands. Loading reconstructs through the owning game's legal-action interface, rather than trusting an arbitrary serialized state. This costs reconstruction work but provides inspectable decisions and consistent validation. An arena journal records rival decisions as well, so reconstruction does not rerun policies. Changes that alter a command sequence's meaning require a new rules identity; incompatible histories remain available for recovery and are rejected by current loaders rather than silently migrated.
