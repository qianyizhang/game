# Card Workshop vocabulary

Canonical meanings for the workshop and its three games. Read the relevant context when naming a feature, interface or test; the same word can have a different role in another game.

## Workshop play and replay

**Run**: One seeded playthrough under one game's rules, from its starting position to an ending. A Last Hearth run contains a lobby.

**Replay**: The starting identity and accepted decisions needed to reconstruct a run. A replay can describe an unfinished run as well as a completed one.
_Avoid_: Recording, when referring to reproducible game decisions rather than video.

**Accepted command**: A requested game action that the rules permit and apply. A rejected request is not part of the replay.

**Practice scenario**: A chosen starting situation for exploring decisions separately from normal progression.
_Avoid_: Normal run, when referring to a custom starting situation.

**Challenge**: A fixed, versioned puzzle with a starting situation, permitted actions and an explicit objective.

**Challenge attempt**: One playthrough of a challenge, including accepted decisions and any explicit early ending. A completed attempt can fail its objective; completion and success are different meanings.

**Practice branch**: An alternative continuation from a reconstructed decision point in a practice run or challenge attempt.
_Avoid_: Rewind, when suggesting that a committed normal run can be undone.

**Content pack**: A named collection of game definitions and effects that changes the available content. Its identity is part of determining whether a replay can be reconstructed.

## Blindside

**Blind**: One scoring encounter with a target and any applicable restrictions.

**Selected cards**: The cards submitted together for a poker play. The scoring cards can be a subset of them.

**Scoring cards**: The cards that contribute to the recognized poker hand and its per-card scoring stage.
_Avoid_: Selected cards, when referring only to scoring membership.

**Held cards**: Cards remaining in hand during a play's resolution; their held effects are distinct from played-card effects.

## Slay the Spire

**Permanent deck**: The cards carried between encounters, including their lasting upgrades.

**Combat card**: An encounter-local card instance occupying a combat zone. Its temporary properties do not redefine the permanent deck.

**Card choice**: A pending selection that must be resolved before the interrupted card effect can continue.

## Last Hearth

**Lobby**: The eight seats sharing recruitment supply and competing for final placement.

**Recruitment board**: A seat's warband between battles, including lasting recruitment changes.
_Avoid_: Combat board, when referring to the persistent warband.

**Combat copy**: A unit's battle-local representation. Wounds, consumed shields and summoned combat units do not become recruitment changes.

**Shared supply**: The finite recruit copies distributed among the pool, offers, hands, boards and pending choices.

**Policy observation**: The information a policy is allowed to see at a decision point. It differs from the evaluator's complete lobby information.
_Avoid_: Full state, when referring to a policy's permitted view.

**Arena journal**: A Last Hearth arena replay containing accepted actions for every seat, including rivals.

## Art and evidence

**Study**: One named artwork explored in the gallery, with its own physical interpretation and intended gesture.

**Artist source**: The editable artwork from which a delivered model is produced.
_Avoid_: Delivered model, when referring to the editable authoring source.

**Delivery receipt**: The provenance record linking a delivered model to the source and checks that produced it.

**Technical verification**: Evidence that rules, interaction or delivery contracts hold under stated checks. It does not establish visual quality or user acceptance.

**Visual review**: Inspection of the artwork's gesture, structure, materials and presentation in actual views.

**User approval**: The user's explicit acceptance of a result or direction. An author's favorable review is not user approval.

## Meaning authorities

Definitions consolidate existing behavior from [architecture](architecture.md), [challenges](../guide/challenges.md), [arena contracts](../guide/hearth-arena.md) and the [art rulebook](../art/art-direction.md). Detailed mechanics and implementation remain in those documents and the owning game. Sharpen definitions as actual ambiguities arise; keep implementation procedures out of this glossary.
