import { useEffect, type RefObject } from 'react';
import type { Session } from '../application/session';
import type { Command, Point, State } from '../domain/types';
import { STEP_MS } from '../domain/timing';
import type { SkillEffects } from './skill-effects';
import { render } from './render';

export interface FrameClock {
  last: number | null;
  remainder: number;
}
/** Cap catch-up at 250 ms; suspended intervals never advance the game. */
export function stepFrame(
  clock: FrameClock,
  now: number,
  active: boolean,
): { ticks: number; alpha: number } {
  const elapsed = clock.last === null ? 0 : Math.max(0, Math.min(250, now - clock.last));
  clock.last = now;
  if (!active) {
    clock.remainder = 0;
    return { ticks: 0, alpha: 1 };
  }
  clock.remainder += elapsed;
  const ticks = Math.floor(clock.remainder / STEP_MS);
  clock.remainder -= ticks * STEP_MS;
  return { ticks, alpha: clock.remainder / STEP_MS };
}
/** Canvas owns refresh-rate presentation; React owns menus and the slower HUD. */
export function useFieldRuntime(
  canvas: RefObject<HTMLCanvasElement | null>,
  current: RefObject<Session | null>,
  previous: RefObject<State | null>,
  viewCamera: RefObject<Point | undefined>,
  send: (command: Command) => void,
  active: boolean,
  showMap: boolean,
  visible: boolean,
  effects: RefObject<SkillEffects>,
): void {
  useEffect(() => {
    if (!visible) return;
    const clock: FrameClock = { last: null, remainder: 0 };
    let request = 0,
      frames = 0;
    const frame = (now: number) => {
      const ready = current.current?.state;
      const running =
        active && !document.hidden && ready?.status === 'playing' && ready.location === 'field';
      const { ticks, alpha } = stepFrame(clock, now, running);
      if (ticks) send({ type: 'advance', ticks });
      const session = current.current;
      if (canvas.current && session?.state.location === 'field') {
        viewCamera.current = render(
          canvas.current,
          session.state,
          session.replay.content,
          showMap,
          {
            previous: previous.current,
            alpha,
            time: ((session.state.tick + (running ? alpha : 0)) * STEP_MS) / 1000,
            effects: effects.current,
          },
        );
        canvas.current.dataset.frames = String(++frames);
        canvas.current.dataset.ticks = String(session.state.tick);
      }
      request = requestAnimationFrame(frame);
    };
    request = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(request);
  }, [canvas, current, previous, viewCamera, send, active, showMap, visible, effects]);
}
