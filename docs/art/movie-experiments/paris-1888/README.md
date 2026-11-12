# Paris, 1888 — Iron Rising

[Open the offline film](paris-1888.html) in a WebGL2 browser. This standalone
voxel study imagines the Eiffel Tower during construction. The scene, animation,
Three.js runtime, and runtime license are embedded in the HTML. The existing
Lantern Keep trial provided the offline delivery pattern; the Paris geometry is
procedural and specific to this scene.

The film plays once on load. With reduced motion enabled it holds the opening
frame. Reload to replay, or call `window.renderAt(seconds)` to seek and hold a
frame. Capture the canvas after each call:

```js
for (let frame = 0; frame < 420; frame++) {
  window.renderAt(frame / 30);
  // Capture the 1280 × 720 canvas here.
}
```

The timeline uses seeded placement and time-based motion. The scene is a
stylized interpretation of the construction site. The HTML is the retained
delivery; no encoded movie is included.
