# Cartographer room materials · issue 38

The 9 × 9 board now uses three related static stone treatments. The entrance and
remaining chambers use dry, warm gray slabs; Drowned Bridge and Cistern use cool,
wet stone and brighter water; Moss Shrine, Sunken Garden and Sealed Archive use
muted green stone and moss-toned joints. The changes are limited to the board's
tile surfaces and backing. The gold doorways, pale player, red warning, selected
enemy outline, controls and labels remain in their existing layer.

**Brief:** dry stone / wet stone / overgrown archive; broad light planes and
recessed courses; low detail at a 35 px phone tile; compared with the approved
Cartographer cue study. Baseline: main `73a24f5` (2026-10-28). This is author
review evidence for a WIP proposal; independent visual acceptance is pending.

| Room           | View                              | Baseline                                       | Proposal                                     |
| -------------- | --------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| Entrance       | Desktop panel, 1440 px            | [Before](before-entrance-desktop-context.webp) | [After](after-entrance-desktop-context.webp) |
| Entrance       | Phone panel, 390 px               | [Before](before-entrance-phone-context.webp)   | [After](after-entrance-phone-context.webp)   |
| Entrance       | Native phone board, 320 px        | [Before](before-entrance-native.webp)          | [After](after-entrance-native.webp)          |
| Entrance       | 3× crop of occupied north doorway | [Before](before-entrance-zoom.webp)            | [After](after-entrance-zoom.webp)            |
| Drowned Bridge | Desktop panel, 1440 px            | [Before](before-bridge-desktop-context.webp)   | [After](after-bridge-desktop-context.webp)   |
| Drowned Bridge | Phone panel, 390 px               | [Before](before-bridge-phone-context.webp)     | [After](after-bridge-phone-context.webp)     |
| Drowned Bridge | Native phone board, 320 px        | [Before](before-bridge-native.webp)            | [After](after-bridge-native.webp)            |
| Drowned Bridge | 3× crop of water and threat       | [Before](before-bridge-zoom.webp)              | [After](after-bridge-zoom.webp)              |
| Moss Shrine    | Desktop panel, 1440 px            | [Before](before-shrine-desktop-context.webp)   | [After](after-shrine-desktop-context.webp)   |
| Moss Shrine    | Phone panel, 390 px               | [Before](before-shrine-phone-context.webp)     | [After](after-shrine-phone-context.webp)     |
| Moss Shrine    | Native phone board, 320 px        | [Before](before-shrine-native.webp)            | [After](after-shrine-native.webp)            |
| Moss Shrine    | 3× crop of moss stone and threat  | [Before](before-shrine-zoom.webp)              | [After](after-shrine-zoom.webp)              |

The entrance capture places the player on the north doorway. The two combat
captures show an enemy selected and the player in a threatened cell. Drowned
Bridge shows water to the right of the player; Moss Shrine shows water to the
left. At native phone size, the three rooms read as neutral stone, cool wet
stone and muted green stone, respectively. The water symbol, gold doorway and
red warning remain legible. The repeated floor bevel is the main visual
tradeoff to judge in independent review.

## Reproduction and scope

Run the app at base `73a24f5` and at the proposal with the same viewport and
replay commands:

1. Start a Relaxed expedition with seed `material-4`; move north three times.
   Capture the entrance with the player on its north doorway.
2. Explore north. Choose Drowned Bridge (offer 0) at rotation 0, then brace
   three times. Capture the selected guardian and threatened player.
3. Repeat from a new `material-4` expedition, choosing Moss Shrine (offer 1)
   at rotation 0 and bracing three times.
4. At each state, capture `.dc-board-panel` at 1440 × 1080 and 390 × 844,
   and `.dc-board` at 390 × 844. Check document overflow at 320 px.

The native phone board is 320 px wide; the zoom is a 3× nearest-neighbor crop
of that capture. Crop rectangles in `[left, top, right, bottom]` order are
Entrance `[105, 18, 215, 122]`, Bridge `[95, 120, 309, 302]`, and Shrine
`[30, 125, 302, 304]`. Context WebPs use quality 88; native and zoom WebPs
are lossless. Unselected PNGs stay in ignored `test-results/`. There are no
failed draft assets in this folder.

[The capture receipt](capture-receipt.json) records identical replay hashes,
danger labels and board dimensions before and after. All three replay states
fit without horizontal overflow at 1440, 390 and 320 px. This comparison
does not replace a full interaction journey or independent visual review.

No content, room generation, commands, rules version, save/replay format,
accessible cell name or tile geometry changed. The board uses CSS variables
and static gradients. It adds no requests, animation, timers or render loops.
