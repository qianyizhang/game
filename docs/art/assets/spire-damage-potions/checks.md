# Spire damage potions · verification

## Source / capture

Baseline main: `08ca09dcac428f963c581d8bd05485a097323ad7`.
[Provenance](provenance.json) binds the exact renderer/test bytes, screenshot pairs,
fixture bytes, browser package and viewports. The renderer is byte-identical to
the tested source; the test received only token-identical formatting afterward,
recorded alongside its tested and final hashes. Capture: desktop 1440 × 1080 / phone 390 × 844; belt icons 24 × 24.

Runtime: Node 24.21.0 / npm 11.19.0; existing Playwright 1.64.0. Official Chrome
156.0.8078.73 was unpacked under `/tmp`; its vendor URL and package SHA-256 are
retained. The existing `CARD_WORKSHOP_CHROME_EXECUTABLE` path and unchanged startup
guard were used. No personal browser profile or execution guard was changed.

## Passed scopes

| Scope                   | Command / evidence                                                                                                                                                                                                                                                                                        | Result                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Standalone artwork      | `npm run assets:export -- test-results/potion-offense/current`                                                                                                                                                                                                                                            | All 650 SVGs exported                                                                          |
| Decode / intended scope | `npm run assets:review -- spire/potions/fire spire/potions/explosive --from test-results/potion-offense/current --before test-results/potion-offense/before --out test-results/potion-offense/review-final --sharp-module /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp` | Both manifests fully decoded; exactly those two IDs changed; 648 unchanged; zero added/removed |
| Browser                 | `npx playwright test --project=functional tests/browser/feature-art.spec.ts tests/browser/art-export.spec.ts --grep 'Spire collections\|Spire damage potions\|standalone SVG'`                                                                                                                            | 3 journeys passed, 14.9 s process                                                              |
| Domain                  | Application Vitest selection in `src/games/spire/domain/game.test.ts`                                                                                                                                                                                                                                     | 30 tests passed in one file; save/reload coverage is in the browser journey                    |
| Lint                    | `npx eslint src/games/spire/ui/WorldItemArt.tsx tests/browser/feature-art.spec.ts --max-warnings=0`                                                                                                                                                                                                       | Passed                                                                                         |
| Types                   | `npx tsc --noEmit`                                                                                                                                                                                                                                                                                        | Passed                                                                                         |
| Production              | `npm run build`                                                                                                                                                                                                                                                                                           | Passed; existing large-chunk advisory retained                                                 |

`npm run format:maintenance` passed, including repository formatting and inventory
(821 managed sources, zero errors); staged evidence also passed inventory and
`git diff --check`.

The domain command also named a nonexistent Spire application session test path;
Vitest selected only the existing domain file. No session-unit result is claimed.
Actual persisted state, reload and downloaded replay decoding were checked through
the new browser journey.

The legal `IRONCLAD-06` fixture prefix reaches combat holding both potions. The
browser targets the second enemy using keyboard Enter, consumes Fire using Enter,
and independently expects 20 damage to that enemy only. Reload preserves the
remaining Explosive Potion. Its use damages all three enemies by 10, consumes no
Energy, empties the belt and survives export/reload. This does not replace the
existing domain checks for Block and other potion interactions.

Temporary complete logs and raw baseline/v1/current captures remain under
`test-results/potion-offense/`. Existing captures were reused for matched sheets;
no post-validation art changes or repeated successful suites were needed. The final
formatting gate flagged the browser-test file; Prettier corrected it, a TypeScript
token comparison confirmed identical code, and the formatting/inventory gate passed.

## Visual verdict / limits

Author self-review: accepted for this local checkpoint. The tilted neck and broad
reinforced body separate at 24 px, and glass/liquid/metal planes remain readable
in the 80 px collection. V2 fixes the two observed v1 defects documented in the
asset record. No independent or parent pixel-review verdict is claimed.

This is a two-icon SVG change. No native/geometry checks, complete game campaign,
full application/simulation suite or hosted CI run is claimed. Those unrelated
scopes were not rerun. Existing content, rules, save/replay versions, labels and
keyboard targets remain unchanged. Medical QA policies are outside this work.

## Local retention

Implementation and selected evidence are committed locally only, on
`art/local-spire-damage-potions`. No issue or draft PR was created; no branch was
pushed; no merge, publication, external asset generation or Beyond transport was
attempted. This is ready for a later authorized review/delivery step.
