# Issue #71 · scoped verification

## Source and artifact pins

Baseline: `14f31860a4bf5c7bf568fbacf804c8cd60a3a9ca` (main, includes #65).
The [provenance receipt](provenance.json) binds exact renderer/test bytes, selected
images, viewport, seed, runtime and official Chrome package checksum. Exported
SVG pixel hashes and changed-ID scope live in [svg-review.json](svg-review.json).
The final commit is recoverable on branch `art/issue-71-engraved-planets`.

## Passed scopes

| Scope                                   | Command / evidence                                                                                                                                                                                          | Result                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| All SVG exports                         | `npm run assets:export -- test-results/issue71/v2`                                                                                                                                                          | 644 standalone SVGs                                                                      |
| All SVG decode + scope                  | `npm run assets:review -- <nine planet IDs> --from test-results/issue71/v2 --before test-results/issue71/before --out test-results/issue71/review-v2 --sharp-module /tmp/planet-runtime/node_modules/sharp` | 644 + 644 decoded; nine changed, zero added/removed, 635 unchanged                       |
| Collection + export + booster           | `npx playwright test --project=functional tests/browser/artwork.spec.ts tests/browser/art-export.spec.ts --grep 'planet\|balatro illustrations\|standalone SVG'`                                            | Three journeys passed; the new pocket journey initially failed on its navigation locator |
| Pocket journey after locator correction | `npx playwright test --project=functional tests/browser/artwork.spec.ts --grep 'planet identities'`                                                                                                         | Passed in 6.1 s; 9.3 s process                                                           |
| Affected static lint                    | `npx eslint src/games/balatro/ui/art/planets.tsx src/games/balatro/ui/art/consumables.tsx tests/browser/artwork.spec.ts --max-warnings=0`                                                                   | Passed                                                                                   |
| Workspace types                         | `npm run typecheck`                                                                                                                                                                                         | Passed                                                                                   |
| Production                              | `npm run build`                                                                                                                                                                                             | Passed; existing large-chunk advisory retained                                           |
| Rule/save boundary                      | `npm run test -- src/games/balatro/domain/game.test.ts src/games/balatro/domain/strategy.test.ts src/games/balatro/application/session.test.ts`                                                             | 22 tests / 3 files passed                                                                |
| Inventory                               | `npm run maintenance -- check`                                                                                                                                                                              | 815 managed sources; zero errors before final documentation staging                      |

Commands use Node 24.21.0 / npm 11.19.0. Browser tests use the repository's unchanged
startup guard, Playwright 1.64.0 and official Google Chrome 156.0.8078.73 unpacked
inside `/tmp`; `CARD_WORKSHOP_CHROME_EXECUTABLE` points to that binary. No CI flag,
profile, startup guard, security configuration or runtime contract was changed.
Google package URL and SHA-256 are recorded in the provenance receipt.

## Protected player outcomes

- All nine named planets remain in the collection with decorative, non-focusable SVGs.
- Jupiter and Saturn are acquired through actual $3 shop buttons from a legal replay.
- Both appear in a live Big Blind at 56 px desktop / 48 px phone width.
- Keyboard Enter consumes Jupiter and raises Straight from 1 to 2; Saturn raises
  Flush from 1 to 2. Deck and held cards do not change from planet use.
- Reload and downloaded replay import reconstruct the same consumed inventory and levels.
- A Mega Celestial Pack shows five choices. Pocket use is disabled while choosing;
  a pick raises its hand immediately, leaves pocket inventory intact and persists
  the remaining choice on reload. Skipping returns to the shop and re-enables use.
- Phone layouts retain controls and fit the viewport.

## Pixel verdict and limits

Author inspected every world enlarged/native, the 48 px pocket comparison, whole
collection, desktop/phone in-play table and phone booster. V1 exposed a pointed
storm contour and hooked Saturn ring tips; V2 rounds the storm and replaces the
ring with a clean front/back annulus. Identity is carried by broad silhouettes and
surface planes. Independent visual acceptance is still pending; automated decoding
and changed pixels are technical evidence, not an aesthetic verdict.

The new pocket test first looked for a nonexistent Play label, then attempted the
desktop game button while the phone layout hides it. The final journey reloads the
persisted shop after viewing the collection. These were test-locator failures; no
application navigation change was made. Failure logs and trace remain under
`test-results/issue71/`; earlier successful export, collection and booster evidence
was reused because subsequent edits only corrected the pocket test locator.

This is scoped art validation. Full application/simulation, unrelated browser,
geometry and native Blender suites were not run. No mechanics, content or model
construction changed. Do not credit this result as a full release validation.

## Delivery blocker

Draft PR creation for `qianyizhang/game`, head `art/issue-71-engraved-planets`, base
`main`, was **denied**, known not executed. Automatic approval review stated:
"Opening a draft pull request is an external repository commitment, and the transcript
contains no user authorization for this unrelated game-art change or repository action."
The exact action stopped; no indirect PR route or retry was used. Implementation,
evidence and scoped checks continued locally. Current direct authorization is needed
to retry the draft PR action; no approval or merge was attempted.
