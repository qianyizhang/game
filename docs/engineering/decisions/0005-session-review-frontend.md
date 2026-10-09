# One frontend for session review

Session review uses one React/Vite workspace package for recorded conversation, turn inspection and authored artifact review, delivered as either a self-contained export or a local HTTP page. Recorded threads are the base model; authored episodes and assessments are optional curation, so raw sessions do not fabricate a story to satisfy the renderer. This replaces the growing imperative trace template/runtime pair while keeping usage analytics separate, preserving offline review, and concentrating record presentation and navigation fixes in one place.
