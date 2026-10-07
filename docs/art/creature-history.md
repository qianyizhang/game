# Creature direction and guided trials

**Evidence availability after cleanup:** this is dated history. The exact inputs consumed by the trace-viewer case, curated deliveries and external reference PNGs remain. Other historical paths below describe the original runs and may have been retired; they are not current navigation instructions. [Cleanup outcomes](../engineering/cleanup-triage.md) record the boundary.

Historical review and authorship evidence from 2026-10-06. **Current distinction:** the earlier Hydra and Nightjar were rejected; the later living Hydra received positive user feedback. Final Nightjar and Phoenix are mixed-authorship rebuilds, with user approval unrecorded. Reviewer acceptance in earlier rounds does not override these outcomes. The [rulebook](art-direction.md) is the current visual authority.

## Sol artwork review — 2026-10-06

**Subsequent user decision: Hydra and Nightjar rejected.** The user clarified that style, cohesive design, posture and dynamics matter more than literal fidelity. The round-5 acceptance below is a historical reviewer decision that was too lenient, not the current quality status. Technically connected anatomy still read as pieces of wood stuck together. The subsequent direct rebuild changes gesture and composition rather than treating detail or anatomical accuracy as sufficient.

The user requested three further 3D samples implemented by **GPT-6.1-Sol**, independently audited and revised until they reach the accepted first set's stylized sculpture standard. The first set is Nightjar, Catalyst and Phoenix. This is a qualitative art review, not a model benchmark or evidence of photorealism.

### Responsibilities and sample

Sol owns the new models and integration; the parent reviewer owns the screenshots, defect decisions, browser coverage and [rulebook](art-direction.md) revisions. The parent does not replace Sol's modeling work. Existing source illustrations and game behavior are preserved.

| Sample | Existing source                          | What it tests                                                           |
| ------ | ---------------------------------------- | ----------------------------------------------------------------------- |
| Spiral | Blindside `fibonacci` Joker              | Expanding shell volume, aperture and lip, restrained material variation |
| Vajra  | Spire `vajra` relic                      | Pierced metalwork, fitted collars and grip, support contact             |
| Hydra  | Last Hearth `hydra` / Briar Hydra, beast | Shared body, three distinct neck gestures, skull and jaw connections    |

The samples were selected for different construction problems, not randomly. Shell and metal-object references supplement the source SVGs: [Smithsonian shell reference](https://ocean.si.edu/ocean-life/invertebrates/chambered-shells) and [LACMA Vajra](https://collections.lacma.org/object/43491). These are form references; the models are authored interpretations, not specimen replicas.

### Review protocol

`tests/browser/art3d-review.spec.ts` captures the same default camera, front, side, rear orbit, three motion times and 390 px phone layout. Initial playback is off and screenshots use studio lighting. Run through the repository's disposable-profile startup guard with approved execution on macOS:

```sh
npm run test:browser -- tests/browser/art3d-review.spec.ts \
  --grep 'Spiral|Vajra|Hydra' --output test-results/sol-audit-roundN
```

The reviewer opens the actual images. The harness checks render readiness and layout, **not aesthetic acceptance**. New studies use one rigid display animation; that is described as display motion, not creature animation. Mesh counts and texture-image counts are not quality criteria.

### Revision record

| Round | Independent finding                                                                                                                                                                    | Decision and response                                                                                                                                                                                             |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Hydra necks, legs and muzzles render as cut-open surfaces; shell is an open coil; Vajra mount ends before its load                                                                     | Reject all three. Sol found inward side winding in its new loft helper, corrected it, reoriented cross sections, overlapped shell whorls and connected the mount. A causal outward-normal/end-cap test was added. |
| 2     | Solids now render; mount contact repaired. Hydra remains an assembly of inflated torso masses, tubes and eyebrow rods. Spiral aperture is hidden. Vajra reads as a generic double cage | Reject overall quality; accept the topology/contact fixes. Reviewer revised the rulebook and requested continuous anatomy, visible shell opening and subject-specific metal construction.                         |

Round 3 resolves the shell opening and basic prong/grip structure and replaces Hydra's separate torso/neck roots with one surface. It remains **revise**: Hydra's skin exposes coarse mesh shading and head/neck seams, Vajra's fitted parts show gaps, and supports/feet require checking against the pedestal's actual top. The reviewer requested smooth surface normals, fitted joining volumes, physically grounded contacts and world-up rigid motion before acceptance.

Round 4 passes independent visual review for **Spiral and Vajra** across hero, side, rear, phone and sampled motion views: shell lip and growth relief are legible, the metal fittings meet, and the mounts remain seated. Hydra remains **revise** despite improved head/neck continuity: the side view reveals a flat torso, crescent-shaped hind legs, segmented paws and isolated dorsal bumps. Sol also found a clipped implicit-surface boundary and added a failing closure regression before repairing the sampling bounds. The next brief targets the whole body's gesture and connected limbs, not additional ornament.

Round 5 passes independent visual review for **Hydra**. Sol rebuilt torso, pelvis, tail, legs and paws as a continuous field, then removed jagged undersampled brow additions during its own 5b review. The independent capture confirms a domed back, tapered pelvis/tail transition, connected support limbs and continuous cranial planes in hero, side, rear, phone and sampled motion views. The parent reviewer did not edit any of the three models.

**Outcome: five independent review rounds; all three accepted by the reviewer at the stylized procedural object standard. User approval remains pending.** Spiral and Vajra were frozen after round 4. Hydra was frozen after round 5b self-review and independently captured as round 5. No claim is made that the rulebook alone guarantees future output quality; the observed improvement required specific visual feedback and reconstruction.

### What the rulebook learned

- Construction must be visible in multiple views: identifying labels, mesh names and a flattering hero view are insufficient.
- Geometry correctness and art quality are separate gates. Outward faces and watertight surfaces fixed defects but did not fix inflated proportions or generic forms.
- Review a creature's complete side-view gesture before polishing its face. Continuous shading, anatomical transitions and contact all matter.
- Judge motion in world space; a rigid local mesh can still lift off its support when the parent pivot is tilted.
- Freeze each review round, retain source with images, and distinguish author self-review, independent acceptance and user approval.

### Final verification and limits

The first full browser run passed 16 of 17 checks and exposed a GLB export failure for the new metal roughness textures. Sol corrected this by sharing a prepacked roughness/metalness map; the roughness channel and visible scalar metalness were preserved. Geometry did not change. The regression now checks the packed map contract and browser export checks require its embedded image data. Failed-run evidence remains under `test-results/sol-audit-before-export-fix/`.

Technical checks cover formatting, unit tests and the production build. New causal checks cover outward loft walls/end caps, closed Hydra anatomy and floor contact at the pedestal top throughout 145 sampled loop times. The build retains a size warning for the lazily loaded Three.js gallery chunk.

Final verification passes **249 unit tests / 35 files**, the production build, and **17 browser checks** covering six-study visual captures, animated GLB downloads with embedded textures, decoded video loops, phone layout, reduced motion, navigation focus and save preservation. The reviewer rechecked Hydra and Vajra pixels after the export-material fix. Final captures and downloads are in `test-results/sol-audit-final/`; source hashes are in `test-results/sol-audit-final-source/sha256.json`. The three new six-second display loops are assembled into `test-results/sol-audit-final-reel/three-studies.mp4` for viewing.

The new objects use rigid display oscillation and intentionally disable layer separation. They are not biological animation or specimen replicas. SVG originals, game rules, save formats and the accepted original three model builders remain unchanged during this exercise.

Round 1 was captured before Sol's self-corrections; its images retain those defects. From round 2 onward, the implementation is explicitly frozen for each capture and a source snapshot is retained separately. Evidence is under `test-results/sol-audit-baseline/`, `test-results/sol-audit-round1/` and subsequent numbered directories. These generated files are ignored; the rulebook, this decision record and implementation are durable.

## Creature redesign — gesture and cohesive style

The user rejected the prior Hydra and Nightjar, then clarified the actual problem: living things felt like wooden logs joined together. The request is for style, posture, dynamics and a coherent design, not pixel accuracy or literal fidelity to the source illustration. This correction takes priority over the earlier favorable reviews.

### References and design decisions

- [RSPB Nightjar guide](https://www.rspb.org.uk/birds-and-wildlife/identifying-birds/all-about-nightjars) and [Cornell's photographed Cuban Nightjar](https://ebird.org/species/granig2?siteLanguage=es): inspected the relation between crown, folded wings, tail and resting support. The earlier Nightjar pass interpreted that relation in bronze; it is not a species reconstruction. A literal plumage treatment was tried and discarded when it remained visually inert.
- Gustave Moreau's _Hercules and the Lernaean Hydra_: inspected the painting's unequal neck arcs and negative spaces through a [public reproduction](https://eclecticlight.co/2020/08/29/here-be-monsters-in-paintings/). The [Art Institute collection entry](https://www.artic.edu/artworks/20579/hercules-and-the-lernaean-hydra) identifies the work; its page was blocked in the research browser. [Getty's iconographic record](https://www.getty.edu/cona/CONAIconographyRecord.aspx?iconid=901001023) supplies the serpentine context. The new composition retains three heads from the game's subject, rather than copying the painting.

The photographs and painting were reference material only; no remote image or model was incorporated into the assets.

### Implemented direction

**Nightjar — earlier bronze pass, superseded by the guided living rebuild:** a continuous raised crown, neck, breast and back with a descending tail; thin folded feather planes fit the body surface. The eye position is fitted to the cranial surface. A single curved branch and short gripping feet replace the thick log assembly and decorative moon stand. The sculpture uses the same restrained bronze treatment throughout. Motion is subtle body/wing breathing and tail movement, without the former detached-head pivot.

**Hydra — first coiled pass, subsequently rejected as overly simplified:** a coiled foundation replaces the squat four-legged body. Three necks reach in different directions and occupy different heights; the central sweep carries the composition while the lower heads answer it. Wedge-shaped skulls, articulated jaws, small eyes and limited ventral relief replace the smooth sock heads. Warm aged bronze unifies the subject. Its animation remains a rigid display oscillation, not a living-creature rig.

**Hydra — living rebuild:** the user's further rejection prompted a change in physical interpretation. Moss-green skin, a quieter pale throat and worn keratin replace bronze. The dominant raised head threatens, the lower narrow head searches and the broader side head watches. Recessed eyes, integrated brow/temple planes, interlocking crown plates, curved dentition, gums, palate and tongue replace the smooth wedge faces. Unequal horn crowns include a worn short horn on the lower head. Larger dorsal shields follow the necks and coil; small locally generated scales follow the surface instead of stretching across a planar projection.

A shared 28-bone rig bends the three necks independently, with roots and the coil held still. Fitted armor uses the same skin weights. The heads turn and the jaws open with staggered timing in the six-second loop. The GLB carries the same rig and clip. This is stylized living anatomy and an authored idle, not a simulated animal.

The revisions were made directly in `src/art3d/models.ts`, `src/art3d/newStudies.ts` and `src/art3d/hydra.ts`. Shared rules are consolidated in [the aesthetic rulebook](art-direction.md), especially “Living subjects need a designed gesture.” This record does not grant user approval or claim anatomical realism.

### Review evidence

Before-source snapshots: `test-results/creature-redo-baseline/`. Intermediate multi-view captures: `test-results/creature-redo-round3/` through subsequent numbered directories. Reference browser captures: `test-results/creature-references/` and the Moreau capture under `test-results/creature-redo-nightjar2/`.

Review exposed and corrected depth offsets ignored by the bird section builder, misplaced facial features, overly bulky wing volumes and mobile caption overlap. Tests establish rendering/export behavior; they do not establish whether the style succeeds. The next user response remains the authority on that judgment.

Verification of the previous creature pass: **249 unit tests across 35 files**, formatting and production build pass. The full gallery browser run passes **17 checks**; a subsequent **3-check targeted run** rechecks Nightjar's final closed-vane surface correction, its video and all six GLB exports. Final evidence is under `test-results/creature-redo-final/` and `test-results/creature-redo-finish/`. The 12-second H.264 preview is `test-results/creature-redo-reel/two-creatures.mp4`; decoding and its 360-frame duration were checked. The existing lazy-gallery bundle-size warning remains.

Catalyst, Phoenix, Spiral and Vajra builders were compared against the turn baseline and remain unchanged. No game rule, save format or SVG source was edited. Generated material and geometry remain local and exportable; no external reference image is bundled.

### Living Hydra review

The preserved bronze baseline is `test-results/hydra-living-before/`, with source snapshots in `test-results/hydra-living-source-before/`. The successive `hydra-living-round1/`, `round2/` and `round3/` captures record author review of the hero, front, side, rear, three motion times and phone view. Round 3 also includes an enlarged capture. Review corrected the coil's stretched texture, excessive throat contrast and the abrupt end of the neck armor by continuing low shields onto the coil. The independent neck motion replaces rigid oscillation.

Technical evidence is kept separately from visual judgment. The user subsequently responded “this is much better” and asked to transfer the methodology into the rulebook and trial guided Sol 6.1 production. This accepts the living Hydra direction as a useful quality reference; it is not a claim of photorealism or approval of every detail. The current model remains procedural and stylized; there is no muscle solver, facial soft-tissue simulation or subsurface skin shader.

Current Hydra verification: **249 unit tests across 36 files**, formatting and production build pass. The gallery/shell run passed 16 browser checks and exposed a Hydra normal-map export failure; the corrected map passed a subsequent three-check run covering all six GLB exports, Hydra's multi-view captures and video. Reloaded Hydra GLB vertices match the live deformed skin within 0.0001 model units at three sampled times. A final live-gallery check exposed a negative startup frame delta after model construction; clamping that delta passed the targeted playback/video check. The existing lazy-gallery bundle warning remains.

Delivery files and a source-hash manifest are in `test-results/hydra-delivery/`. Final visual/export evidence is in `test-results/hydra-living-export-fixed/`; startup-clock evidence is in `test-results/hydra-living-clock-fixed/`. Other study builders were compared with the preserved source snapshot and remain byte-identical. No game rules, saves or SVG sources changed.

### Nightjar and Phoenix continuation

The user requested the living-Hydra method in the shared rulebook and explicitly selected **both Nightjar and Phoenix** for the next work. The [guided Sol 6.1 trial](creature-history.md) owns the current bird briefs, authorship and review evidence. The earlier bronze Nightjar above is historical context, not the current material target. The Hydra model is preserved through this continuation.

## Guided Sol 6.1 creature trial

The user positively received the living Hydra and requested that its methodology be added to the rulebook and applied to **both Nightjar and Phoenix**, with a trial of Sol 6.1 under guidance. The [rulebook](art-direction.md) is the shared visual authority; this document records the trial rather than duplicating its criteria.

**Result:** both birds are mixed-authorship rebuilds. Two `gpt-6.1-sol` workers at **high** effort produced connected anatomy, articulated plumage and anchored rigs through four guided rounds each. Neither round-4 candidate met the Hydra reference in the parent's independent visual review. The parent then directly finished both subjects. This supports using Sol for scoped construction under close review; it does **not** establish Hydra-level craft from guidance alone or rank models generally.

### Assignment and attribution

| Responsibility                    | Owner                      | Scope                                                                                                       |
| --------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Nightjar construction and motion  | `gpt-6.1-sol`, high effort | `src/art3d/nightjar.ts`, optional subject tests; one living bird and its fitted perch                       |
| Phoenix construction and motion   | `gpt-6.1-sol`, high effort | `src/art3d/phoenix.ts`, optional subject tests; one living bird and its fitted support                      |
| Direction, integration and review | Parent                     | Rulebook, source registration, clip wiring, shared browser tests, independent pixel review and final checks |

The two workers initially had isolated ownership. The parent provided an accepted reference, briefs and visual criticism; workers implemented their own modeling revisions through the numbered Sol rounds. After each subject's round 4, the parent explicitly took over its final artwork. This is an observational trial of the guided collaboration, not a controlled comparison or evidence of unaided model ability. No additional workers were involved.

### Baselines and briefs

Preserved source: `test-results/sol61-creature-baseline-source/`, including its hash manifest. Initial native, front, side, rear, motion and phone captures: `test-results/sol61-nightjar-before/` and `test-results/sol61-phoenix-before/`. The accepted Hydra comparison is `test-results/hydra-delivery/`.

**Nightjar:** a living dusk-plumaged bird, crouched and listening from a thin ascending branch. A low crown, short neck and compressed chest should join the tapered back; fitted folded wings and a descending tail answer that gesture. Ash/umber plumage, a subdued pale throat, matte bill and feet, recessed eyes and toes wrapped around the branch replace the uniform bronze treatment.

**Phoenix:** a living firebird in a specific asymmetric moment, with a lifted chest and continuous neck/head. Shoulder, elbow and wrist paths must carry broad overlapping feather planes; primaries separate mainly at their tips. Ember, charcoal and ochre should distinguish feather regions while keeping quiet areas. Talons and support stay fitted as the wings and tail respond.

### Review protocol

Each worker first returns a frozen construction candidate, before elaborate surface polish. The parent captures front/side/rear views and names visible defects. Subsequent source snapshots and captures remain associated with their own review round. Reviews separate construction, materials, movement, phone framing and portable export behavior. Parent acceptance remains distinct from user approval.

### Review rounds

| Subject / round          | Independent finding                                                                                                                                                                                                                           | Decision and direction                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phoenix 1 — construction | Fuller living breast and planted support, but the hero remained nearly symmetric; fat red upper-arm bands, capped thighs, separate rear shoulder flaps, a bottle-like neck/crown and uniformly cupped feather tiles retained the toy reading. | Revise construction before texture. Change wing height/depth/folding, bury limb roots in transition volumes, curve the neck and sweep the crest, and form thinner overlapping flight planes. |

Phoenix round-1 source and captures: `test-results/sol61-phoenix-round1-source/` and `test-results/sol61-phoenix-round1/`. The parent registered the worker's builder and motion exports and removed superseded Phoenix-only helpers; it did not change the model geometry in this round.

**Nightjar 1 — construction:** independent review found a disconnected far leg, an elevated branch root, a forehead shading seam, large pale leaf-like coverts over a flat wing slab, and a body held too high above the grip. The worker independently identified the same contact, seam and wing failures. The parent requested joined/tucked legs and gripping toes, actual plinth contact, continuous head shading and a more compressed crouch with coherent folded flight feathers. Construction was not accepted; surface detail remained deferred. Source and captures: `test-results/sol61-nightjar-round1-source/` and `test-results/sol61-nightjar-round1/`.

**Phoenix 2 — construction:** the raised/lowered wing relationship, curved neck profile and swept crest improved the gesture enough to begin the plumage pass. This was not final visual acceptance. Enlarged and rear views still showed a smooth rubber-like torso, exposed shoulder tubes, regular feather curtains and repeated hooked tail ribbons. The parent requested fitted scapular and body plumage, less uniform flight-feather spacing and curves, a dominant tail plume, integrated eye/crown structure and form-following material detail. Source and captures: `test-results/sol61-phoenix-round2-source/` and `test-results/sol61-phoenix-round2/`.

**Nightjar 2 — construction:** independent hero/end-on/rear/enlarged review confirmed corrected feet, support contact and forehead crack, with more readable folded wings. The long bare neck still suggested a miniature goose and the forehead had an abrupt broad shading band. The parent requested a shorter head-to-chest reach, fuller nape, continuous cranial shading, fitted low-relief body plumage, muted ash/umber mottling and cream throat, visible remige hierarchy without noisy intersecting edges, and directional weathered bark. The worker was cleared to develop materials while incorporating these form corrections; final acceptance remained open. Source and captures: `test-results/sol61-nightjar-round2-source/` and `test-results/sol61-nightjar-round2/`.

**Phoenix 3 — first surface pass:** enlarged review rejected the candidate: the new breast relief formed parallel onion-like flutes, the shoulder groups remained leaf-like and the flight/tail surfaces read as regular paper/rubber strips. Fine maps existed but did not supply visible craft at the reviewed size; feet remained pale plastic forks. The parent also inspected the material formula: the barb pigment varied by roughly 1.6 byte levels before filtering, while body detail repeated densely and used a small normal scale. This technical diagnosis was returned to the author alongside the visual critique. The parent requested staggered shallow contour plumage, long coverts fitted along the shoulder/arm, flatter asymmetric vanes with fanning shafts and varied tip shapes, narrower flowing tail vanes, scaled darker feet with keratin claws, and broader basalt fissures. The revised source and captures remain preserved in `test-results/sol61-phoenix-round3-source/` and `test-results/sol61-phoenix-round3/`.

Reference refreshed for the surface revision: [Cornell's feather anatomy guide](https://academy.allaboutbirds.org/feathers-article/) distinguishes flat asymmetric flight vanes from overlapping body contour feathers and wing coverts; [Agi's wing-group diagram](https://www.federn.org/hilfe_en.html) shows their regional relationship. Those references informed construction decisions only. No external images or models were incorporated.

**Nightjar 3 — first surface pass:** independent review rejected the broad rectangular camouflage patches, the regular deeply striped branch and the weak fine feather read. The parent traced a contributing texture defect to a per-cell hash abruptly changing a sine phase at rectangular cell boundaries, and requested continuous soft elongated streaks with tapered feather tips, directional barbs and muted regional plumage. The shortened head/nape also needed a smoother contour. Bark needed irregular broken ridges and lower contrast; folded feathers needed flatter vanes and cleaner overlaps. Source and captures: `test-results/sol61-nightjar-round3-source/` and `test-results/sol61-nightjar-round3/`.

**Nightjar 4 — guided trial limit and handoff:** continuous feather masks removed the grid and the nape was smoother, but the enlarged result remained a smooth cream bird with long aligned strokes, pale leaf-like wings and a pipe-like branch. The parent did not accept it as matching the Hydra reference. The worker agreed and froze source (`4636097d2651d44c7a47932f40cb164a2dfd732cbe609e120da504e8f3240b87`), handing off direct artwork responsibility. Captures and source: `test-results/sol61-nightjar-round4/` and `test-results/sol61-nightjar-round4-source/`.

**Nightjar — direct parent finish:** the parent retained Sol's connected construction, rig, fitted feet and tests, rebuilt the local feather atlas with overlapping tips, broken shaft markings, regional values and readable barbs, adjusted cranial texture scale, introduced a pale throat/facial stripe and dark orbital field, added a wide gape and small rictal bristles, revised bark/feather shading, and added a short authored blink that closes the eye layers to a slit. Thin vanes retain cast shadows but no longer receive self-shadow speckle. A separate eyelid cap was rejected in parent review and replaced by the slit closure. Source/captures are in `test-results/sol61-nightjar-parent1*` and `test-results/sol61-nightjar-parent2*`; final exported evidence is recorded below. This is explicitly a mixed-authorship result, not evidence that guidance alone brought Sol to the reference quality.

**Phoenix 4 — guided trial limit and handoff:** the asymmetric pose, darker grip and narrower tails improved, but independent enlarged, side, rear and phone review still found an exposed rear spar, a smooth orange breast, planar shoulder leaves, engraved chevrons and column-like basalt. The phone plinth also overlapped its caption. The worker independently agreed with the craft limitations and froze source (`9690811f9943767741d345e6f0fea483d9d3ae257ba7da7e30e5f5b552b9bafd`) for handoff. Source/captures: `test-results/sol61-phoenix-round4-source/` and `test-results/sol61-phoenix-round4/`.

**Phoenix — direct parent finish:** the parent retained Sol's anatomy, unequal gestures and motion rig, replaced the surface maps, removed conspicuous raised barb chevrons, added a dark facial field and warmer throat, redistributed the fitted breast plumage, and replaced the crossing shoulder leaves with low-relief feather patches fitted around the arm's full circumference. A first planar wrapping attempt was rejected for visible intersections; the final patches follow the curved arm surface. Basalt now has irregular fractured planes rather than smooth cylinder walls. The mobile canvas reserves a separate caption strip for every subject. Source/captures: `test-results/sol61-phoenix-parent1*`, `test-results/sol61-phoenix-parent2-source/`, `test-results/sol61-creatures-final-review/` and the final `test-results/sol61-phoenix-parent3*`.

**Remaining visual limits:** both are stylized procedural studies. Nightjar's folded vanes remain broad and its mottling somewhat regular; Phoenix's flight rows and trailing vanes remain simpler than the accepted Hydra's anatomy and surface hierarchy. These final parent-reviewed candidates are improvements over the baselines, not a declaration of equal quality or user approval.

### Integration and delivery

The parent replaced the registry's older bird builders with each worker's dedicated module, wired each subject's motion-track factory, and removed obsolete shared bird motion branches. The accepted Hydra source, `StudyViewer.tsx`, and Catalyst/bottle builders compare unchanged against the turn baseline. The responsive gallery CSS now reserves space below the mobile canvas for its caption.

The extended browser export check reloads each creature's GLB, compares sampled deformed vertices and every animated node matrix at three times, and captures original/imported models under identical neutral lighting for material review. Nightjar's samples include the closed-eye pose. Verification receipts follow below.

| Final check                     | Result                                                                                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                 | Passed: formatting, **252 tests in 38 files**, TypeScript and production build                                                                                                                     |
| Gallery and shell browser suite | **11 passed**: six animated model exports, six playable recordings with changing decoded frames, images, inspection controls, reduced motion, phone layout, navigation focus and save preservation |
| Dedicated visual captures       | Nightjar and Phoenix front/side/rear, enlarged view, three motion times and phone; Nightjar also at blink closure. Parent inspected the final images.                                              |
| Reloaded GLB deformation        | Maximum sampled vertex error: Nightjar **5.73e-8**, Phoenix **4.76e-8**, Hydra **7.12e-8** model units; animated-node matrix error **0** for all three                                             |
| Reloaded material appearance    | Parent inspected identically lit original/imported pairs for all three creatures; no material loss observed. This is a visual review, not a pixel-identity assertion.                              |

Final evidence: `test-results/sol61-creatures-delivery/` holds both birds' views, all six GLBs and WebMs, creature roundtrip images/metrics, and `source/SHA256SUMS`. Runtime originals remain in `test-results/sol61-creatures-final/`. Nightjar's final visual set is `test-results/sol61-creatures-final-review/`; Phoenix's final set is `test-results/sol61-phoenix-parent3/`. Earlier rejected captures remain separate.

Non-failing diagnostics: Vite reports the large lazy-loaded 3D bundle; GLTFExporter normalizes some generated tip normals. Neither interrupted export or the checks above. The localhost gallery is the editable source preview; no remote deployment was performed.
