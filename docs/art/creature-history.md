# Creature direction and guided trials

Historical review and authorship evidence from 2026-10-06. The earlier Hydra and Nightjar were rejected; the living Hydra received positive user feedback. Final Nightjar and Phoenix are mixed-authorship rebuilds. The [aesthetic rulebook](art-direction.md) serves as the visual standard. Retired intermediate paths are recorded in [cleanup triage](../engineering/history/cleanup-triage.md).

## Sol artwork review — 2026-10-06

The user requested three 3D samples implemented by **GPT-6.1-Sol**, independently audited and revised against the stylized sculpture standard.

### Sample scope

| Sample | Source                | Construction focus                                               |
| ------ | --------------------- | ---------------------------------------------------------------- |
| Spiral | Blindside `fibonacci` | Expanding shell volume, aperture, lip, and mount integration     |
| Vajra  | Spire `vajra`         | Pierced metalwork, fitted collars, grip, and support contact     |
| Hydra  | Last Hearth `hydra`   | Shared body, three distinct neck gestures, skull/jaw connections |

References: [Smithsonian shell reference](https://ocean.si.edu/ocean-life/invertebrates/chambered-shells), [LACMA Vajra](https://collections.lacma.org/object/43491).

Review command:

```sh
npm run test:browser -- tests/browser/art3d-review.spec.ts \
  --grep 'Spiral|Vajra|Hydra' --output test-results/sol-audit-roundN
```

### Review rounds

| Round | Findings                                                                                 | Outcome & Action                                                                                 |
| ----- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1     | Hydra surfaces cut open; shell open coil; Vajra mount detached                           | Rejected. Sol fixed inward winding in loft helper and connected mount. Added causal normal test. |
| 2     | Solids closed; Hydra remains inflated tubes; Vajra reads as generic cage                 | Rejected. Requested continuous anatomy, visible shell aperture, and subject-specific metalwork.  |
| 3     | Shell opening & prongs resolved; Hydra neck seams and coarse mesh visible                | Revise. Requested smooth surface normals, fitted join volumes, and grounded pedestal contact.    |
| 4     | Spiral and Vajra pass visual review; Hydra side view shows flat torso and segmented paws | Spiral & Vajra accepted. Hydra rejected; Sol expanded implicit surface sampling bounds.          |
| 5     | Hydra rebuilt with continuous body field, tapered pelvis/tail, and cranial planes        | Accepted by reviewer across hero, side, rear, and phone views (user approval unrecorded).        |

### Verification

249 unit tests across 35 files, production build, and 17 browser checks passed (GLB export, packed roughness/metalness maps, phone layout, reduced motion). Final evidence in `test-results/sol-audit-final/` and `test-results/sol-audit-final-reel/three-studies.mp4`.

## Creature redesign — gesture and cohesive style

Following user feedback rejecting literal fidelity in favor of style, dynamic posture, and cohesive living forms, the living Hydra and avian studies were redesigned.

### Living Hydra rebuild

- **Form:** Moss-green living skin, pale throat, and worn keratin plates replace bronze. One dominant raised threatening head, a narrow searching lower head, and a watchful side head. Recessed eyes, crown plates, curved teeth, and gums replace smooth wedge skulls.
- **Rig & Motion:** 28-bone rig deforming three necks independently with anchored coil base and staggered jaw openings in a six-second loop.
- **Verification:** 249 unit tests across 36 files pass. GLB vertex deformation matches live deformed skin within 0.0001 units at three sampled timestamps. Evidence in `test-results/hydra-delivery/`.
- **User feedback:** Positively received ("this is much better"), establishing the baseline creature standard.

## Guided Sol 6.1 creature trial

Observational trial applying the living Hydra methodology to **Nightjar and Phoenix** with two `gpt-6.1-sol` workers under parent direction.

### Assignment and attribution

| Responsibility                 | Owner                       | Scope                                                                 |
| ------------------------------ | --------------------------- | --------------------------------------------------------------------- |
| Nightjar construction & motion | `gpt-6.1-sol` (high effort) | `src/art3d/procedural/nightjar.ts`: living bird and fitted perch      |
| Phoenix construction & motion  | `gpt-6.1-sol` (high effort) | `src/art3d/procedural/phoenix.ts`: living firebird and basalt support |
| Direction, integration, review | Parent                      | Rulebook, source registration, browser tests, pixel audits            |

References: [Cornell feather anatomy guide](https://academy.allaboutbirds.org/feathers-article/), [Agi wing-group diagram](https://www.federn.org/hilfe_en.html).

### Review summary

- **Phoenix (Rounds 1–4):** Sol progressed from symmetric blockout (R1) through unequal wings (R2) to initial plumage (R3) and asymmetric pose (R4). Enlarged review revealed exposed rear spars, flat breast, and chevron textures. Sol froze source (`9690811f9943767741d345e6f0fea483d9d3ae257ba7da7e30e5f5b552b9bafd`) for handoff.
  - **Parent finish:** Retained Sol's anatomy and rig; replaced surface maps, added dark facial field, redistributed breast plumage, and wrapped low-relief feather patches around curved arms.
- **Nightjar (Rounds 1–4):** Sol progressed from disconnected legs and leaf coverts (R1) to corrected support and folded wings (R2), initial mottling (R3), and continuous feather masks (R4). Enlarged view remained a smooth cream bird with pale slab wings. Sol froze source (`4636097d2651d44c7a47932f40cb164a2dfd732cbe609e120da504e8f3240b87`) for handoff.
  - **Parent finish:** Retained Sol's rig and perch; rebuilt feather atlas with overlapping tips and directional barbs, added pale throat stripe, wide gape, rictal bristles, and an authored blink.

### Final delivery verification

| Check               | Result                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run check`     | Passed: formatting, 252 tests across 38 files, TypeScript, production build                     |
| Browser suite       | 11 passed: animated model exports, video loops, phone layout, reduced motion, save preservation |
| Dedicated captures  | Front, side, rear, enlarged, three motion frames, and phone view inspected                      |
| GLB vertex drift    | Max sampled error: Nightjar `5.73e-8`, Phoenix `4.76e-8`, Hydra `7.12e-8` model units           |
| Material inspection | Original and reloaded GLB pairs inspected under neutral lighting with no material loss          |

Final delivery artifacts: `test-results/sol61-creatures-delivery/`.
