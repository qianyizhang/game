import { duration } from './metadata.tsx';
import { signalLabels } from './signals.ts';
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
export function RecordBody({ event: e, images = true }: { event: TraceEvent; images?: boolean }) {
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
      {images &&
        e.imageUrls
          ?.filter((url) => /^data:image\/(png|jpeg|webp|gif);base64,/.test(url))
          .map((url, i) => (
            <img key={i} src={url} alt="Image retained in this trace record" loading="lazy" />
          ))}
      {images && e.body && e.body.imageCount > 0 && (
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
      {e.relatedThreads
        .filter((id) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))
        .map((id) => (
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
export const actionKind = (action: TraceAction) => {
  const kinds = new Set(action.executions.map((e) => e.kind));
  const e = kinds.size === 1 ? action.executions[0] : action.anchor;
  return e.kind === 'message' && e.messagePhase
    ? e.messagePhase === 'commentary'
      ? 'commentary'
      : 'response'
    : e.kind;
};
export function actionDescription(action: TraceAction) {
  const e = action.executions[0] ?? action.anchor;
  if (action.executions.length && e.kind === 'image')
    return `Image inspection · ${action.executions.filter((r) => r.kind === 'image').length} images`;
  if (e.kind === 'edit' && e.paths.length)
    return e.paths.map((path) => path.split('/').at(-1)).join(', ');
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
  const { label, document, turnNumber, events, update } = useReview();
  const e = action.anchor,
    kind = actionKind(action);
  const [sequenceOpen, setSequenceOpen] = useState(false);
  const imageResults = action.results.filter(
    (r) => (r.body?.imageCount ?? r.imageUrls?.length ?? 0) > 0,
  );
  const [open, setOpen] = useState(selected || (kind === 'image' && imageResults.length > 0));
  const end = action.results.at(-1)?.timestamp;
  const elapsed = action.executions.length === 1 ? action.executions[0].durationMs : undefined;
  const span =
    elapsed ?? (e.timestamp && end ? Date.parse(end) - Date.parse(e.timestamp) : undefined);
  const last = Math.max(...action.records.map((r) => r.ordinal));
  const sequence = sequenceOpen
    ? events.filter(
        (r) =>
          r.threadId === e.threadId &&
          r.turnId === e.turnId &&
          r.ordinal >= e.ordinal &&
          r.ordinal <= last,
      )
    : [];
  const interleaved =
    action.records.length > 1 &&
    events.some(
      (r) =>
        r.threadId === e.threadId &&
        r.turnId === e.turnId &&
        r.ordinal > e.ordinal &&
        r.ordinal < last &&
        !action.records.includes(r),
    );
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
          className="source-positions"
          title={action.records
            .map(
              (r) =>
                `${r.sourcePath ?? r.threadId}:${r.sourceLine ?? r.ordinal}${r.callId ? ' · ' + r.callId : ''}`,
            )
            .join('\n')}
        >
          #{action.records.map((r) => r.sourceLine ?? r.ordinal).join(', ')}
        </span>
        {action.signals.map((signal) => (
          <span className="action-signal" key={signal}>
            {signalLabels[signal]}
          </span>
        ))}
        <span className="action-metadata">
          {e.timestamp && (
            <time dateTime={e.timestamp} title={e.timestamp}>
              {new Date(e.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </time>
          )}
          {span !== undefined && span >= 0 && (
            <span title="Recorded action elapsed time">{duration(span)}</span>
          )}
          {action.executions.some((r) => r.exitCode != null && r.exitCode !== 0) && (
            <span className="warning">Nonzero exit</span>
          )}
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
        {imageResults.length > 0 && action.executions.some((r) => r.kind === 'image') && (
          <div className="image-gallery">
            {imageResults.map((result) => (
              <RecordedImages
                key={result.key}
                event={result}
                captions={action.executions
                  .filter((r) => r.kind === 'image')
                  .flatMap((r) => r.paths)}
              />
            ))}
          </div>
        )}
        {action.executions.length ? (
          <>
            {action.executions
              .filter((execution) => !(imageResults.length && execution.kind === 'image'))
              .map((execution) => (
                <section className="execution-pair" key={execution.key}>
                  {execution.exitCode != null && (
                    <p
                      className={
                        execution.exitCode ? 'warning execution-status' : 'small execution-status'
                      }
                    >
                      Exit {execution.exitCode}
                      {execution.durationMs !== undefined
                        ? ' · ' + duration(execution.durationMs)
                        : ''}
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
                    <RecordBody
                      key={r.key}
                      event={r}
                      images={
                        !imageResults.length || !action.executions.some((r) => r.kind === 'image')
                      }
                    />
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
                <RecordBody
                  key={r.key}
                  event={r}
                  images={
                    !imageResults.length || !action.executions.some((r) => r.kind === 'image')
                  }
                />
              ))}
          </>
        )}
        {action.records.length > 1 && (
          <details
            className="source-sequence"
            onToggle={(ev) => setSequenceOpen(ev.currentTarget.open)}
          >
            <summary>
              {interleaved
                ? 'Source sequence · other activity occurred during this action'
                : 'Source sequence'}
            </summary>
            {sequenceOpen && (
              <ol>
                {sequence.map((record) => (
                  <li key={record.key}>
                    <button
                      onClick={() =>
                        update({
                          view: 'events',
                          session: e.threadId,
                          actionTurn: JSON.stringify([e.threadId, e.turnId]),
                          event: record.key,
                          kind: 'all',
                          signal: 'all',
                          search: '',
                          scope: 'all',
                          evidenceRole: 'all',
                        })
                      }
                    >
                      #{record.sourceLine ?? record.ordinal} · {record.title}
                      {!action.records.includes(record) ? ' · separate action' : ''}
                    </button>
                    {record.timestamp && (
                      <time dateTime={record.timestamp}>{record.timestamp.slice(11, 23)}</time>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </details>
        )}
      </details>
      {inspect && <button onClick={() => inspect(e)}>Inspect evidence</button>}
    </article>
  );
}

function RecordedImages({ event, captions }: { event: TraceEvent; captions: string[] }) {
  const { source } = useReview();
  const urls = event.body
    ? Array.from({ length: event.body.imageCount }, (_, i) => source.image(event, i))
    : (event.imageUrls ?? []).filter((url) => /^data:image\/(png|jpeg|webp|gif);base64,/.test(url));
  return (
    <>
      {urls.map((url, index) => (
        <figure key={index}>
          <a href={url} target="_blank" rel="noreferrer" title="Open retained image">
            <img
              src={url}
              alt={
                urls.length === 1 && captions.length === 1
                  ? captions[0].split('/').at(-1)
                  : `Retained image ${index + 1}`
              }
              loading="lazy"
              onError={(ev) => {
                ev.currentTarget.alt =
                  'Retained image unavailable; reopen the trace if its source changed.';
              }}
            />
          </a>
          <figcaption>
            {urls.length === 1 && captions.length === 1
              ? captions[0].split('/').slice(-2).join('/')
              : `Retained image ${index + 1}`}
          </figcaption>
        </figure>
      ))}
      {captions.length > 1 && (
        <p
          className="gallery-paths provenance"
          title="Inspection paths in source order; the tool can emit images in a different order."
        >
          Inspected paths: {captions.map((path) => path.split('/').slice(-2).join('/')).join(' · ')}
        </p>
      )}
    </>
  );
}
