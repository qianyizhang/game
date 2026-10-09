import { useEffect, useRef, useState } from 'react';
import type { TraceEvent } from './contracts.ts';
import type { TraceAction } from './actions.ts';
import { presentedText } from './presentation.ts';
import type { TextBlock } from './data-source.ts';
import { useReview } from './context.tsx';
export function RichText({ text, kind = 'message' }: { text: string; kind?: string }) {
  const { state } = useReview();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.replaceChildren(
      presentedText(text, kind, state.text === 'raw' ? 'raw' : 'rendered'),
    );
  }, [text, kind, state.text]);
  return <div ref={ref} />;
}
export function RecordText({
  event,
  field = 'text',
}: {
  event: TraceEvent;
  field?: 'text' | 'output';
}) {
  const { source } = useReview();
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [offsets, setOffsets] = useState([0]);
  const [position, setPosition] = useState(0);
  const [block, setBlock] = useState<TextBlock>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const value = event[field] ?? '';
  const total = field === 'text' ? event.body?.textLength : event.body?.outputLength;
  const lazy = total !== undefined && total > value.length;
  useEffect(() => {
    if (!lazy) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, [lazy]);
  useEffect(() => {
    if (!lazy || !ready) return;
    const controller = new AbortController();
    setError('');
    setBlock(undefined);
    void source
      .text(event, field, offsets[position], controller.signal)
      .then(setBlock)
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e));
      });
    return () => controller.abort();
  }, [event, field, lazy, ready, position, offsets, source, retry]);
  return (
    <div ref={ref} className="record-surface" aria-busy={lazy && ready && !block && !error}>
      <div className="record-scroll">
        <RichText text={block?.text ?? value} kind={field === 'output' ? 'command' : event.kind} />
      </div>
      {error ? (
        <div role="status">
          {error} <button onClick={() => setRetry(retry + 1)}>Retry loading</button>
        </div>
      ) : block && block.total > 65536 ? (
        <div className="body-pager">
          <button disabled={!position} onClick={() => setPosition(position - 1)}>
            ← Previous text block
          </button>
          <span role="status">
            {block.offset + 1}–{block.nextOffset} / {block.total}
          </span>
          <button
            disabled={block.nextOffset >= block.total}
            onClick={() => {
              setOffsets([...offsets.slice(0, position + 1), block.nextOffset]);
              setPosition(position + 1);
            }}
          >
            Next text block →
          </button>
        </div>
      ) : null}
    </div>
  );
}
export function RecordBody({ event: e }: { event: TraceEvent }) {
  const { source } = useReview();
  const [imagesOpen, setImagesOpen] = useState(false);
  return (
    <>
      {e.sourceTruncated && (
        <p className="warning">Source truncated upstream. Expanding cannot recover omitted text.</p>
      )}
      {e.paths.length > 0 && <p className="provenance">{e.paths.join(' · ')}</p>}
      {e.text !== 'Recorded tool result' && <RecordText event={e} />}{' '}
      {e.output !== undefined && <RecordText event={e} field="output" />}
      {e.imageUrls
        ?.filter((url) => /^data:image\/(png|jpeg|webp|gif);base64,/.test(url))
        .map((url, i) => (
          <img key={i} src={url} alt="Image retained in this trace record" loading="lazy" />
        ))}
      {e.body && e.body.imageCount > 0 && (
        <details onToggle={(ev) => setImagesOpen(ev.currentTarget.open)}>
          <summary>Recorded images ({e.body.imageCount})</summary>
          {imagesOpen &&
            Array.from({ length: e.body.imageCount }, (_, i) => (
              <img
                key={i}
                src={source.image(e, i)}
                alt="Image retained in this trace record"
                loading="lazy"
                onError={(ev) => {
                  ev.currentTarget.alt =
                    'Image unavailable; reopen the trace if the source changed.';
                }}
              />
            ))}
        </details>
      )}
      {e.relatedThreads.map((id) => (
        <a key={id} href={'codex://threads/' + encodeURIComponent(id)}>
          Open related chat · {id.slice(0, 8)} ↗
        </a>
      ))}
    </>
  );
}
export const isResult = (e: TraceEvent) =>
  /\/(function_call_output|custom_tool_call_output)$/.test(e.sourceType ?? '');
export const recordType = (e: TraceEvent) =>
  isResult(e) ? 'result' : e.kind === 'command' ? 'call' : e.kind;
/** One dominant kind for grouping, badges, legend, and filtering. */
export const actionKind = (action: TraceAction) => (action.executions[0] ?? action.anchor).kind;
export function actionDescription(action: TraceAction) {
  const e = action.executions[0] ?? action.anchor;
  if (isResult(e) && e.callId) return 'Output · ' + e.callId;
  const objective =
    e.kind === 'goal'
      ? e.preview.match(/<objective[^>]*>([\s\S]*?)(?:<\/objective>|$)/)?.[1]
      : undefined;
  return (objective ?? e.preview).replace(/\s+/g, ' ').trim().slice(0, 130) || e.title;
}
export function ActionCard({
  action,
  selected = false,
  prefix = 'record-',
  filter,
  inspect,
}: {
  action: TraceAction;
  selected?: boolean;
  prefix?: string;
  filter: (kind: string) => void;
  inspect?: (event: TraceEvent) => void;
}) {
  const { label, document, turnNumber } = useReview();
  const e = action.anchor,
    kind = actionKind(action);
  const [open, setOpen] = useState(selected);
  useEffect(() => {
    if (selected) setOpen(true);
  }, [selected]);
  return (
    <article
      id={prefix + encodeURIComponent(action.key)}
      data-event-key={action.key}
      className={'event trace-action' + (selected ? ' selected-event' : '')}
    >
      <div className="event-meta">
        <span
          className={
            'session-badge ' +
            (e.threadId === document.threads[0]?.id ? 'session-main' : 'session-child')
          }
          title={e.threadId}
        >
          {label(e.threadId)}
        </span>
        <span>Turn {turnNumber(e.threadId, e.turnId)}</span>
        <span
          title={action.records
            .map(
              (r) =>
                `${r.sourcePath ?? r.threadId}:${r.sourceLine ?? r.ordinal}${r.callId ? ' · ' + r.callId : ''}`,
            )
            .join('\n')}
        >
          #{action.records.map((r) => r.sourceLine ?? r.ordinal).join(', ')}
        </span>
      </div>
      <details open={open} onToggle={(ev) => setOpen(ev.currentTarget.open)}>
        <summary className="action-summary">
          <button
            className={'type-badge type-' + kind}
            aria-label={'Filter ' + kind + ' records'}
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              filter(kind);
            }}
          >
            {kind}
          </button>
          <span className="action-description">{actionDescription(action)}</span>
        </summary>
        {action.executions.length ? (
          <>
            {action.executions.map((execution) => (
              <section className="execution-pair" key={execution.key}>
                {execution.exitCode != null && (
                  <p
                    className={
                      execution.exitCode ? 'warning execution-status' : 'small execution-status'
                    }
                  >
                    Exit {execution.exitCode}
                    {execution.durationMs !== undefined ? ' · ' + execution.durationMs + ' ms' : ''}
                  </p>
                )}
                <RecordBody event={execution} />
              </section>
            ))}
            {action.records.some((r) => !action.executions.includes(r)) && (
              <details className="tool-wrapper">
                <summary>Tool wrapper</summary>
                {action.records
                  .filter((r) => !action.executions.includes(r))
                  .map((r) => (
                    <RecordBody key={r.key} event={r} />
                  ))}
              </details>
            )}
          </>
        ) : (
          <>
            <RecordBody event={e} />
            {action.results
              .filter((r) => r !== e)
              .map((r) => (
                <RecordBody key={r.key} event={r} />
              ))}
          </>
        )}
      </details>
      {inspect && <button onClick={() => inspect(e)}>Inspect evidence</button>}
    </article>
  );
}
