/** The saved action owns this contract; both delivery checks and players consume it. */
import { record } from './contracts.ts';

export type Motion = {
  name: string;
  seconds: number;
  playback: 'loop' | 'once';
  trajectory: [number, number, number, number][];
  markers: { name: string; time: number }[];
  contacts: { start: number; end: number; sites: string[]; mode: 'planted' | 'rolling' }[];
};
const finite = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Invalid motion number');
  return value;
};
const array = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) throw new Error('Missing motion samples');
  return value as unknown[];
};
const name = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Missing motion name');
  return value;
};
export function readMotions(value: unknown): Record<string, Motion> {
  const motions = Object.fromEntries(
    Object.entries(record(value)).map(([id, raw]) => {
      const item = record(raw);
      const seconds = finite(item.seconds);
      if (seconds <= 0 || (item.playback !== 'loop' && item.playback !== 'once'))
        throw new Error(`Invalid playback: ${id}`);
      const trajectory = array(item.trajectory).map((raw): Motion['trajectory'][number] => {
        const p = array(raw).map(finite);
        if (p.length !== 4) throw new Error('Invalid trajectory sample');
        return [p[0], p[1], p[2], p[3]];
      });
      if (
        trajectory.length < 2 ||
        trajectory[0][0] !== 0 ||
        Math.abs(trajectory.at(-1)![0] - seconds) > 1e-6 ||
        trajectory.some((p, i) => i > 0 && p[0] <= trajectory[i - 1][0])
      )
        throw new Error('Incomplete motion trajectory');
      const markers = array(item.markers).map((raw) => {
        const m = record(raw),
          time = finite(m.time);
        if (time < 0 || time > seconds) throw new Error('Marker outside motion');
        return { name: name(m.name), time };
      });
      const contacts = array(item.contacts).map((raw): Motion['contacts'][number] => {
        const c = record(raw),
          start = finite(c.start),
          end = finite(c.end);
        const sites = array(c.sites).map(name);
        if (
          start < 0 ||
          end < start ||
          end > seconds ||
          !sites.length ||
          (c.mode !== 'planted' && c.mode !== 'rolling')
        )
          throw new Error('Invalid support phase');
        return { start, end, sites, mode: c.mode };
      });
      return [
        id,
        {
          name: name(item.name),
          seconds,
          playback: item.playback,
          trajectory,
          contacts,
          markers,
        } satisfies Motion,
      ];
    }),
  );
  if (!Object.keys(motions).length) throw new Error('Empty motion library');
  return motions;
}

/** A single owner applies scene travel. Local skeletal clips never duplicate this transform. */
export function travelAt(motion: Motion, seconds: number): { x: number; z: number; yaw: number } {
  const t = Math.max(0, Math.min(motion.seconds, seconds));
  const i = motion.trajectory.findIndex((p) => p[0] >= t);
  const b = motion.trajectory[i < 0 ? motion.trajectory.length - 1 : i];
  const a = motion.trajectory[Math.max(0, i - 1)];
  const fraction = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]);
  return {
    x: a[1] + (b[1] - a[1]) * fraction,
    z: a[2] + (b[2] - a[2]) * fraction,
    yaw: a[3] + (b[3] - a[3]) * fraction,
  };
}
