# Briar Scavenger — eighth sequential creature conversion

**Scope:** Hearth `hyena` / Briar Scavenger, registered as `scavenger` in the 3D gallery. Its existing `AnimalPortrait` in `MinionArt.tsx` supplies the sloping canine profile, dun coat, pale muzzle, dark mane and spots. Hydra supplies the living anatomical direction and Phoenix the fitted-motion comparison. Original artwork and earlier creature builders remain unchanged.

The model was authored and reviewed directly, without delegation. It is **author-reviewed**, not user-approved.

## Brief and interpretation

A scavenger pauses after scenting, bracing on staggered paws as its broad head turns toward a sound. Heavy shoulders descend into a tucked flank and leaner hindquarters. Rounded ears listen independently; a short brush tail carries a restrained delayed response. The gallery, enlarged inspection and narrow phone view are the intended sizes.

The [San Diego Zoo's spotted hyena reference](https://animals.sandiegozoo.org/animals/spotted-hyena) informed the thick neck, strong jaw, longer front legs, rounded ears, short mane, coarse coat and four clawed toes. These inform a fantasy interpretation of the existing artwork, not a species reconstruction.

## Revisions seen in pixels

| Pass         | Finding and correction                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction | The first separate mane locks resembled dorsal spikes. Replaced them with a continuous shallow ridge. Reduced the exaggerated hind-leg fold so the standing stance carries weight through the hocks. |
| Coat         | Large round spots dominated the flank. Made them smaller, irregular and less evenly distributed; retained quieter head and lower-leg regions.                                                        |
| Mane         | The first thick fringe formed a regular row of hooks. Replaced the repeated lanes with fine, unevenly placed tapered hairs. Their roots sit inside the skin and share its rig.                       |
| Review       | Inspected neutral construction, front, side, rear, large, phone, blink and sampled motion. The sloping back, rounded ears and spotted coat remain legible at the smaller size.                       |

Frozen candidates are under `test-results/scavenger-construction/`, `scavenger-structure2-fixed/`, `scavenger-materials/`, `scavenger-materials2/` and `scavenger-materials3/`. The separate `scavenger-structure2/` attempt was interrupted after a source syntax error; the corrected construction pass is preserved under `structure2-fixed`. Final verification is in `test-results/scavenger-final/`; the delivery bundle contains images, model, video, logs and source hashes. Generated evidence is ignored; source geometry, integration, tests and this review are durable.

## Construction and motion

One implicit skin joins torso, neck, skull, muzzle, limbs, paws and brush tail. Four fused toe forms per paw carry fitted claws. Separate rounded ear cups, small recessed eye groups, leathery nose and surface-fitted mouth curves follow the head. Fine dorsal guard hairs break the mane outline without repeating the earlier hooked pattern.

Five bones anchor the body, blend neck/head motion and move the distal tail through two frames. Body and mane share the same skeleton and weight function. Ground-level skin and all sixteen claws stay fixed. Ears rotate at their roots, and a brief blink scales the fitted eye groups. The six-second loop is a watchful display pose, not locomotion or physical muscle simulation.

Locally generated pigment, short-fur normal relief and packed roughness are embedded in exports. Irregular spots and regional mane/muzzle colors are vertex paint. The original SVG appears beside the model at `/?art=3d&study=scavenger`. Timeline, reduced-motion startup, phone framing, PNG, animated GLB and recorded WebM are available; layer separation is disabled for the fitted assembly.

## Verification and limits

Subject tests cover welded body closure, finite normalized body/mane weights, planted lower skin, four grounded paws, sixteen fixed claws, head/face fit, ear-root fit and tail motion across the loop. Shared checks cover animation bindings and exact endpoints. Final verification passes **294 unit tests across 49 files**, **8 trace tests**, **27 browser checks**, the production build and owned-file formatting. Browser coverage includes all fourteen studies’ renders/exports, animation recording, reduced-motion startup and shell navigation. The delivered H.264 preview is **994 × 674**, **6.033333 seconds**; the original recorded WebM is preserved beside it.

The GLB retains **2 skinned meshes using five shared bones**, **8 animated nodes** and **6 embedded images**. Sampled live/reimported poses differ by at most **3.3155669808602936e-8 scene units** at vertices and **0** at measured nodes. Both identically lit rendered views were inspected. The GLB is **8,040,280 bytes**.

Earlier Prowler, Wolf, Matriarch, Thornstag, Moonmoth, Bogtoad and Crocolisk builders/tests match their delivery hashes. Shared surface-sculpt code/tests match the Matriarch delivery; original Hydra, Phoenix, Nightjar and SVG/content files remain unchanged. The final source snapshot and SHA-256 manifest preserve the exact reviewed implementation.

`npm run check` stops at the concurrent `docs/viz.md` formatting edit. That file remains with its author; owned-file formatting and all test/build stages are run separately. The existing large gallery-chunk warning remains.

**Visual limits:** this remains a stylized display creature in one stance. Spots and fur mapping approximate regional coat structure; fine hairs become less distinct on a phone. Ears, claws, facial details and hair are fitted display geometry rather than a manufacturing-ready unified mesh. Passing tests and author review do not establish user approval or equal visual quality to Hydra.
