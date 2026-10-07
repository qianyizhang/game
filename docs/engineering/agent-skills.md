# Project review skills

The project-local installation contains `retro` and `improve-codebase-architecture`, plus their supporting `writing-for-agents`, `codebase-design`, `grilling` and `domain-modeling` skills. They are available from the next chat turn. Their source is [mattpocock/skills](https://github.com/mattpocock/skills/tree/6fd947921b935b7e1e69293a200400f0fdd5c15f), pinned at commit `6fd947921b935b7e1e69293a200400f0fdd5c15f`.

The [lock record](../../maintenance/skills-lock.json) pins each installed file. The [MIT license](../../maintenance/third-party/mattpocock-skills-LICENSE) is retained. Installed upstream files are unchanged; update them through a reviewed pinned installation and refresh the file hashes. They are third-party material, excluded from local formatting and source migration.

## Resolve upstream document names here

| Upstream convention          | Project home                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `GLOSSARY.md`                | `docs/engineering/glossary.md`, created only when useful terms are settled                      |
| `docs/adr/`                  | `docs/engineering/decisions/`, created only for consequential decisions                         |
| `CODING_STANDARDS.md`        | [Maintenance governance](maintenance.md), with mechanical rules enforced in check configuration |
| Existing scope decisions     | [Settled game decisions](../decisions.md), until migrated                                       |
| Session or review narratives | `.work/sessions/<session>/`, with the retention lifecycle                                       |
| Architecture report          | Temporary local HTML, as requested by the upstream skill                                        |

Read this mapping before invoking these skills. Use the mapped home wherever an upstream prompt names its default path. Preserve the shared art rulebook and existing game boundaries. Already accepted decisions remain settled; a user's explicit authorization takes precedence over repeated approval prompts. Skills inform review and discussion; deterministic repository checks enforce mechanical requirements.

The wider ticket orchestration suite and tracker setup are not installed. No external issue tracker, automatic skill updates or new workflow framework is introduced.
