import { useEffect, useRef, useState } from 'react';
import model from '../../../../packages/dcc-workbench/assets/canid/refined/ash.glb?url';
import metadata from '../../../../packages/dcc-workbench/assets/canid/refined/ash.motions.json';
import { readMotions } from '../../../../packages/dcc-workbench/motion-contract';
import {
  createAttackStage,
  type AttackPose,
} from '../../../../packages/dcc-workbench/src/attack-stage';
import type { CombatFrame, CombatResult } from '../domain/types';
import { MINION_BY_ID } from '../content/minions';
import { MinionCard } from './MinionCard';
import './canid-attack.css';

const library = readMotions(metadata);
const attacks = ['lunge', 'bite', 'swipe'] as const;

export default function CanidAttackStage({
  result,
  index,
  progress,
  inspect,
}: {
  result: CombatResult;
  index: number;
  progress: number;
  inspect: boolean;
}) {
  const frameIndex = Math.max(0, Math.min(index, result.frames.length - 1));
  const frame = result.frames[frameIndex];
  if (!frame) return null;
  const ordinal = result.frames
    .slice(0, frameIndex)
    .filter(
      (f) =>
        f.attacker &&
        f.boards.flat().some((u) => u.id === f.attacker && u.definitionId === 'stray'),
    ).length;
  return <AttackFrame frame={frame} ordinal={ordinal} progress={progress} inspect={inspect} />;
}

function AttackFrame({
  frame,
  ordinal,
  progress,
  inspect,
}: {
  frame: CombatFrame;
  ordinal: number;
  progress: number;
  inspect: boolean;
}) {
  const units = frame.boards.flat();
  const attacker = units.find((u) => u.id === frame.attacker);
  const target = units.find((u) => u.id === frame.target);
  const attacking = attacker?.definitionId === 'stray' && !!target;
  const alive = units.some((u) => u.definitionId === 'stray' && u.health > 0);
  const clip = attacking ? attacks[ordinal % attacks.length] : 'idle';
  const contact =
    (library[clip].markers.find((m) => m.name === 'contact')?.time ?? 0) / library[clip].seconds;
  const [reduced, setReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [status, setStatus] = useState('Loading 3D attack…');
  const host = useRef<HTMLDivElement>(null);
  const current = useRef<AttackPose>({ clip, progress: 0, side: 0, visible: false });
  const side = frame.boards[1].some((u) => u.id === attacker?.id) ? 1 : 0;
  current.current = {
    clip,
    progress: attacking ? (reduced || inspect ? contact : progress) : 0,
    side,
    visible: attacking || alive,
  };
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setReduced(preference.matches);
    preference.addEventListener('change', changed);
    let dispose: (() => void) | undefined;
    try {
      dispose = createAttackStage(element, model, library, () => current.current, setStatus);
    } catch {
      setStatus('3D unavailable; the combat replay remains available below.');
    }
    return () => {
      preference.removeEventListener('change', changed);
      dispose?.();
    };
  }, []);
  return (
    <section
      className="canid-attack"
      aria-label="Briar Stray attack stage"
      data-active={attacking}
      data-reduced-motion={reduced}
    >
      <div className="canid-attack-heading">
        <strong>
          Briar Stray ·{' '}
          {attacking ? library[clip].name : alive ? 'awaiting attack' : 'out of combat'}
        </strong>
        <span>{attacking && target ? `→ ${MINION_BY_ID[target.definitionId].name}` : ''}</span>
      </div>
      <div
        ref={host}
        className="canid-attack-canvas"
        data-ready={status === 'ready'}
        style={{ visibility: attacking || alive ? 'visible' : 'hidden' }}
      />
      {attacking && target && (
        <div
          aria-hidden="true"
          inert
          className={`canid-attack-target ${side === 1 ? 'target-left' : ''}`}
        >
          <MinionCard unit={target} compact />
        </div>
      )}
      {status !== 'ready' && (
        <p role="status" className="canid-attack-status">
          {status}
        </p>
      )}
      <p className="canid-attack-caption">
        {!attacking
          ? 'Follow the resolved combat on the card board below'
          : reduced
            ? 'Still contact pose · reduced motion'
            : inspect
              ? 'Contact pose · selected combat event'
              : 'Resolved attack · follows replay playback'}
      </p>
    </section>
  );
}
