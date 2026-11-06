# Art

The [aesthetic rulebook](art-direction.md) is the single visual standard. Use the [art skill](../../skills/card-art/SKILL.md), [SVG source map](svg.md), [3D source map](3d.md) and [DCC package](../../packages/dcc-workbench/README.md) for implementation and review. [SVG integration rules](svg.md#integration-boundaries) govern current behavior; [feature coverage history](history/feature-coverage.md) retains the dated regression evidence.

[Native 3D migration](migration.md) owns the settled authoring/delivery boundaries, parent acceptance and promotion rules, pilot gate and planned 29-study cohort. Its stages do not establish visual approval or batch completion.

## Asset admission: reuse, improve, then expand

**This is a blocking review gate for all future asset expansion**, including
imports, authored assets, maintained variants and duplicated packages. The goal
is better quality and useful coverage, not a larger collection to maintain.
Demonstrably better replacements and variants for different purposes are welcome.

Start from existing assets. Prefer adapting or absorbing the useful parts of a
source into the owning asset, or using reversible parameters, materials, overlays
and compositions, rather than importing everything or maintaining a parallel copy.
Compare against the intended quality and use, not merely whether an existing
asset can technically render. Do not force a destructive edit or a lower-quality
result to avoid an addition.

Add a separately maintained asset or variant only when evidence shows either:

1. Existing assets cannot meet the stated purpose and quality requirements,
   including a demonstrated quality improvement that warrants replacement; or
2. Adapting an existing asset would break another named, purposeful use, and the
   uses cannot safely coexist through non-destructive controls or composition.

Before committing to expansion, record the decision in the existing issue or
owning asset record; the PR must link it. Keep it concise and include:

- **Need and benefit:** intended use, required quality and the concrete improvement
  or distinct purpose. Novelty, availability or collection size alone is not a need.
- **Reuse comparison:** existing asset IDs/paths and revisions, options considered
  (reuse, adaptation, selective integration and non-destructive composition), and
  concrete evidence for the chosen exception. Use inspected matched output at the
  intended display size or relevant measurements; unsupported claims are insufficient.
- **Cost and ownership:** added source/export/storage, dependency, review and upkeep
  burden; the maintenance owner; why the benefit warrants that burden. For a
  replacement, identify the active role it supersedes and the consumer migration.
- **Preservation and checks:** other uses/consumers that must keep working, retained
  masters and provenance, and affected regression/quality checks. Preserve historical
  evidence without treating every superseded version as another active asset.

**Do not mark ready or merge an expansion with a missing or unsupported decision.**
If reuse or selective adaptation delivers the intended purpose and quality
improvement without breaking other uses, prefer it over a separately maintained
addition. A demonstrably better replacement remains welcome when its benefit
justifies migration and upkeep. This gate does not authorize
deletion, destructive replacement, publication or merge, and does not reopen
settled work. Existing retention, licensing, technical, visual, native/runtime and
gameplay-review gates remain separate and required as applicable; neither this
decision nor passing CI establishes user approval or gameplay acceptance.

## Direction and guided trials

[Bounded delegation](delegation.md) owns the active Sol orchestration / Astra art-direction experiment, shared-spec audit, construction prototype, author/verifier loop and exact-byte acceptance. The [Matriarch native trial](trials/README.md#matriarch-native-trial--2026-10-08-utc--2026-10-09-shanghai) completed; its [later refinement](trials/native-matriarch-refinement.md) stopped unfinished. Historical trials retain their own receipts and outcomes.

[Creature history](creature-history.md) preserves the rejected earlier Hydra/Nightjar, the later positively received living Hydra and the mixed-authorship Nightjar/Phoenix trial. Living Hydra is an accepted direction, not blanket approval of every detail. Final bird user approval is unrecorded. Spiral and Vajra had reviewer acceptance; this does not establish user approval. Catalyst's implementation and export workflow are in the 3D source map.

[Native migration pilots](trials/README.md#hydra-and-nightjar-pilots--2026-10-08) records the accepted Hydra and Nightjar gallery releases, native edit proofs and remaining limitations.

[Three-species saved-motion trial](trials/README.md#fox-boar-and-raven-rounds--2026-10-11) records the sequential fox, boar and raven campaign, owner self-review boundary, and tested rig/workflow refinements.

## Movie experiments

[Movie experiments](movie-experiments/README.md) retains the four standalone movie
trials, their sources and rendered exports, comparison outcomes, and known limitations.

## Asset records

The [per-game 2D cabinet](svg.md#scaffold-and-export) browses current artwork,
recent upgrades and WIP batches. Its export includes live-renderer
specimens for Canvas games and staged Image 2.6 comparisons; browsing does not
generate or install artwork.

### Image 2.6 batch workflow

The art skill's [batch workflow](../../skills/card-art/references/batch-assets.md)
owns WIP agreement, packing, extraction, cost review and selective promotion.
The user accepted the first Spire trial on November 6 and requested consolidation:
pack simple related assets such as tiles and repeated minions; use GIF for
purposeful events such as boss transformations and VFX. The
[Spire batch record](assets/spire-defense-batch/README.md) preserves the source
trial and selected replacements. The generated [Hearth small-unit batch](assets/hearth-small-units-batch/README.md)
now awaits artwork review and selection.

**Preservation hold · user request, 2026-11-06:** retain intermediate artwork,
reference boards, sheets, extracted variants, GIF originals and review frames,
prompt drafts and exact sent prompts, settings, usage, failures and review notes
for future-session reference. Do not retire that artwork/prompt lineage during
routine acceptance, rejection or closeout until the user revisits this hold.
This does not require keeping every routine tooling log.

Later batches should refine the consolidated method using their observed
quality, cost and extraction limits.

[Game asset enrichment](asset-enrichment.md) inventories the six games, prioritizes
readability and feedback studies, and records the Spire intent pilot with its independent
offline gallery, dated changelog, provenance and validation limits.

The [creature asset index](assets/README.md) keeps individual procedural and native records, their acceptance status and evidence locations. The [native trial index](trials/README.md) separates trial outcomes from asset identity. Original review bytes remain recoverable through the [document migration record](../../maintenance/document-migration.json).

The [Night Passage Bellwarden](assets/night-passage/bellwarden.md),
[Undertow](assets/night-passage/undertow.md) and
[Ash Regent](assets/night-passage/ashregent.md) and
[Unlit Sovereign](assets/night-passage/sovereign.md) record the four authored
gameplay guardians, native motion proof and owner visual self-review.

The [Root Sepulcher](assets/night-passage/sepulcher.md),
[Drowned Archive](assets/night-passage/archive.md),
[Cinder Court](assets/night-passage/cinder.md) and
[Starless Gate](assets/night-passage/starless.md) record all four authored
Night Passage environment kits, their collision bounds and saved-mesh edit proof.

[Night Passage symbols](assets/night-passage/symbols.md) records the 26 patron,
duo, rune, weapon and reward marks used in choices and the build sidebar.

[Night Passage patron effects](assets/night-passage/patrons.md) records five raised
spell-light silhouettes and their snapshot-driven rendering boundary.
