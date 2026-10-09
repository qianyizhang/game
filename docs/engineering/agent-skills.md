# Project review skills

The project-local installation contains `retro` and `improve-codebase-architecture`, plus their supporting `writing-for-agents`, `codebase-design`, `grilling` and `domain-modeling` skills. Their source is [mattpocock/skills](https://github.com/mattpocock/skills/tree/6fd947921b935b7e1e69293a200400f0fdd5c15f), pinned at commit `6fd947921b935b7e1e69293a200400f0fdd5c15f`.

The [lock record](../../maintenance/skills-lock.json) pins each installed file. The [MIT license](../../maintenance/third-party/mattpocock-skills-LICENSE) is retained. Installed upstream files are unchanged; update them through a reviewed pinned installation and refresh the file hashes. They are third-party material, excluded from local formatting and source migration.

## Resolve upstream document names here

| Upstream convention          | Project home                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `GLOSSARY.md`                | [Domain vocabulary](glossary.md), grouped by workshop and game context                          |
| `docs/adr/`                  | [Architectural decisions](decisions/README.md), only for consequential trade-offs               |
| `CODING_STANDARDS.md`        | [Maintenance governance](maintenance.md), with mechanical rules enforced in check configuration |
| Existing scope decisions     | [Settled game decisions](decisions.md)                                                          |
| Session or review narratives | `.work/sessions/<session>/`, with the retention lifecycle                                       |
| Architecture report          | Temporary local HTML, as requested by the upstream skill                                        |

Read this mapping before invoking these skills. Use the mapped home wherever an upstream prompt names its default path. Preserve the shared art rulebook and existing game boundaries. Already accepted decisions remain settled; a user's explicit authorization takes precedence over repeated approval prompts. Skills inform review and discussion; deterministic repository checks enforce mechanical requirements.

The wider ticket orchestration suite and tracker setup are not installed. No external issue tracker, automatic skill updates or new workflow framework is introduced.

## Use the skills at the point of need

| Trigger                                                                              | Skill                           | Finish line                                                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A session exposes navigation friction, misleading checks or ineffective instructions | `retro`                         | Rank concrete improvements from the session's evidence; promote lasting guidance to its existing home |
| A domain term is ambiguous or an interface introduces a new concept                  | `domain-modeling`               | Resolve the meaning against behavior and update the relevant glossary context                         |
| A consequential architectural trade-off is settled                                   | `domain-modeling`               | Record one concise ADR, with the original evidence; preserve existing accepted decisions              |
| A module's callers or tests need too much implementation knowledge                   | `codebase-design`               | Identify a simpler interface and tests of its observable behavior                                     |
| A broader architecture review is requested                                           | `improve-codebase-architecture` | Present bounded candidates and the requested temporary HTML report                                    |
| A material choice remains open                                                       | `grilling`                      | Resolve that choice; accepted choices stay settled                                                    |
| Agent instructions or skills change                                                  | `writing-for-agents`            | Keep conditional pointers short and each rule in one authoritative home                               |

The [testing policy](testing.md) governs test selection and replacement. Upstream prompts about adding checks do not imply adding unit tests for every file. Retro findings about test usefulness require behavior review; formatting, lint and types already enforce mechanical requirements.

## Docs and scripts cleanup

There is no dedicated cleanup skill installed. `writing-for-agents` supplies document pruning guidance; `retro` reviews session friction, and `improve-codebase-architecture` reviews module boundaries. None replaces checking whether a command or historical record still has consumers.

For a cleanup request, use [maintenance governance](maintenance.md): inspect concurrent edits and callers, consolidate each contract into its owning document, preserve recoverable provenance before retiring dated reports, update inbound links, and run the relevant checks. Keep pinned upstream skill files unchanged.
