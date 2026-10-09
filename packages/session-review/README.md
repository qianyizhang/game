# Session review

React frontend for recorded conversations and curated artifact review. Usage accounting stays in `workshop-tools/usage`.

| Home                | Responsibility                                                                       |
| ------------------- | ------------------------------------------------------------------------------------ |
| `src/app/`          | App shell, shared UI controls, URL state, context and source coverage                |
| `src/model/`        | Document contracts, action grouping/classification, review signals and record access |
| `src/conversation/` | Conversation overview and turn inspector                                             |
| `src/actions/`      | Action list/cards, minimap, filters and source sequence                              |
| `src/records/`      | Text loading, safe Markdown/code rendering, native tool content, images and metrics  |
| `src/curation/`     | Authored stories, process maps, revision comparisons and evidence inspection         |
| `src/styles.css`    | Shared visual system and semantic event palette                                      |

Features depend on the model and shared record presentation. The model does not import React views. Keep direct imports between owning files; do not add forwarding files or a parallel renderer.

External consumers use `@card-workshop/session-review/contracts` for the document contract and `@card-workshop/session-review/build` for `renderReview`. Raw sessions need no authored curation. Backend adapters validate and normalize source material before delivery; local record access retrieves byte-pinned bodies without writing to sources.

`npm run dev --workspace @card-workshop/session-review` runs Vite; load a review JSON document in the development entry. The HTML builder bundles the same `src/main.tsx` into self-contained output with inline CSS, compressed data and no CDN. Artifact files remain adjacent to offline exports.

Root formatting, typed ESLint, workspace TypeScript and maintenance inventory cover this package. Trace tests and browser journeys cover offline/local delivery, evidence links, safe rendering, lazy bodies, navigation, minimap geometry and mobile layout. User behavior and evidence limits live in the [review guide](../../docs/engineering/trace-visualizer.md).
