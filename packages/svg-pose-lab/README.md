# SVG Pose Lab

A standalone editor for inspecting and changing static SVG artwork. It ships as one HTML file and runs offline. The games do not load it.

From the repository root, use the pinned Node runtime and installed dependencies:

```sh
nvm use
npm run build:svg-lab
```

Open `packages/svg-pose-lab/dist/index.html` in a browser. Copy that file anywhere to use the editor without this repository. Build to a separate folder with `npm run build:svg-lab -- /absolute/output/folder`.

- **Transform:** Click artwork or a layer. Use Shift-click or turn on **Multi-select** to add or remove objects. Drag the center grip to move, a corner to scale, or the ring to rotate. Shift keeps scale proportional or snaps rotation to 15°.
- **Group:** Group adjacent siblings in Layers to preserve paint order. Objects in different groups can still transform together. **Ungroup** unwraps plain groups and keeps their children in place.
- **Path:** Select one path. Drag a square point or round Bézier handle, or use the point picker and X/Y fields for exact coordinates. **SVG source** shows the selected element's current markup.
- **Pose:** In the built-in example, drag the wrist, knee, and neck pivots to rotate the corresponding groups. **Reset pose** clears these rotations and preserves other transforms and path edits.
- **Keep a copy:** Undo or redo a drag or group change as one edit. **Export SVG** downloads the edited artwork without the guides. Reopen it in the editor or use it directly. The input file stays untouched.

Open the **Shortcuts** page from the footer or press **?**. It lists every editor command. You can also open the offline file with `#shortcuts` appended. Return to the editor with Escape or **Back to editor**; your edits and selection stay open.

Imports support static paths, groups, basic shapes and text, local gradients, masks, clips, patterns and markers. The editor rejects active content, external references, stylesheets, filters and embedded images. It reports an unsupported file before replacing the working copy. Elliptical arcs expose their endpoints. Pivots are available on the built-in example; arbitrary SVGs have no inferred joints. Moving a point changes that coordinate; nearby handles stay in place unless moved directly. Edits remain in the tab until you export.

[One Quiet Breath](examples/one-quiet-breath.svg) is a pinned copy of the [merged story reference](../../docs/art/assets/expansion-story-clips-2026-11-06/spire-one-quiet-breath/reference.svg) at `9e8a9544` (#158). The copy lets the standalone editor open an example without reaching into the game or fetching any assets.

`npm run test:svg-lab` checks path parsing and coordinate edits. `npm run test:browser:svg-lab` builds the offline file and checks the transform, group, path, pose, import, and export journeys in the shared disposable Chrome harness.
