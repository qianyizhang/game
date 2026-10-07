# Independent rules for each game

Recorded 2026-10-07 from the existing [architecture](../architecture.md#why-three-engines) and [project boundaries](../../../AGENTS.md#boundaries); this records an established decision.

Blindside poker scoring, Slay the Spire's sequential turns and Last Hearth's recruitment and automatic combat each own their rules and timing. Share proven replay, storage and presentation utilities, while keeping authoritative game actions and outcomes in the owning game. A universal game engine would centralize unlike timing and state lifetimes behind a larger common interface; independent rules keep those differences explicit at the cost of some duplication. New shared abstractions must resolve observed duplication without taking over game meaning.
