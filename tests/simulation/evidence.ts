import type { replayCodec, Session } from '../../src/shared/replay';
import { evidenceRow } from '../../src/shared/evidence/recorder';
import { contentDigest } from '../../src/shared/contentPack';
/** Reconstruct observations from legal commands. This is automated evidence, never human play. */
export function automatedEvidence<S extends { seed: string }, C>(
  codec: ReturnType<typeof replayCodec<S, C>>,
  session: Session<S, C>,
) {
  const now = new Date().toISOString();
  let cursor = codec.create(session.replay.seed, session.replay.setup);
  const row = evidenceRow(
    codec.rules,
    cursor,
    'automated',
    `${session.replay.game}-${session.replay.seed}`,
    now,
  );
  for (const [i, command] of session.replay.commands.entries()) {
    const result = codec.act(cursor, command);
    if (result.error) throw new Error(result.error);
    row.events.push(
      ...codec.rules
        .evidence!.events(cursor.state, command, result.session.state)
        .map((e) => ({ ...e, step: i + 1 })),
    );
    cursor = result.session;
  }
  row.steps = session.replay.commands.length;
  row.tail = contentDigest(session.replay);
  row.summary = codec.rules.evidence!.summary(cursor.state);
  return row;
}
