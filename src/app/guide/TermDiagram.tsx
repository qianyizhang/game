import { useState } from 'react';
import type { TermVisual } from './glossary';

function Flow({ steps }: { steps: [string, string][] }) {
  return (
    <div className="glossary-flow">
      {steps.map(([title, detail], i) => (
        <div key={title}>
          <span aria-hidden="true">0{i + 1}</span>
          <strong>{title}</strong>
          <small>{detail}</small>
        </div>
      ))}
    </div>
  );
}

/** HTML keeps the diagrams readable, selectable and accessible at phone width. */
export function TermDiagram({ kind }: { kind: TermVisual }) {
  const [damage, setDamage] = useState(12);
  const [block, setBlock] = useState(8);
  if (kind === 'block')
    return (
      <figure className="term-diagram block-demo">
        <figcaption>Try one incoming hit</figcaption>
        <label>
          Incoming damage <output>{damage}</output>
          <input
            aria-label="Incoming damage"
            type="range"
            min="0"
            max="20"
            value={damage}
            onChange={(e) => setDamage(Number(e.target.value))}
          />
        </label>
        <label>
          Your Block <output>{block}</output>
          <input
            aria-label="Your Block"
            type="range"
            min="0"
            max="20"
            value={block}
            onChange={(e) => setBlock(Number(e.target.value))}
          />
        </label>
        <div className="block-result" aria-live="polite">
          <strong>{Math.max(0, damage - block)} HP lost</strong>
          <span>{Math.max(0, block - damage)} Block left</span>
        </div>
        <p>
          Simplified example: one hit, no other effects. Thorns is a separate return hit and can
          also be absorbed by your Block.
        </p>
      </figure>
    );
  if (kind === 'matrix')
    return (
      <figure className="term-diagram">
        <figcaption>A policy × difficulty matrix</figcaption>
        <table>
          <caption>Each cell is a set of attempts, not a result</caption>
          <thead>
            <tr>
              <th>Bot</th>
              <th>Easy</th>
              <th>Standard</th>
              <th>Hard</th>
            </tr>
          </thead>
          <tbody>
            {['Immediate', 'Survival', 'Growth'].map((name) => (
              <tr key={name}>
                <th>{name}</th>
                {[0, 1, 2].map((i) => (
                  <td key={i}>Test</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p>Use the game’s actual tier names and the same comparison seeds.</p>
      </figure>
    );
  const scenes: Record<
    Exclude<TermVisual, 'block' | 'matrix'>,
    { caption: string; steps: [string, string][]; note: string }
  > = {
    policy: {
      caption: 'How a bot takes a turn',
      steps: [
        ['Observation', 'What it is told'],
        ['Policy', 'Chooses a proposal'],
        ['Rules', 'Accept or reject'],
      ],
      note: 'The bot chooses. The game owns damage, resources and legality.',
    },
    evidence: {
      caption: 'Replay and rollout answer different questions',
      steps: [
        ['Observation', 'What it knew'],
        ['Proposal', 'What it requested'],
        ['Replay', 'Accepted actions'],
      ],
      note: 'A rollout links all three with the result. Reconstruction alone does not prove fair knowledge or good play.',
    },
    difficulty: {
      caption: 'Two separate knobs',
      steps: [
        ['Game difficulty', 'How hard the world is'],
        ['Player controls', 'How the bot can act'],
      ],
      note: 'A tougher world and a slower decision-maker can both reduce wins. Change and report them separately.',
    },
    deck: {
      caption: 'The ordinary card cycle',
      steps: [
        ['Draw pile', 'Cards waiting'],
        ['Hand', 'Cards you can play'],
        ['Discard', 'Cards used'],
      ],
      note: 'Draw → hand → discard → reshuffle. Exhaust removes a card for this combat; Powers establish ongoing effects.',
    },
    recruitment: {
      caption: 'Prepare, then watch',
      steps: [
        ['Recruit', 'Buy and upgrade'],
        ['Position', 'Arrange the board'],
        ['Auto-combat', 'The warband fights'],
      ],
      note: 'Combat copies take the battle’s wounds. Your recruitment board is the lasting preparation state.',
    },
    world: {
      caption: 'Emberwake’s nested places',
      steps: [
        ['Act', 'A story chapter'],
        ['Region', 'One explorable place'],
        ['Map', 'That place’s terrain'],
      ],
      note: 'A dungeon groups connected region floors. Character level is experience progress, not a floor number.',
    },
    passage: {
      caption: 'What carries forward?',
      steps: [
        ['Quay', 'Choose weapon & runes'],
        ['Passage', 'Temporary gold & boons'],
        ['Return', 'Bank ash'],
      ],
      note: 'The chronicle remembers this sequence, including unfinished play. Gold and boons reset for the next passage.',
    },
    scoring: {
      caption: 'One ante in Blindside',
      steps: [
        ['Small Blind', 'Reach its target'],
        ['Big Blind', 'Reach a higher target'],
        ['Boss Blind', 'Adapt to its rule'],
      ],
      note: 'Your available hands and discards are limited. Score is calculated from chips × multiplier after effects.',
    },
    draft: {
      caption: 'Build the route you will fight through',
      steps: [
        ['Frontier', 'Unexplored doorway'],
        ['Draft', 'Pick and rotate'],
        ['Chamber', 'Attach, enter, fight'],
      ],
      note: 'Room choices shape your route. Once inside combat, movement also advances enemy actions.',
    },
  };
  const scene = scenes[kind];
  return (
    <figure className="term-diagram">
      <figcaption>{scene.caption}</figcaption>
      <Flow steps={scene.steps} />
      <p>{scene.note}</p>
    </figure>
  );
}
