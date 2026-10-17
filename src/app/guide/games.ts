import type { GameId } from '../GamePicker';

export const GAME_GUIDES: {
  id: GameId;
  name: string;
  reference: string;
  genre: string;
  hook: string;
  description: string;
  steps: [string, string, string];
  goal: string;
  controls: string;
  tip: string;
}[] = [
  {
    id: 'balatro',
    name: 'Blindside',
    reference: 'A study of Balatro',
    genre: 'Poker · Turn-based',
    hook: 'Make a small hand score big.',
    description:
      'Build poker hands and bend their scoring with Jokers. Each round sets a score to beat; your limited hands and discards make every card count.',
    steps: [
      'Select up to five cards. Play a poker hand or discard to draw again.',
      'Earn chips and multipliers, with Jokers adding effects in order.',
      'Spend your winnings in the shop, then face a tougher blind.',
    ],
    goal: 'Beat the final boss blind in ante 8.',
    controls: 'Click cards to select them, then choose Play or Discard.',
    tip: 'Start with pairs and flushes. Read the scoring breakdown before chasing a more elaborate hand.',
  },
  {
    id: 'spire',
    name: 'Slay the Spire',
    reference: 'A study of Slay the Spire 1',
    genre: 'Deck building · Turn-based',
    hook: 'Build the deck that gets you to the top.',
    description:
      'Choose Ironclad or Silent and climb a branching route of battles, events and rests. Cards cost energy; enemies show what they intend to do next.',
    steps: [
      'Read enemy intents and spend energy on attacks, block or setup.',
      'End your turn to let enemies act, then draw a fresh hand.',
      'Choose cards and relics, improve your deck and plot your route.',
    ],
    goal: 'Defeat the boss at the end of each of three acts.',
    controls: 'Click a card and, when needed, its target. End Turn when ready.',
    tip: 'Compare incoming damage with your block. Taking every card reward can make your best cards harder to draw.',
  },
  {
    id: 'battlegrounds',
    name: 'Last Hearth',
    reference: 'A study of Hearthstone Battlegrounds',
    genre: 'Recruitment · Auto-battler',
    hook: 'Build a warband. Let it fight.',
    description:
      'Recruit creatures in a tavern, combine matching copies and arrange your board. You make the preparation decisions; combat plays out automatically.',
    steps: [
      'Spend gold on recruits, refresh the shop or upgrade the tavern.',
      'Combine three matching recruits and arrange your warband.',
      'Choose Ready, watch the battle and rebuild for the next rival.',
    ],
    goal: 'Outlast the rival warbands.',
    controls: 'Use shop and board controls, then Ready to begin auto-combat.',
    tip: 'Look for creatures whose effects support one another. Position matters even though you do not control attacks.',
  },
  {
    id: 'diablo2',
    name: 'Emberwake',
    reference: 'Inspired by Diablo II',
    genre: 'Action RPG · Real-time',
    hook: 'Follow the embers. Bring better gear.',
    description:
      'Take a Barbarian, Sorceress or Necromancer through connected wilderness and dungeons. Fight in real time, gather loot and develop a persistent hero.',
    steps: [
      'Choose a hero, leave the refuge and explore connected regions.',
      'Fight enemies, collect equipment and invest your level-up points.',
      'Find ward stones to open the way to each act’s boss.',
    ],
    goal: 'Clear four acts and defeat Lucent, Unlit King.',
    controls:
      'WASD / arrows to move; click an enemy or Space to attack; Q / E / R for skills; F to interact.',
    tip: 'Keep life and mana potions ready on 1 and 2. Open Inventory to equip the loot you find.',
  },
  {
    id: 'cartographer',
    name: 'Dungeon Cartographer',
    reference: 'An original room-drafting roguelike',
    genre: 'Room drafting · Turn-based tactics',
    hook: 'Draw the dungeon you have to survive.',
    description:
      'Explore the Sunken Archive as the Lantern Keeper. You choose and rotate the next room, then solve its combat one action at a time.',
    steps: [
      'Reach a doorway, choose Explore and draft a chamber.',
      'Rotate it to connect exits and shape your route.',
      'Read marked enemy attacks, fight and choose relics along the way.',
    ],
    goal: 'Defeat the Unwritten King in the ninth room.',
    controls:
      'WASD / arrows to move; E to explore; select an enemy and choose Strike, Shove or Flare.',
    tip: 'Movement also advances combat. Shove an enemy to interrupt its attack or push it into a hazard.',
  },
  {
    id: 'night-passage',
    name: 'Night Passage',
    reference: 'An original action roguelite',
    genre: 'Arena combat · Real-time',
    hook: 'Carry a little light through the dark.',
    description:
      'Leave Lantern Quay with a weapon and cross four regions of hostile chambers. Dodge announced attacks and combine blessings from five patrons.',
    steps: [
      'Choose a weapon and runes at the quay, then begin a passage.',
      'Clear chambers and choose routes for blessings, healing or upgrades.',
      'Face each region’s guardian and bank ash for future passages.',
    ],
    goal: 'Defeat the Unlit Sovereign and escape.',
    controls:
      'Click the arena to focus. WASD to move; mouse to aim; left click / J to attack; Space to dodge; Q to cast.',
    tip: 'Desktop keyboard and mouse required for combat. Watch orange warnings and use pillars for cover.',
  },
];
