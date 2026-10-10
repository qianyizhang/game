# Architectural decisions

ADRs capture consequential trade-offs whose reasons would otherwise be lost. Scope and feature acceptances remain in [settled game decisions](../scope-history.md); the [glossary](../glossary.md) owns terminology and the [testing policy](../testing.md) owns verification judgment.

- [0001: Independent game rules](0001-independent-game-rules.md)
- [0002: Reconstruct from accepted commands](0002-reconstruct-from-accepted-commands.md)
- [0003: Blender-first 3D authoring](0003-blender-first-authoring.md)
- [0004: Git LFS for native assets](0004-native-asset-storage.md)
- [0005: One frontend for session review](0005-session-review-frontend.md)
- [0006: Emberwake persistent regions and independent rendering](0006-emberwake-world-runtime.md)

The first two records consolidate established choices; recording them on 2026-10-07 does not invent a new acceptance date. The third records the user's explicit authoring direction; the fourth records the accepted storage boundary before migration expands. Add another only when a real choice is costly to reverse, surprising without context and based on meaningful alternatives. Do not turn every implementation choice or retro finding into an ADR.
