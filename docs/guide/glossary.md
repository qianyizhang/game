# Visual glossary

Open **Look up a term** below the game picker, or visit `/?guide=glossary`.
The illustrated game guide also links directly to each game's terms.

The glossary translates game mechanics, AI policy language, evaluation terminology and
development shorthand used in the **Find next AI engine work** chat
(`01a1420e-5f0f-7fb2-a556-740f14d15046`). It covers the visible user and assistant messages
read on 2026-10-16; tool logs and private reasoning are outside this source scope.
Quoted examples explain the historical conversation, not current performance claims.

- Search names, abbreviations, descriptions and examples. Select **All topics** to search
  across games, AI experiments and development.
- Browse by topic. The default overview keeps sections collapsed; searching or selecting
  a topic expands matching definitions.
- Use a term's **#** link to share or reopen it directly, for example
  `/?guide=glossary&term=block#term-block` or `/?guide=glossary&term=ascension#term-ascension`.
- Try the Block sliders to see damage absorption. Other small diagrams explain the
  bot decision loop, replay versus rollout, experiment matrices and each game's loop.
- **Reset** clears the lookup. Guide navigation reads no game save and starts no game.

## Content and meaning

`src/app/guide/glossary.ts` owns the reader-facing definitions and search aliases;
`TermDiagram.tsx` owns the HTML teaching diagrams. Aliases include related lookup phrases,
not only strict synonyms. Examples are explanatory, not reported study results.
The Block calculator illustrates one ordinary incoming hit without other effects;
it does not calculate authoritative gameplay.

The [development vocabulary](../engineering/glossary.md) owns canonical meanings.
The [policy development standard](../engineering/policy-development.md), game guides and
owning rules remain authoritative. The glossary makes their language accessible without
changing those contracts. Keep results and denominators in the dated studies rather than
copying changing performance claims into definitions.

Source checks for the potentially confusing mechanics include Spire's Spheric Guardian
and Spiker in `src/games/spire/content/world.ts`, damage and turn handling in
`src/games/spire/domain/combat.ts`, and the [Hearth rival styles](hearth-arena.md).
Emberwake, Cartographer and Night Passage meanings follow their existing
[play guides](README.md).
