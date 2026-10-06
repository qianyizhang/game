# Sol artwork review — 2026-10-06

**Subsequent user decision: Hydra and Nightjar rejected.** The user clarified that style, cohesive design, posture and dynamics matter more than literal fidelity. The round-5 acceptance below is a historical reviewer decision that was too lenient, not the current quality status. Technically connected anatomy still read as pieces of wood stuck together. The subsequent direct rebuild changes gesture and composition rather than treating detail or anatomical accuracy as sufficient.

The user requested three further 3D samples implemented by **GPT-6.1-Sol**, independently audited and revised until they reach the accepted first set's stylized sculpture standard. The first set is Nightjar, Catalyst and Phoenix. This is a qualitative art review, not a model benchmark or evidence of photorealism.

## Responsibilities and sample

Sol owns the new models and integration; the parent reviewer owns the screenshots, defect decisions, browser coverage and [rulebook](art-direction.md) revisions. The parent does not replace Sol's modeling work. Existing source illustrations and game behavior are preserved.

| Sample | Existing source                          | What it tests                                                           |
| ------ | ---------------------------------------- | ----------------------------------------------------------------------- |
| Spiral | Blindside `fibonacci` Joker              | Expanding shell volume, aperture and lip, restrained material variation |
| Vajra  | Spire `vajra` relic                      | Pierced metalwork, fitted collars and grip, support contact             |
| Hydra  | Last Hearth `hydra` / Briar Hydra, beast | Shared body, three distinct neck gestures, skull and jaw connections    |

The samples were selected for different construction problems, not randomly. Shell and metal-object references supplement the source SVGs: [Smithsonian shell reference](https://ocean.si.edu/ocean-life/invertebrates/chambered-shells) and [LACMA Vajra](https://collections.lacma.org/object/43491). These are form references; the models are authored interpretations, not specimen replicas.

## Review protocol

`tests/browser/art3d-review.spec.ts` captures the same default camera, front, side, rear orbit, three motion times and 390 px phone layout. Initial playback is off and screenshots use studio lighting. Run through the repository's disposable-profile startup guard with approved execution on macOS:

```sh
npm run test:browser -- tests/browser/art3d-review.spec.ts \
  --grep 'Spiral|Vajra|Hydra' --output test-results/sol-audit-roundN
```

The reviewer opens the actual images. The harness checks render readiness and layout, **not aesthetic acceptance**. New studies use one rigid display animation; that is described as display motion, not creature animation. Mesh counts and texture-image counts are not quality criteria.

## Revision record

| Round | Independent finding                                                                                                                                                                    | Decision and response                                                                                                                                                                                             |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Hydra necks, legs and muzzles render as cut-open surfaces; shell is an open coil; Vajra mount ends before its load                                                                     | Reject all three. Sol found inward side winding in its new loft helper, corrected it, reoriented cross sections, overlapped shell whorls and connected the mount. A causal outward-normal/end-cap test was added. |
| 2     | Solids now render; mount contact repaired. Hydra remains an assembly of inflated torso masses, tubes and eyebrow rods. Spiral aperture is hidden. Vajra reads as a generic double cage | Reject overall quality; accept the topology/contact fixes. Reviewer revised the rulebook and requested continuous anatomy, visible shell opening and subject-specific metal construction.                         |

Round 3 resolves the shell opening and basic prong/grip structure and replaces Hydra's separate torso/neck roots with one surface. It remains **revise**: Hydra's skin exposes coarse mesh shading and head/neck seams, Vajra's fitted parts show gaps, and supports/feet require checking against the pedestal's actual top. The reviewer requested smooth surface normals, fitted joining volumes, physically grounded contacts and world-up rigid motion before acceptance.

Round 4 passes independent visual review for **Spiral and Vajra** across hero, side, rear, phone and sampled motion views: shell lip and growth relief are legible, the metal fittings meet, and the mounts remain seated. Hydra remains **revise** despite improved head/neck continuity: the side view reveals a flat torso, crescent-shaped hind legs, segmented paws and isolated dorsal bumps. Sol also found a clipped implicit-surface boundary and added a failing closure regression before repairing the sampling bounds. The next brief targets the whole body's gesture and connected limbs, not additional ornament.

Round 5 passes independent visual review for **Hydra**. Sol rebuilt torso, pelvis, tail, legs and paws as a continuous field, then removed jagged undersampled brow additions during its own 5b review. The independent capture confirms a domed back, tapered pelvis/tail transition, connected support limbs and continuous cranial planes in hero, side, rear, phone and sampled motion views. The parent reviewer did not edit any of the three models.

**Outcome: five independent review rounds; all three accepted by the reviewer at the stylized procedural object standard. User approval remains pending.** Spiral and Vajra were frozen after round 4. Hydra was frozen after round 5b self-review and independently captured as round 5. No claim is made that the rulebook alone guarantees future output quality; the observed improvement required specific visual feedback and reconstruction.

## What the rulebook learned

- Construction must be visible in multiple views: identifying labels, mesh names and a flattering hero view are insufficient.
- Geometry correctness and art quality are separate gates. Outward faces and watertight surfaces fixed defects but did not fix inflated proportions or generic forms.
- Review a creature's complete side-view gesture before polishing its face. Continuous shading, anatomical transitions and contact all matter.
- Judge motion in world space; a rigid local mesh can still lift off its support when the parent pivot is tilted.
- Freeze each review round, retain source with images, and distinguish author self-review, independent acceptance and user approval.

## Final verification and limits

The first full browser run passed 16 of 17 checks and exposed a GLB export failure for the new metal roughness textures. Sol corrected this by sharing a prepacked roughness/metalness map; the roughness channel and visible scalar metalness were preserved. Geometry did not change. The regression now checks the packed map contract and browser export checks require its embedded image data. Failed-run evidence remains under `test-results/sol-audit-before-export-fix/`.

Technical checks cover formatting, unit tests and the production build. New causal checks cover outward loft walls/end caps, closed Hydra anatomy and floor contact at the pedestal top throughout 145 sampled loop times. The build retains a size warning for the lazily loaded Three.js gallery chunk.

Final verification passes **249 unit tests / 35 files**, the production build, and **17 browser checks** covering six-study visual captures, animated GLB downloads with embedded textures, decoded video loops, phone layout, reduced motion, navigation focus and save preservation. The reviewer rechecked Hydra and Vajra pixels after the export-material fix. Final captures and downloads are in `test-results/sol-audit-final/`; source hashes are in `test-results/sol-audit-final-source/sha256.json`. The three new six-second display loops are assembled into `test-results/sol-audit-final-reel/three-studies.mp4` for viewing.

The new objects use rigid display oscillation and intentionally disable layer separation. They are not biological animation or specimen replicas. SVG originals, game rules, save formats and the accepted original three model builders remain unchanged during this exercise.

Round 1 was captured before Sol's self-corrections; its images retain those defects. From round 2 onward, the implementation is explicitly frozen for each capture and a source snapshot is retained separately. Evidence is under `test-results/sol-audit-baseline/`, `test-results/sol-audit-round1/` and subsequent numbered directories. These generated files are ignored; the rulebook, this decision record and implementation are durable.
