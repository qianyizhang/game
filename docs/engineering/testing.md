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

Use the [verification contracts](checks.md) for commands, check scopes and macOS launch requirements. Report maintenance, application/simulation and browser results separately. Run relevant checks once after the final change; broaden or repeat them for a new failure, change or unresolved concern.

The [2026-10-07 test audit](test-audit-2026-10-07.md) records the initial inventory and export-normal consolidation. Further deletions depend on behavior review, not a target ratio of unit to browser tests.
