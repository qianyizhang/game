# Banner Bearer

**Status:** author-reviewed procedural study; user aesthetic approval is unrecorded. The [builder](../../../src/art3d/bannerbearer.ts) interprets Hearth's banner recruit as a standing figure holding an ochre standard. The original SVG remains available in the gallery comparison.

The hands, boots and planted pole stay fixed while the weighted head, fitted facial features and banner follow a six-second authored loop. Materials distinguish muted cloth, pale bronze, skin, hair and wood. This is a stylized study, not a production character or a locomotion simulation.

## Hair repair

The 2026-10-07 baseline contained 74 individually closed hair components where the connectivity test required one. Its skull subtraction left a wall thinner than the 0.0045-unit sampling interval. Moving the inner boundary from 0.002 to 0.012 units into the skull joins the sampled hair shell while preserving the cap, sweep and hairline definitions. The test continues to require one connected component, closed outward-facing geometry and valid skin weights.

Matched enlarged color and side-clay captures were inspected before and after the repair. The overall gesture, hair contour and equipment remain consistent; the repair does not establish a broader aesthetic judgment. Baseline source bytes remain in commit `f89cf39`, and baseline captures remain under `test-results/commit-2026-10-07/browser/`. Repair captures are under `test-results/migration-2026-10-07/baseline-repair/`.

Construction costs about five seconds in the measured local environment. The [verification contracts](../../engineering/checks.md#geometry-test-budgets) record the scoped test budget and concurrency limit; successful geometry checks are not a mobile frame-rate or memory benchmark.
