import { useEffect, useRef } from 'react';
import { ACT_NAMES } from '../content/world';
import { availableNodes } from '../domain/map';
import type { NodeKind, SpireCommand, SpireState } from '../domain/types';
export const nodeIcons: Record<NodeKind, string> = {
  fight: '⚔',
  elite: '♜',
  event: '?',
  rest: '♨',
  shop: '$',
  treasure: '▣',
  boss: '♛',
};
export function RouteMap({
  run,
  dispatch,
}: {
  run: SpireState;
  dispatch: (c: SpireCommand) => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const available = availableNodes(run);
  const x = (lane: number) => 45 + lane * 67;
  const y = (row: number) => 65 + (15 - row) * 72;
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = Math.max(0, y(Math.max(0, run.row)) - 300);
  }, [run.act, run.row]);
  return (
    <section className="sts-map-panel">
      <div className="map-heading">
        <p className="eyebrow">ACT {run.act}</p>
        <h2>{ACT_NAMES[run.act - 1]}</h2>
        <p>Choose a highlighted room. Follow the dotted paths upward.</p>
      </div>
      <div className="sts-map-scroll" ref={scroll}>
        <div className="sts-map-canvas">
          <svg viewBox="0 0 492 1220" aria-hidden="true">
            {run.map.flatMap((n) =>
              n.next.map((id) => {
                const to = run.map.find((m) => m.id === id)!;
                return (
                  <line
                    key={`${n.id}-${id}`}
                    x1={x(n.lane)}
                    y1={y(n.row)}
                    x2={x(to.lane)}
                    y2={y(to.row)}
                    className={n.visited && to.visited ? 'traveled' : ''}
                  />
                );
              }),
            )}
          </svg>
          {run.map.map((node) => (
            <button
              key={node.id}
              className={`sts-map-node ${node.kind} ${node.visited ? 'visited' : ''} ${available.some((n) => n.id === node.id) ? 'reachable' : ''}`}
              style={{ left: `${(x(node.lane) / 492) * 100}%`, top: y(node.row) }}
              disabled={!available.some((n) => n.id === node.id)}
              onClick={() => dispatch({ type: 'chooseNode', id: node.id })}
              aria-label={`Floor ${node.row + 1} lane ${node.lane + 1} ${node.kind}`}
              title={`${node.kind} · floor ${node.row + 1}`}
            >
              <span>{nodeIcons[node.kind]}</span>
              {node.visited && <small>✓</small>}
            </button>
          ))}
        </div>
      </div>
      <div className="sts-map-legend">
        {Object.entries(nodeIcons).map(([kind, icon]) => (
          <span key={kind}>
            {icon} {kind}
          </span>
        ))}
      </div>
    </section>
  );
}
