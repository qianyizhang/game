# Emberwake silhouette comparison

The hero and crypt artwork was accepted and merged in [PR 24](https://github.com/qianyizhang/game/pull/24). This is a new gallery presentation of existing artwork, not a new art delivery or Site publication. The standalone offline gallery is built with `npm run assets:gallery -- <fresh-directory>`; its index links to the self-contained `emberwake.html` comparison.

The new screenshots use the production scene renderer with a frozen sandbox fixture: seed `gallery-29-matched`, Silent Courtyard (`bells-1`), time zero, 960 × 576 backing pixels and the same camera and actor positions. Each row shows Rook, Mira or Silas with a staged hollow archer, salt wraith and Bellkeeper; synthetic enemy positions and health are presentation fixtures rather than campaign witnesses. The zooms are identical 280 × 125 crops enlarged 2× with nearest-neighbor sampling. The scene sheets stack the three original 960 × 576 captures. Images are WebP for the offline size budget.

The baseline renderer is from pre-art `e2515a988562b185b9f10ffe340c63f641323a03`; neither hero-art nor crypt-art exists at that commit. Its `render.ts` SHA-256 is `3c18cc43a6145f002ac63ad44e91bea6911e2a7783a994458909e13400127086`. The accepted source is `ad76602df81777fb2f7c443b388638940f7bf470`; its render, hero-art and crypt-art files match main `0f46518` byte for byte. The baseline and accepted commits have no domain or skill-effects differences. Both views use those common dependencies.

| Evidence          | SHA-256                                                            |
| ----------------- | ------------------------------------------------------------------ |
| before-scene.webp | `d2f496fe3472622d768881774f0743026e834a94df37313e6fe7a4808f789b7c` |
| after-scene.webp  | `b7b0583f308761033bd92ab5848463f82aaa42c94712c5613912bbf560436a19` |
| before-zoom.webp  | `a0bdb5cf9d8fe9bfb44556dafcbe1a49d2aef6c191e838f20745bd04cc5c94da` |
| after-zoom.webp   | `31bb6cd1211913b9774be75d46bc64c82ffed3e788938dbef583cb6ac7dfc0de` |

The prior art acceptance was sampled desktop review, not exhaustive effects or campaign coverage. Its sampled CPU submission p90 of 1.05–1.65 ms is not GPU FPS or physical-device performance. An independent reviewer inspected all four comparison images. Hosted Chrome checked the generated gallery's navigation, controls, images and phone layout separately; local full-page visual QA was blocked by browser administrator policy. No Site publication has occurred.
