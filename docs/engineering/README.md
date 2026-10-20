# Engineering

## Understand ownership

- [Architecture](architecture.md), [domain vocabulary](glossary.md) and [architectural decisions](decisions/README.md).
- [Settled scope](scope-history.md) and [development direction](roadmap.md).
- [Night Passage](night-passage.md) and [shared room generation](map-generation.md).

## Build and evaluate policies

Start with the [policy development standard](policy-development.md), [review interface principles](policy-review-design.md) and [trace-derived preflight checks](policy-footguns.md). [Research](../research/README.md#policy-evidence) owns current evidence and limitations.

| Game                 | Owning contract                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Blindside            | [Restricted observations and policy play](blindside-agent.md)                                       |
| Slay the Spire       | [Public legal menus and character/Ascension studies](spire-agent.md)                                |
| Last Hearth          | [Policy play](hearth-policy.md); [agent transport and frozen research interfaces](hearth-agents.md) |
| Emberwake            | [Campaign sensors, first-death attempts and replay](emberwake-policy.md)                            |
| Dungeon Cartographer | [Announced-turn forecasts and policy play](cartographer-policy.md)                                  |
| Night Passage        | [Controls, policy play and chronicle review](night-passage-agent.md)                                |

## Verify and maintain

- [Verification contracts](checks.md): commands, gate coverage and execution requirements.
- [Testing policy](testing.md): meaningful behavior and regression coverage.
- [Maintenance governance](maintenance.md): source ownership, document homes and retention.
- [Installed review skills](agent-skills.md): upstream conventions mapped here.
- [Tools](../../packages/workshop-tools/README.md) and [DCC](../../packages/dcc-workbench/README.md): package commands and integration contracts.

## Inspect developer evidence

- [Usage dashboard](usage-dashboard.md): local accounting, trends and source evidence.
- [Trace debugger](trace-visualizer.md): curated episodes and retained artifacts.
- [Repo Canvas](../../packages/repo-canvas/README.md): architecture maps and native-chat review; [map guide](repo-canvas-architecture.md) and [design contract](repo-canvas-design.md).
- [MCP Apps](mcp-apps.md): server lifetime, messaging and integration constraints.

[Test audit](history/test-audit-2026-10-07.md), [committed-file audit](committed-file-review.md) and [cleanup history](history/cleanup-triage.md) retain dated verification and recovery. Temporary discussions and handoffs belong in ignored `.work/sessions/`; [maintenance governance](maintenance.md#documentation-homes) owns their promotion and retention.
