# Blindside boss plate review · issue 43

Eight boss plates now depict a card encountering the blind rule. The print ground, forest ink, ochre, and restrained coral remain shared with the rest of Blindside. The illustrated cue is intentionally secondary to the unchanged HTML name and rule text.

| Plate  | Encounter cue                                            |
| ------ | -------------------------------------------------------- |
| Thorn  | A club face card caught and crossed by a thorned branch. |
| Mask   | A face card pulled behind a stage mask.                  |
| Pinch  | Pincers close on cards beside the last discard token.    |
| Narrow | Two slanted walls constrict the card path.               |
| Lock   | A first card approaches a sealed lock.                   |
| Five   | Five cards pass under a single gate.                     |
| Wall   | A scoring approach meets a crenellated barrier.          |
| Crown  | The final crown sits high on a stepped throne.           |

## Matched evidence

Each image places the baseline on the left and candidate on the right. The four SVG sheets show all eight exports at enlarged and native size: [Thorn and Mask](sheet-01.png), [Pinch and Narrow](sheet-02.png), [Lock and Five](sheet-03.png), [Wall and Crown](sheet-04.png).

- [Bosses collection at desktop size](collection-desktop-comparison.png) and [390 px](collection-phone-comparison.png)
- [Boss blind intro at desktop size](boss-intro-desktop-comparison.png) and [390 px](boss-intro-phone-comparison.png)
- [Active boss blind at desktop size](boss-playing-desktop-comparison.png)
- [Active boss blind at 390 px](boss-playing-phone-comparison.png)

The baseline is `origin/main` at `3dfba6aeadefe0dcbdc1a7b80bf847822d40196e`, before editing. Its `bosses.tsx` SHA-256 is `6c8519d216fe5f7335b01e9408b9d48fe2ffcf388003905c2f0fbb9e848698f9`. The candidate source SHA-256 is `704a578ea1106c47dc1273f37512265869a5a0fdd45217904c50d9caf9a001f1`. Both catalogues contain 644 SVGs. Sharp 0.35.5 decoded every asset at 144 dpi; pixel comparison found exactly the eight `blindside/bosses/*` IDs changed and 636 IDs unchanged, with no additions or removals. The post-review restoration of the original unknown-ID coin fallback changed none of the 644 exported pixels compared with the first candidate.

The UI captures used the same `FIRST-LIGHT` seed, skipped Small and Big Blind and the resulting pack choices, then captured The Wall in ready and playing phases. They used installed Chromium because stable Chrome was unavailable in this cloud image. The before and after DOM observations matched for boss name, 600 point target, rule description, controls and accessible card names. The 390 px collection and playing layouts had no horizontal overflow or page errors. A separate 390 px Chromium interaction smoke started The Wall from the `FIRST-LIGHT` seed, confirmed eight accessible playing cards and the 600 point target, reloaded the boss-ready save without a byte change, and exported/imported the boss-playing replay with the same saved bytes and no page errors. These visual previews do not substitute for the repository's Chrome Playwright gate or independent visual review.
