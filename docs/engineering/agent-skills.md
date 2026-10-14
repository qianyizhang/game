# Shared agent skills

The nine-skill generic suite is installed once for the user account from
repo-kit. Its source and maintenance procedure at
`../repo-kit/docs/skill-suite.md` own the upstream pin, complete directories, licenses and sync verification.
This project no longer keeps duplicate generic skills or a separate skills lock.
The [Card Workshop art skill](../../skills/card-art/SKILL.md) remains local.

## Resolve upstream document names here

| Upstream name         | Project owner                                                             |
| --------------------- | ------------------------------------------------------------------------- |
| `GLOSSARY.md`         | [Domain vocabulary](glossary.md)                                          |
| `docs/adr/`           | [Architectural decisions](decisions/README.md)                            |
| `CODING_STANDARDS.md` | [Maintenance governance](maintenance.md) and existing check configuration |
| Accepted decisions    | [Settled scope](scope-history.md)                                         |
| Session evidence      | `.work/sessions/<session>/` with its existing retention rules             |

Read this mapping before using generic skills. `retro` and
`improve-codebase-architecture` require explicit invocation; the other seven can
be selected for relevant requests. Accepted choices stay settled. Existing
explicit authorization takes precedence over repeated confirmation prompts.

The [testing policy](testing.md) governs meaningful test selection. Generic
skills do not require unit tests for every file or replace checking command
callers, CI, docs and frozen reproduction references during cleanup.

## Finishing a slice

Use `finish-work` against the [testing policy](testing.md), [verification gates](checks.md),
and [maintenance rules](maintenance.md). Replay/save contracts remain authoritative;
art changes also follow the [art rulebook](../art/art-direction.md). Keep technical
checks, native authoring, and visual acceptance distinct; retain historical evidence.
