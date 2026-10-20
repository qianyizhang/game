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
