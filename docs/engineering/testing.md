# Test observable behavior

Prefer end-to-end journeys and behavior at the game's command interface. A test earns its maintenance cost by protecting a named failure that matters to players, experiment validity or artifact delivery. Test counts and coverage percentages are inventory, not evidence of usefulness.

## Choose the test surface

| Behavior                                                             | Preferred surface                                               | Assertions                                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| Player interaction, reload, import/export, navigation, accessibility | Actual browser controls and delivered files                     | Visible outcomes, persisted decisions and recovery behavior           |
| Run lifecycle, replay and resource conservation                      | Seeded legal-command sequences through application interfaces   | Ending, accounting, reconstructed state and rejected-action atomicity |
| Subtle scoring or combat ordering                                    | Small explicit rule scenarios through the owning rule interface | Independently specified results and event order                       |
| Artifact delivery                                                    | Download, reload and evaluate the delivered artifact            | Valid geometry, supported animation and source/export agreement       |
| A precise past defect or difficult failure condition                 | The smallest stable interface that exposes it                   | The defect's observable consequence                                   |
| Visual quality                                                       | Matched-view human inspection                                   | Named visible defects and corrections under the art rulebook          |

Use real local dependencies where practical. Introduce a fake only when it makes a relevant failure or timing condition controllable, and describe the behavior it stands in for. Expected results must come from the rule or fixture contract, rather than rerunning the implementation under test to compute the answer.

## Shared behavior and asset-specific contracts

Test shared viewer, recording and accessibility behavior on a small set of representatives
chosen for distinct risks, such as rigid motion, skinning, transparency and heavy geometry.
Repeating an end-to-end journey for every asset needs the same justification as repeating a
unit test. Keep loading, delivered geometry/animation validity and visible motion coverage
for every asset still offered to users. A representative matrix is an explicit coverage
choice, not permission to silently drop per-asset delivery checks.

The 3D contact-sheet cluster is **keep, opt-in** through `npm run test:browser:review`.
It generates views for human inspection, including clay and motion images. The functional
browser project keeps loading, visible motion, phone layout and delivered GLB checks for
every asset. Named camera controls remain in those journeys; pointer orbit is checked on
a reduced-motion rigid representative so animation cannot masquerade as successful dragging.
CI does not generate all 29 contact sheets or establish aesthetic acceptance.

Video delivery checks decode the downloaded artifact away from the live WebGL scene,
require supported dimensions and compare actual presented frames for visible motion.
Encoded byte counts and fixed early seek times are **replace**: a valid low-frame-rate
WebM can be small and repeat its first frame at both timestamps. The frame callback
follows the decoder's presentation cadence ([browser API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback)).

Prefer outcomes over incidental construction: supported motion, fitted attachments and
resource release matter; exact mesh counts, vertex counts, helper calls and intermediate
callback sequences usually do not. A coordinate or name can remain in a narrow legacy
regression when it locates a documented failure. Do not add production metadata or a new
procedural abstraction solely to make an outgoing implementation's tests elegant.

## Blender authoring and legacy compatibility

The [Blender-first decision](decisions/0003-blender-first-authoring.md) directs new authoring
investment to the DCC package. New native controls must be exercised in Blender through
edit, evaluated deformation, save/reload, export and consumer reload. Pure mathematical
checks and verification of an unchanged published GLB cannot establish that this loop works.
The local `npm run test:dcc:native` gate uses a disposable source copy and checks that the
published source and delivery remain unchanged. Its browser case is explicitly skipped in
ordinary runs without that native candidate; CI is not credited with native execution.

The TypeScript gallery is a compatibility surface while it remains available. Retain its
delivery checks and named regressions, consolidate repeated machinery, and avoid expanding
constructor-specific coverage. Retire remaining legacy tests with the corresponding user
surface or a verified replacement, recording any deliberately dropped contract. This
testing policy does not authorize deletion of artist sources, accepted baselines or evidence.

## Before adding or retaining a test

- Name the failure it catches and the outcome that would be wrong.
- Choose the highest practical interface that exposes that failure. The test should survive internal restructuring that preserves behavior.
- Check existing journeys and regressions for overlap. Retain an overlapping check only when it adds a distinct failure, diagnostic value or substantially cheaper feedback.
- For narrow checks, explain why a broader journey can miss the defect or why controlled failure injection is needed. Avoid exact scene names, helper call counts and coordinates unless that exact detail is the contract or regression.
- Replace superseded assertions when the replacement has been demonstrated to catch their useful failures. Consolidating into one enormous test is not a goal; retain independently diagnosable behaviors.

For reversible, low-impact changes, use relevant existing verification when it suffices. New source still enters lint, type and inventory scopes; that does not require a new test for every file.

## Review and reporting

Classify a test cluster as **keep**, **consolidate**, **replace** or **delete**. Record its protected behavior, replacement coverage and unresolved gaps before removing tests. Use deliberate defect injection for a bounded pilot where practical; a green replacement alone does not show that it detects a failure.

An imported winning replay proves reconstruction and the victory screen, not a full browser playthrough. A seeded headless run proves rules lifecycle, not browser interaction. A changed screenshot proves changed pixels, not attractive artwork. State those limits beside results.

Use the [verification contracts](checks.md#gate-selection) to select the default `check` or geometry-inclusive `check:full` gate and affected browser/native checks. Report maintenance, application/simulation, geometry and browser/native results separately. Run relevant checks once after the final change; broaden or repeat them for a new failure, change or unresolved concern.

The [2026-10-07 test audit](history/test-audit-2026-10-07.md) records the initial inventory and export-normal consolidation. Further deletions depend on behavior review, not a target ratio of unit to browser tests.
