# Session review

The React frontend for local session navigation and curated artifact review. The usage dashboard stays a separate consumer; accounting does not live here.

- `src/contracts.ts` owns the delivery contract: recorded threads plus optional authored curation. Raw sessions have no fabricated episode. Builders validate source material before delivery.
- `src/data-source.ts` provides embedded bodies and byte-pinned local HTTP blocks through one record interface. Source files remain read-only.
- `src/state.ts` owns restorable URL state. `context.tsx` builds shared indexes.
- `conversation.tsx` and `action-view.tsx` share `records.tsx`, the bounded record reader and semantic renderer. `minimap.tsx` follows actual card geometry, including lazy loads and expansion.
- `story.tsx`, `process.tsx`, `compare.tsx`, `evidence.tsx` and `sources.tsx` own curated review and provenance.
- `styles.css` supplies the neutral visual system and the single semantic event palette. Native controls and a modal dialog provide keyboard behavior without a second component framework.

`npm run dev --workspace @card-workshop/session-review` runs Vite; load an explicit review JSON document in its development entry. `build.ts` bundles that same entry into self-contained HTML with inline CSS, compressed inert data and no CDN. Artifact files remain adjacent to offline exports. The trace and usage builders call this interface; there is no second trace viewer template or runtime.

Root formatting, typed ESLint, workspace TypeScript and maintenance inventory cover this package. Trace model tests and browser journeys exercise the delivered bundle, including offline loading, linked evidence, Markdown safety, lazy bodies, minimap scrolling, filters and mobile layout. See the [review guide](../../docs/engineering/trace-visualizer.md).
