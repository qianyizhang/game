import * as T from 'three';
import {
  dispatch,
  importSession,
  newSession,
  SAVE_KEY,
  type Session,
} from '../../src/games/night-passage/application/session';
import { validCommand } from '../../src/games/night-passage/domain/game';
import type { Command, State } from '../../src/games/night-passage/domain/types';
import {
  createCamera,
  fitCamera,
  groundDirection,
} from '../../src/games/night-passage/ui/presentation/scene/camera';
import { passageCommand } from '../simulation/night-passage-policy';

// This observer only reads the application's published save and scene. It never dispatches to
// the application's session or changes game state. Synthetic DOM input owns all progress.
let prefix: Session | null = null;
let prefixLength = 0;
const roots = new Set<T.Object3D>();
const held = new Set<string>();
let restoreObserver = () => {};

export function observeCampaign() {
  restoreObserver();
  roots.clear();
  prefix = null;
  prefixLength = 0;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- apply preserves receiver; cleanup restores the original.
  const original = T.Object3D.prototype.add;
  T.Object3D.prototype.add = function (...objects) {
    for (const object of objects) if (object.name.startsWith('night-passage-')) roots.add(object);
    return original.apply(this, objects);
  };
  restoreObserver = () => {
    T.Object3D.prototype.add = original;
  };
}

function decode(encoded: Command | number[]): Command {
  if (!Array.isArray(encoded)) return encoded;
  const [ticks, x, y, aim, mask] = encoded;
  const command = {
    type: 'frame',
    ticks,
    input: {
      x,
      y,
      aim,
      attack: !!(mask & 1),
      special: !!(mask & 2),
      dash: !!(mask & 4),
      cast: !!(mask & 8),
      call: !!(mask & 16),
    },
  };
  if (!validCommand(command)) throw new Error('Application emitted invalid packed input');
  return command;
}

/** Reconstruct the growing public journal; keep its last mergeable command uncommitted. */
function saved(): Session {
  // Exercise the existing save-on-pagehide handler without navigating or changing visibility.
  window.dispatchEvent(new PageTransitionEvent('pagehide'));
  const text = localStorage.getItem(SAVE_KEY);
  if (!text) throw new Error('Application did not publish its chronicle');
  const envelope = JSON.parse(text) as { seed: string; commands: (Command | number[])[] };
  if (!prefix || prefix.state.seed !== envelope.seed || prefixLength >= envelope.commands.length) {
    prefix = newSession(envelope.seed);
    prefixLength = 0;
  }
  let current = prefix;
  for (let index = prefixLength; index < envelope.commands.length; index++) {
    const result = dispatch(current, decode(envelope.commands[index]));
    if (result.error) throw new Error(`Published chronicle rejected: ${result.error}`);
    current = result.session;
    if (index < envelope.commands.length - 1) {
      prefix = current;
      prefixLength = index + 1;
    }
  }
  return current;
}

function field() {
  const element = document.querySelector<HTMLCanvasElement>(
    'canvas[aria-label="Night Passage combat arena"]',
  );
  if (!element) throw new Error('Actual game canvas is missing');
  return element;
}
function active(root: T.Object3D) {
  let current: T.Object3D | null = root;
  while (current) {
    if (!current.visible) return false;
    if (current instanceof T.Scene) return true;
    current = current.parent;
  }
  return false;
}
function native(state: State) {
  const environments = ['sepulcher', 'archive', 'cinder', 'starless'];
  const guardians = ['bellwarden', 'undertow', 'ashregent', 'sovereign'];
  const required = new Map<string, number>([
    ['hero', 1],
    [environments[state.region], 1],
  ]);
  for (const enemy of state.enemies) {
    const kind = enemy.kind === 'boss' ? guardians[state.region] : enemy.kind;
    required.set(kind, (required.get(kind) ?? 0) + 1);
  }
  return [...required].map(([kind, count]) => ({
    kind,
    required: count,
    active: [...roots].filter(
      (root) => root.name === `night-passage-authored-${kind}` && active(root),
    ).length,
  }));
}
export function inspectCampaign() {
  const session = saved(),
    state = session.state;
  return {
    phase: state.phase,
    tick: state.tick,
    region: state.region,
    chamber: state.chamber,
    boss: state.room.boss,
    hp: state.player.hp,
    kills: state.kills,
    roomsCleared: state.roomsCleared,
    native: native(state),
    gold: state.gold,
    boons: state.player.boons.map((b) => b.id),
    winningProfile: state.profile,
    commands: session.journal?.length ?? 0,
    warnings: state.enemies.filter((e) => e.windup > 0).length,
  };
}

export function releaseCampaignInput() {
  const element = field();
  for (const key of held) element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  held.clear();
}

export function driveCampaign() {
  const state = saved().state;
  if (state.phase === 'won' || state.phase === 'lost') {
    releaseCampaignInput();
    return state.phase;
  }
  const command = passageCommand(state);
  const element = field();
  if (command.type === 'frame') {
    element.focus();
    const box = element.getBoundingClientRect();
    const camera = createCamera();
    fitCamera(camera, box.width / box.height);
    const right = groundDirection(camera, { x: 1, y: 0 });
    const input = command.input;
    const screen = {
      x: right.x * input.x + right.y * input.y,
      y: -right.y * input.x + right.x * input.y,
    };
    // The public keyboard exposes eight directions, so choose its nearest legal direction.
    const angle = (Math.round(Math.atan2(screen.y, screen.x) / (Math.PI / 4)) * Math.PI) / 4;
    const x = Math.round(Math.cos(angle)),
      y = Math.round(Math.sin(angle));
    const desired = new Set<string>();
    if (x) desired.add(x > 0 ? 'd' : 'a');
    if (y) desired.add(y > 0 ? 's' : 'w');
    for (const [key, enabled] of [
      ['j', input.attack],
      ['k', input.special],
      [' ', input.dash],
      ['q', input.cast],
      ['r', input.call],
    ] as const)
      if (enabled) desired.add(key);
    for (const key of held)
      if (!desired.has(key)) {
        element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
        held.delete(key);
      }
    for (const key of desired)
      if (!held.has(key)) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        held.add(key);
      }
    const target = new T.Vector3(
      state.player.x + Math.cos(input.aim) * 250,
      0,
      state.player.y + Math.sin(input.aim) * 250,
    ).project(camera);
    element.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        clientX: box.x + ((target.x + 1) * box.width) / 2,
        clientY: box.y + ((1 - target.y) * box.height) / 2,
      }),
    );
  } else {
    releaseCampaignInput();
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('.np-choices button')];
    let button: HTMLButtonElement | undefined;
    if (command.type === 'choose') button = buttons[state.offers.indexOf(command.id)];
    if (command.type === 'travel') button = buttons[command.index];
    if (command.type === 'buy') button = buttons[['heal', 'heart', 'boon'].indexOf(command.item)];
    if (command.type === 'leave')
      button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) => b.textContent === 'Leave market',
      );
    if (!button || button.disabled)
      throw new Error(`Unavailable UI decision ${JSON.stringify(command)}`);
    button.click();
  }
  return command.type;
}

export function finishCampaignObservation() {
  releaseCampaignInput();
  const observed = saved();
  const text = localStorage.getItem(SAVE_KEY)!;
  const full = importSession(text);
  if (JSON.stringify(full.state) !== JSON.stringify(observed.state))
    throw new Error('Incremental observation differs from full validated reconstruction');
  restoreObserver();
  return { text, state: full.state, ticks: full.ticks };
}
