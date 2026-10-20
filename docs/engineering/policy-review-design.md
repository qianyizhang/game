# Policy review design

The review surface answers three questions in order: where am I, what did the
policy do, and what changed? The recorded game board and compact decision controls
stay above diagnostic detail on desktop and narrow screens.

- Keep import and run identity compact. Expand the run library to filter or compare
  recordings; do not spend the first screen on a one-row table.
- Group playback controls in one bar. Use familiar navigation icons with explicit
  accessible names and a numbered position. Highlight Before/After only when it
  describes the displayed frame; native continuous playback uses seek buttons.
- Show a short recorded action/reason when available. Keep exact inputs, proposals,
  evaluator state, source pins and exports available through labeled disclosures.
- Summarize passing audits; keep failures and first-mismatch navigation visible.
  Hidden evaluator knowledge must remain explicitly labeled as privileged.
- Preserve original bytes, isolated playback, decision links and all-actor replay
  semantics. Cache validated reconstruction, including observed alias history;
  never replace historical decisions with current policy output.

The shared inspector serves five games. Night Passage retains its native playback
and timing controls while using the same disclosure and navigation hierarchy.

## Playback stability and card density

Keep the scene viewport and decision caption stable as autoplay crosses phases.
Scene content scrolls inside that viewport, without browser scroll anchoring moving
playback controls or the evidence panels. Retain component identity across decisions;
reset encounter-specific inspection only when the encounter changes.

Card rows never wrap during review. Cards share available width down to a readable
minimum, then overflow horizontally with a visible scrollbar and keyboard-accessible
row. This preserves order and access to every card without hiding cards behind a fan.
Scope these styles to recorded review; live game layouts and commands stay unchanged.
