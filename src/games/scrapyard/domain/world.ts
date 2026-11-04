import { hashSeed, random } from '../../../shared/random';
import {
  ARENA,
  DENSITIES,
  ENEMIES,
  RANGED,
  LIMITS,
  SEPARATION,
  RULES_VERSION,
  SHOP,
  WAVE_TICKS,
  WEAPONS,
  type Density,
  type Upgrade,
} from './content';

export interface Body {
  x: number;
  y: number;
}
export interface Enemy extends Body {
  id: number;
  hp: number;
  kind: number;
  radius: number;
  cooldown: number;
  aim: number;
}
export interface Shot extends Body {
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  life: number;
}
export interface Pickup extends Body {
  value: number;
}
export interface State {
  seed: string;
  density: Density;
  tick: number;
  waveTick: number;
  wave: number;
  phase: 'ready' | 'combat' | 'shop' | 'won' | 'lost';
  player: Body & { hp: number; invulnerable: number; speed: number; damage: number };
  enemies: Enemy[];
  shots: Shot[];
  hostileShots: Shot[];
  pickups: Pickup[];
  kills: number;
  scrap: number;
  purchased: Upgrade[];
  cooldowns: number[];
}
type ReadonlyValue<T> = T extends object ? { readonly [K in keyof T]: ReadonlyValue<T[K]> } : T;
export type View = ReadonlyValue<State>;
export type Command =
  | { type: 'start' | 'next' }
  | { type: 'frame'; x: number; y: number; ticks: number }
  | { type: 'buy'; item: Upgrade };
interface Replay {
  version: string;
  seed: string;
  density: Density;
  commands: Command[];
}
const MAX_COMMANDS = 6000;
const CELL = 64,
  COLS = Math.ceil(ARENA.width / CELL),
  ROWS = Math.ceil(ARENA.height / CELL);
const MAX_ENEMY_RADIUS = Math.max(...ENEMIES.map((enemy) => enemy.radius));
const SEPARATION_REACH = MAX_ENEMY_RADIUS * 2 + SEPARATION.gap;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const distance2 = (a: Body, b: Body) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
function validCommand(value: unknown): value is Command {
  if (!value || typeof value !== 'object') return false;
  if (!('type' in value)) return false;
  if (value.type === 'start' || value.type === 'next') return true;
  if (value.type === 'buy')
    return 'item' in value && typeof value.item === 'string' && Object.hasOwn(SHOP, value.item);
  return (
    value.type === 'frame' &&
    'x' in value &&
    'y' in value &&
    'ticks' in value &&
    typeof value.x === 'number' &&
    [-1, 0, 1].includes(value.x) &&
    typeof value.y === 'number' &&
    [-1, 0, 1].includes(value.y) &&
    typeof value.ticks === 'number' &&
    Number.isInteger(value.ticks) &&
    value.ticks >= 1 &&
    value.ticks <= 120
  );
}

/** Owns mutable combat storage. Callers receive a borrowed read-only view; snapshot for retention. */
export class World {
  private state: State;
  private rng: number;
  private nextId = 0;
  private journal: Command[] = [];
  private grid: number[][] = Array.from({ length: COLS * ROWS }, () => []);
  private pushes: Float64Array;
  private shotPool: Shot[] = [];
  constructor(seed = 'scrap-01', density: Density = 100) {
    if (!seed.length || seed.length > 80 || !DENSITIES.includes(density))
      throw new Error('Invalid run setup.');
    this.rng = hashSeed(seed);
    this.pushes = new Float64Array(density * 2);
    this.state = {
      seed,
      density,
      tick: 0,
      waveTick: 0,
      wave: 1,
      phase: 'ready',
      player: { x: 480, y: 300, hp: 100, invulnerable: 180, speed: 3.5, damage: 1 },
      enemies: [],
      shots: [],
      hostileShots: [],
      pickups: [],
      kills: 0,
      scrap: 0,
      purchased: [],
      cooldowns: WEAPONS.map((_, i) => i * 5),
    };
  }
  get view(): View {
    return this.state;
  }
  snapshot(): State {
    return structuredClone(this.state);
  }
  private roll(): number {
    const [value, next] = random(this.rng);
    this.rng = next;
    return value;
  }
  private spawn(enemy?: Enemy): Enemy {
    const edge = Math.floor(this.roll() * 4),
      along = this.roll();
    // Two of five slots are ranged, at every population setting.
    const kind = [0, 1, 2, 3, 3][Math.floor(this.roll() * 5)];
    const result = enemy ?? { id: 0, x: 0, y: 0, hp: 0, kind: 0, radius: 0, cooldown: 0, aim: 0 };
    Object.assign(result, {
      id: ++this.nextId,
      kind,
      radius: ENEMIES[kind].radius,
      hp: ENEMIES[kind].hp + (this.state.wave - 1) * 8,
      cooldown: Math.floor(this.roll() * RANGED.cooldown) + 1,
      x: edge < 2 ? 18 + along * 924 : edge === 2 ? 18 : 942,
      y: edge >= 2 ? 18 + along * 564 : edge === 0 ? 18 : 582,
    });
    result.aim = Math.atan2(this.state.player.y - result.y, this.state.player.x - result.x);
    return result;
  }
  private populate(): void {
    this.state.enemies = Array.from({ length: this.state.density }, () => this.spawn());
  }
  dispatch(raw: unknown): string | null {
    if (!validCommand(raw)) return 'Invalid action.';
    const s = this.state;
    if (this.journal.length >= MAX_COMMANDS) return 'Replay capacity reached. Start a new run.';
    switch (raw.type) {
      case 'start':
        if (s.phase !== 'ready') return 'The run has already started.';
        s.phase = 'combat';
        this.populate();
        break;
      case 'frame':
        if (s.phase !== 'combat') return 'Combat is not running.';
        for (let i = 0; i < raw.ticks && s.phase === 'combat'; i++) this.step(raw.x, raw.y);
        break;
      case 'buy': {
        if (s.phase !== 'shop') return 'The shop is closed.';
        const item = SHOP[raw.item];
        if (s.purchased.includes(raw.item)) return 'Already bought this wave.';
        if (s.scrap < item.cost) return 'Not enough scrap.';
        if (raw.item === 'repair' && s.player.hp === 100) return 'Health is full.';
        s.scrap -= item.cost;
        s.purchased.push(raw.item);
        if (raw.item === 'damage') s.player.damage += 0.25;
        if (raw.item === 'speed') s.player.speed += 3.5 * 0.15;
        if (raw.item === 'repair') s.player.hp = 100;
        break;
      }
      case 'next':
        if (s.phase !== 'shop') return 'Finish this wave first.';
        s.wave++;
        s.waveTick = 0;
        s.phase = 'combat';
        s.purchased = [];
        s.player.invulnerable = 180;
        this.populate();
        break;
    }
    // Pack consecutive held controls without retaining a per-frame state history.
    const last = this.journal.at(-1);
    if (
      raw.type === 'frame' &&
      last?.type === 'frame' &&
      raw.x === last.x &&
      raw.y === last.y &&
      last.ticks + raw.ticks <= 120
    )
      last.ticks += raw.ticks;
    else
      this.journal.push(
        raw.type === 'frame'
          ? { type: 'frame', x: raw.x, y: raw.y, ticks: raw.ticks }
          : raw.type === 'buy'
            ? { type: 'buy', item: raw.item }
            : { type: raw.type },
      );
    return null;
  }
  private visit(x0: number, y0: number, x1: number, y1: number, fn: (enemy: Enemy) => void): void {
    for (
      let y = clamp(Math.floor(y0 / CELL), 0, ROWS - 1);
      y <= clamp(Math.floor(y1 / CELL), 0, ROWS - 1);
      y++
    )
      for (
        let x = clamp(Math.floor(x0 / CELL), 0, COLS - 1);
        x <= clamp(Math.floor(x1 / CELL), 0, COLS - 1);
        x++
      )
        for (const index of this.grid[y * COLS + x]) {
          const enemy = this.state.enemies[index];
          if (enemy.hp > 0) fn(enemy);
        }
  }
  private buildGrid(): void {
    for (const cell of this.grid) cell.length = 0;
    this.state.enemies.forEach((enemy, index) => {
      this.grid[
        clamp(Math.floor(enemy.y / CELL), 0, ROWS - 1) * COLS +
          clamp(Math.floor(enemy.x / CELL), 0, COLS - 1)
      ].push(index);
    });
  }
  private separate(): void {
    const enemies = this.state.enemies;
    // Simultaneous symmetric corrections avoid array-order movement bias.
    for (let pass = 0; pass < SEPARATION.iterations; pass++) {
      this.buildGrid();
      this.pushes.fill(0);
      for (let i = 0; i < enemies.length; i++) {
        const a = enemies[i];
        for (
          let cy = Math.max(0, Math.floor((a.y - SEPARATION_REACH) / CELL));
          cy <= Math.min(ROWS - 1, Math.floor((a.y + SEPARATION_REACH) / CELL));
          cy++
        )
          for (
            let cx = Math.max(0, Math.floor((a.x - SEPARATION_REACH) / CELL));
            cx <= Math.min(COLS - 1, Math.floor((a.x + SEPARATION_REACH) / CELL));
            cx++
          )
            for (const j of this.grid[cy * COLS + cx]) {
              if (j <= i) continue;
              const b = enemies[j];
              let dx = a.x - b.x,
                dy = a.y - b.y;
              let d = Math.hypot(dx, dy);
              const desired = a.radius + b.radius + SEPARATION.gap;
              if (d >= desired) continue;
              if (d < 0.0001) {
                const angle = (((a.id * 31 + b.id * 17) % 360) * Math.PI) / 180;
                dx = Math.cos(angle);
                dy = Math.sin(angle);
                d = 1;
              }
              const push = (desired - d) * 0.5;
              const px = (dx / d) * push,
                py = (dy / d) * push;
              this.pushes[i * 2] += px;
              this.pushes[i * 2 + 1] += py;
              this.pushes[j * 2] -= px;
              this.pushes[j * 2 + 1] -= py;
            }
      }
      enemies.forEach((enemy, i) => {
        const dx = this.pushes[i * 2],
          dy = this.pushes[i * 2 + 1];
        const scale = Math.min(1, SEPARATION.maxPush / (Math.hypot(dx, dy) || 1));
        enemy.x = clamp(enemy.x + dx * scale, enemy.radius + 12, ARENA.width - enemy.radius - 12);
        enemy.y = clamp(enemy.y + dy * scale, enemy.radius + 12, ARENA.height - enemy.radius - 12);
      });
    }
    this.buildGrid();
  }
  private emit(
    list: Shot[],
    origin: Body,
    angle: number,
    speed: number,
    damage: number,
    radius: number,
    life: number,
  ): void {
    const shot = this.shotPool.pop() ?? { x: 0, y: 0, vx: 0, vy: 0, damage: 0, radius: 0, life: 0 };
    Object.assign(shot, {
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      radius,
      life,
    });
    list.push(shot);
  }
  private step(x: number, y: number): void {
    const s = this.state,
      p = s.player;
    s.tick++;
    s.waveTick++;
    const length = Math.hypot(x, y) || 1;
    p.x = clamp(p.x + (x / length) * p.speed, 20, 940);
    p.y = clamp(p.y + (y / length) * p.speed, 20, 580);
    p.invulnerable = Math.max(0, p.invulnerable - 1);
    for (const enemy of s.enemies) {
      const dx = p.x - enemy.x,
        dy = p.y - enemy.y,
        d = Math.hypot(dx, dy) || 1;
      const direction = enemy.kind !== RANGED.kind || d > RANGED.far ? 1 : d < RANGED.near ? -1 : 0;
      const speed = ENEMIES[enemy.kind].speed * (1 + (s.wave - 1) * 0.12) * direction;
      enemy.x += (dx / d) * Math.min(speed, d);
      enemy.y += (dy / d) * Math.min(speed, d);
    }
    this.separate();
    for (const enemy of s.enemies)
      if (enemy.kind === RANGED.kind) {
        if (enemy.cooldown > RANGED.windup) enemy.aim = Math.atan2(p.y - enemy.y, p.x - enemy.x);
        if (--enemy.cooldown <= 0) {
          enemy.cooldown = RANGED.cooldown;
          for (let i = 0; i < RANGED.pellets && s.hostileShots.length < LIMITS.hostileShots; i++)
            this.emit(
              s.hostileShots,
              enemy,
              enemy.aim + (i - (RANGED.pellets - 1) / 2) * RANGED.spread,
              RANGED.speed,
              RANGED.damage,
              RANGED.radius,
              RANGED.life,
            );
        }
      }
    let target: Enemy | undefined,
      nearest = 340 ** 2;
    this.visit(p.x - 340, p.y - 340, p.x + 340, p.y + 340, (enemy) => {
      const d = distance2(enemy, p);
      if (d < nearest || (d === nearest && enemy.id < (target?.id ?? Infinity))) {
        nearest = d;
        target = enemy;
      }
    });
    WEAPONS.forEach((weapon, i) => {
      s.cooldowns[i] = Math.max(0, s.cooldowns[i] - 1);
      if (s.cooldowns[i] || !target) return;
      s.cooldowns[i] = weapon.cooldown;
      const aim = Math.atan2(target.y - p.y, target.x - p.x);
      for (let n = 0; n < weapon.pellets && s.shots.length < LIMITS.friendlyShots; n++) {
        const angle = aim + (n - (weapon.pellets - 1) / 2) * 0.19;
        this.emit(s.shots, p, angle, weapon.speed, weapon.damage * p.damage, weapon.radius, 70);
      }
    });
    let alive = 0;
    for (const shot of s.shots) {
      const oldX = shot.x,
        oldY = shot.y;
      shot.x += shot.vx;
      shot.y += shot.vy;
      shot.life--;
      let victim: Enemy | undefined,
        earliest = Infinity;
      const reach = MAX_ENEMY_RADIUS + shot.radius,
        speed2 = shot.vx ** 2 + shot.vy ** 2;
      this.visit(
        Math.min(oldX, shot.x) - reach,
        Math.min(oldY, shot.y) - reach,
        Math.max(oldX, shot.x) + reach,
        Math.max(oldY, shot.y) + reach,
        (enemy) => {
          const t = clamp(((enemy.x - oldX) * shot.vx + (enemy.y - oldY) * shot.vy) / speed2, 0, 1);
          if (
            (enemy.x - oldX - shot.vx * t) ** 2 + (enemy.y - oldY - shot.vy * t) ** 2 <=
              (enemy.radius + shot.radius) ** 2 &&
            (t < earliest || (t === earliest && enemy.id < (victim?.id ?? Infinity)))
          ) {
            victim = enemy;
            earliest = t;
          }
        },
      );
      if (victim) {
        victim.hp -= shot.damage;
        shot.life = 0;
      }
      if (shot.x < 0 || shot.x > 960 || shot.y < 0 || shot.y > 600) shot.life = 0;
      if (shot.life > 0) s.shots[alive++] = shot;
      else this.shotPool.push(shot);
    }
    s.shots.length = alive;
    alive = 0;
    for (const shot of s.hostileShots) {
      const oldX = shot.x,
        oldY = shot.y;
      shot.x += shot.vx;
      shot.y += shot.vy;
      shot.life--;
      const t = clamp(
        ((p.x - oldX) * shot.vx + (p.y - oldY) * shot.vy) / (shot.vx ** 2 + shot.vy ** 2),
        0,
        1,
      );
      if (
        (p.x - oldX - shot.vx * t) ** 2 + (p.y - oldY - shot.vy * t) ** 2 <=
        (12 + shot.radius) ** 2
      ) {
        if (!p.invulnerable) {
          p.hp = Math.max(0, p.hp - shot.damage);
          p.invulnerable = 90;
        }
        shot.life = 0;
      }
      if (shot.x < 0 || shot.x > ARENA.width || shot.y < 0 || shot.y > ARENA.height) shot.life = 0;
      if (shot.life > 0) s.hostileShots[alive++] = shot;
      else this.shotPool.push(shot);
    }
    s.hostileShots.length = alive;
    this.visit(p.x - 30, p.y - 30, p.x + 30, p.y + 30, (enemy) => {
      if (!p.invulnerable && distance2(p, enemy) < (enemy.radius + 12) ** 2) {
        p.hp = Math.max(0, p.hp - 8);
        p.invulnerable = 90;
      }
    });
    for (const enemy of s.enemies)
      if (enemy.hp <= 0) {
        s.kills++;
        if (s.pickups.length < LIMITS.pickups) s.pickups.push({ x: enemy.x, y: enemy.y, value: 1 });
        else s.pickups[enemy.id % s.pickups.length].value++;
        this.spawn(enemy);
      }
    alive = 0;
    for (const pickup of s.pickups) {
      const d = Math.hypot(p.x - pickup.x, p.y - pickup.y);
      if (d < 18) s.scrap += pickup.value;
      else {
        if (d < 110) {
          pickup.x += ((p.x - pickup.x) / d) * 6;
          pickup.y += ((p.y - pickup.y) / d) * 6;
        }
        s.pickups[alive++] = pickup;
      }
    }
    s.pickups.length = alive;
    if (!p.hp) s.phase = 'lost';
    else if (s.waveTick >= WAVE_TICKS) {
      s.phase = s.wave === 3 ? 'won' : 'shop';
      s.scrap += 10 + s.pickups.reduce((sum, pickup) => sum + pickup.value, 0);
      s.pickups.length = 0;
      this.shotPool.push(...s.shots);
      this.shotPool.push(...s.hostileShots);
      s.shots.length = 0;
      s.hostileShots.length = 0;
    }
  }
  export(): string {
    return JSON.stringify({
      version: RULES_VERSION,
      seed: this.state.seed,
      density: this.state.density,
      commands: this.journal,
    } satisfies Replay);
  }
}

/** Validate and reconstruct before adoption; malformed or rejected actions never become a save. */
export function restore(text: string): World {
  if (text.length > 1_000_000) throw new Error('Replay is too large.');
  const raw: unknown = JSON.parse(text);
  if (
    !raw ||
    typeof raw !== 'object' ||
    !('version' in raw) ||
    raw.version !== RULES_VERSION ||
    !('seed' in raw) ||
    typeof raw.seed !== 'string' ||
    !('density' in raw) ||
    !DENSITIES.includes(raw.density as Density) ||
    !('commands' in raw) ||
    !Array.isArray(raw.commands) ||
    raw.commands.length > MAX_COMMANDS
  )
    throw new Error('Unsupported replay.');
  const world = new World(raw.seed, raw.density as Density);
  for (const command of raw.commands as unknown[]) {
    const error = world.dispatch(command);
    if (error) throw new Error(error);
  }
  return world;
}
