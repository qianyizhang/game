import { hashSeed } from '../../../shared/random';
import { CARD_BY_ID } from '../content/cards';
import { POTIONS } from '../content/world';
import { chooseCard, endTurn, playCard, startCombat } from './combat';
import { availableNodes, encounterFor, generateMap } from './map';
import {
  bossRelicOptions,
  cardRewards,
  collectCombatReward,
  grantRelic,
  healAfterCombat,
  openShop,
  randomRelic,
  removalCost,
  rewardPotion,
} from './rewards';
import {
  addPermanentCard,
  aliveEnemies,
  applyStatus,
  gainBlock,
  heal,
  hit,
  log,
  maxHp,
  pick,
  roll,
  upgradeRandom,
} from './state';
import type { Potion, SpireCommand, SpireState } from './types';
export { availableNodes } from './map';
export const SPIRE_VERSION = 2;
export function createSpire(seedInput: string): SpireState {
  const seed = seedInput.trim().slice(0, 64) || 'IRONCLAD-01';
  const run: SpireState = {
    version: SPIRE_VERSION,
    seed,
    rng: hashSeed(seed),
    nextId: 1,
    character: 'ironclad',
    phase: 'neow',
    act: 1,
    row: -1,
    lane: null,
    map: [],
    currentNode: null,
    hp: 80,
    maxHp: 80,
    gold: 99,
    deck: [],
    relics: ['burningBlood'],
    relicCounters: {},
    potions: [],
    combat: null,
    reward: [],
    rewardUpgrades: [],
    rewardRelic: null,
    rewardPotion: null,
    bossRelics: [],
    fightsThisAct: 0,
    lastEncounter: '',
    lastElite: '',
    rareOffset: -5,
    potionChance: 40,
    shop: [],
    removalUsed: false,
    removals: 0,
    event: '',
    eventDone: false,
    log: [],
    notice: 'The Ironclad. A new ascent begins with Neow.',
  };
  for (let i = 0; i < 5; i++) addPermanentCard(run, 'strike');
  for (let i = 0; i < 4; i++) addPermanentCard(run, 'defend');
  addPermanentCard(run, 'bash');
  run.map = generateMap(run);
  return run;
}
function nextAct(run: SpireState) {
  run.act++;
  run.row = -1;
  run.lane = null;
  run.currentNode = null;
  run.combat = null;
  run.bossRelics = [];
  run.fightsThisAct = 0;
  run.lastEncounter = '';
  run.lastElite = '';
  run.phase = 'map';
  heal(run, run.maxHp);
  run.map = generateMap(run);
  log(run, `Act ${run.act}: recover all HP. Choose your next route.`);
}
function checkCombat(run: SpireState) {
  if (run.phase !== 'combat' || !run.combat) return;
  run.hp = run.combat.player.hp;
  if (run.hp <= 0) {
    run.phase = 'lost';
    log(
      run,
      `Defeat on floor ${(run.act - 1) * 17 + run.row + 1}. Every ascent teaches something.`,
    );
    return;
  }
  if (aliveEnemies(run).length) return;
  const node = run.map.find((n) => n.id === run.currentNode);
  const kind = node?.kind === 'boss' ? 'boss' : node?.kind === 'elite' ? 'elite' : 'fight';
  healAfterCombat(run);
  if (kind === 'boss' && run.act === 3) {
    run.phase = 'won';
    log(run, 'Victory! The Ironclad has completed the three-act ascent.');
    return;
  }
  const gold =
    (kind === 'boss' ? 95 : kind === 'elite' ? 25 : 10) +
    Math.floor(roll(run) * (kind === 'boss' ? 11 : 11));
  run.gold += Math.floor(gold * (run.relics.includes('goldenIdol') ? 1.25 : 1));
  run.reward = cardRewards(run, kind);
  run.rewardRelic = kind === 'elite' ? randomRelic(run) : null;
  run.rewardPotion = rewardPotion(run, kind === 'boss');
  run.phase = 'reward';
  log(run, `Victory. +${gold} gold. Choose a card or skip it; Burning Blood restores HP.`);
}
function chooseEvent(run: SpireState): string {
  const choices =
    run.act === 1
      ? ['bigFish', 'cleric', 'shiningLight', 'goldenIdol', 'goldenShrine']
      : run.act === 2
        ? ['ancientWriting', 'womanInBlue', 'goldenShrine']
        : [
            'goldenShrine',
            'womanInBlue',
            ...(run.hp < run.maxHp / 2 || run.relics.includes('goldenIdol') ? ['moaiHead'] : []),
          ];
  return pick(
    run,
    choices.filter((id) => id !== 'goldenIdol' || !run.relics.includes('goldenIdol')),
  );
}
function eventAction(run: SpireState, choice: string, cardId?: string): string | undefined {
  if (choice === 'leave') {
    run.phase = 'map';
    return;
  }
  const remove = () => {
    const card = run.deck.find((c) => c.id === cardId);
    if (!card) return false;
    run.deck = run.deck.filter((c) => c.id !== cardId);
    return true;
  };
  switch (run.event) {
    case 'bigFish':
      if (choice === 'banana') heal(run, Math.floor(run.maxHp / 3));
      else if (choice === 'donut') maxHp(run, 5);
      else if (choice === 'box') {
        const relic = randomRelic(run);
        if (relic) grantRelic(run, relic);
        addPermanentCard(run, 'regret');
      } else return 'Choose a listed event option.';
      break;
    case 'cleric':
      if (choice === 'heal') {
        if (run.gold < 35) return 'Healing costs 35 gold.';
        run.gold -= 35;
        heal(run, Math.floor(run.maxHp * 0.25));
      } else if (choice === 'purify') {
        if (run.gold < 50) return 'Purify costs 50 gold.';
        if (!remove()) return 'Choose a card to remove.';
        run.gold -= 50;
      } else return 'Choose a listed event option.';
      break;
    case 'shiningLight':
      if (choice !== 'enter') return 'Choose Enter or Leave.';
      if (run.hp <= Math.floor(run.maxHp * 0.2)) return 'The light would kill you.';
      run.hp -= Math.floor(run.maxHp * 0.2);
      upgradeRandom(run, 2);
      break;
    case 'goldenIdol':
      if (choice === 'injury') addPermanentCard(run, 'injury');
      else if (choice === 'damage') {
        const amount = Math.floor(run.maxHp * 0.25);
        if (run.hp <= amount) return 'The trap would kill you.';
        run.hp -= amount;
      } else if (choice === 'maxHp') {
        run.maxHp -= Math.floor(run.maxHp * 0.08);
        run.hp = Math.min(run.hp, run.maxHp);
      } else return 'Choose a listed trap outcome.';
      grantRelic(run, 'goldenIdol');
      break;
    case 'goldenShrine':
      if (choice === 'pray') run.gold += 100;
      else if (choice === 'desecrate') {
        run.gold += 275;
        addPermanentCard(run, 'regret');
      } else return 'Choose a listed event option.';
      break;
    case 'ancientWriting':
      if (choice === 'simplicity') {
        if (!remove()) return 'Choose a card to remove.';
      } else if (choice === 'elegance') {
        for (const card of run.deck)
          if (['strike', 'defend'].includes(card.definitionId)) card.upgraded = true;
      } else return 'Choose Simplicity or Elegance.';
      break;
    case 'womanInBlue': {
      if (run.relics.includes('sozu')) return 'Sozu prevents obtaining potions.';
      const price = choice === 'one' ? 20 : choice === 'three' ? 50 : 0;
      if (!price) return 'Choose a listed offer.';
      if (run.gold < price) return 'Not enough gold.';
      run.gold -= price;
      for (let i = 0; i < (choice === 'one' ? 1 : 3) && run.potions.length < 3; i++)
        run.potions.push(pick(run, Object.keys(POTIONS) as Potion[]));
      break;
    }
    case 'moaiHead':
      if (choice === 'jump') {
        run.maxHp -= Math.floor(run.maxHp * 0.125);
        run.hp = run.maxHp;
      } else if (choice === 'idol' && run.relics.includes('goldenIdol')) {
        run.relics = run.relics.filter((id) => id !== 'goldenIdol');
        run.gold += 333;
      } else return 'Choose an available option.';
      break;
    default:
      return 'Unknown event.';
  }
  run.phase = 'map';
  log(run, `Event resolved: ${choice}.`);
}
export function transitionSpire(
  previous: SpireState,
  command: SpireCommand,
): { state: SpireState; error?: string } {
  const run = structuredClone(previous);
  const reject = (error: string) => ({ state: previous, error });
  if (run.phase === 'won' || run.phase === 'lost')
    return reject('This run has ended. Start a new ascent.');
  if (run.phase === 'combat' && run.combat?.choice && command.type !== 'chooseCard')
    return reject('Resolve the pending card choice first.');
  switch (command.type) {
    case 'neow':
      if (run.phase !== 'neow') return reject('Neow has already granted a blessing.');
      if (command.choice === 'maxHp') maxHp(run, 8);
      else if (command.choice === 'lament') grantRelic(run, 'neowsLament');
      else if (command.choice === 'gold') run.gold += 100;
      else if (command.choice === 'bossSwap') {
        const options = bossRelicOptions(run, true);
        run.relics = [];
        grantRelic(run, pick(run, options));
      } else return reject('Choose a listed blessing.');
      run.phase = 'map';
      log(run, 'Neow’s blessing is yours. Choose a starting path.');
      break;
    case 'chooseNode': {
      if (run.phase !== 'map') return reject('Finish the current room first.');
      const node = availableNodes(run).find((n) => n.id === command.id);
      if (!node) return reject('That path is not connected to your current room.');
      node.visited = true;
      run.row = node.row;
      run.lane = node.lane;
      run.currentNode = node.id;
      if (['fight', 'elite', 'boss'].includes(node.kind)) {
        node.encounter = encounterFor(run, node.kind);
        startCombat(run, node.encounter);
      } else {
        run.phase = node.kind as 'shop' | 'rest' | 'event' | 'treasure';
        run.combat = null;
        log(run, `Enter ${node.kind}.`);
        if (node.kind === 'shop') openShop(run);
        if (node.kind === 'event') {
          run.event = chooseEvent(run);
          run.eventDone = false;
        }
        if (node.kind === 'treasure') run.rewardRelic = randomRelic(run);
      }
      break;
    }
    case 'playCard':
    case 'chooseCard': {
      if (run.phase !== 'combat') return reject('No combat is active.');
      const error =
        command.type === 'playCard'
          ? playCard(run, command.id, command.target)
          : chooseCard(run, command.id);
      if (error) return reject(error);
      checkCombat(run);
      break;
    }
    case 'endTurn': {
      if (run.phase !== 'combat') return reject('No combat is active.');
      const error = endTurn(run);
      if (error) return reject(error);
      checkCombat(run);
      break;
    }
    case 'takeReward': {
      if (run.phase !== 'reward') return reject('No reward is available.');
      if (command.card !== null && !run.reward.includes(command.card))
        return reject('Choose one of the offered cards.');
      collectCombatReward(run, command.card);
      if (run.map.find((n) => n.id === run.currentNode)?.kind === 'boss') {
        run.bossRelics = bossRelicOptions(run);
        run.phase = 'bossRelic';
        log(run, 'Choose a boss relic. Read its tradeoff before committing.');
      } else {
        run.phase = 'map';
        run.combat = null;
      }
      break;
    }
    case 'bossRelic':
      if (run.phase !== 'bossRelic') return reject('No boss chest is open.');
      if (command.id !== null && !run.bossRelics.includes(command.id))
        return reject('Choose an offered relic or skip.');
      if (command.id) grantRelic(run, command.id);
      nextAct(run);
      break;
    case 'rest':
      if (run.phase !== 'rest') return reject('You are not at a campfire.');
      if (command.choice === 'heal') {
        if (run.relics.includes('coffeeDripper')) return reject('Coffee Dripper prevents resting.');
        heal(run, Math.floor(run.maxHp * 0.3) + (run.relics.includes('regalPillow') ? 15 : 0));
      } else if (command.choice === 'upgrade') {
        if (run.relics.includes('fusionHammer')) return reject('Fusion Hammer prevents smithing.');
        const card = run.deck.find(
          (c) => c.id === command.card && !c.upgraded && !CARD_BY_ID[c.definitionId].token,
        );
        if (!card) return reject('Choose an unupgraded card.');
        card.upgraded = true;
      } else if (command.choice !== 'leave') return reject('Choose Rest, Smith or Leave.');
      run.phase = 'map';
      log(run, `Campfire: ${command.choice}.`);
      break;
    case 'buy': {
      if (run.phase !== 'shop') return reject('No shop is open.');
      const offer = run.shop.find((o) => o.id === command.id);
      if (!offer) return reject('Offer unavailable.');
      if (run.gold < offer.price) return reject('Not enough gold.');
      if (offer.kind === 'potion' && (run.potions.length >= 3 || run.relics.includes('sozu')))
        return reject('Cannot obtain this potion.');
      run.gold -= offer.price;
      if (offer.kind === 'card') addPermanentCard(run, offer.definitionId);
      if (offer.kind === 'relic') grantRelic(run, offer.definitionId);
      if (offer.kind === 'potion') run.potions.push(offer.definitionId as Potion);
      run.shop = run.shop.filter((o) => o.id !== offer.id);
      log(run, `Purchased ${offer.definitionId}.`);
      break;
    }
    case 'removeCard': {
      if (run.phase !== 'shop' || run.removalUsed) return reject('Removal is unavailable here.');
      const price = removalCost(run);
      if (run.gold < price) return reject(`Removal costs ${price} gold.`);
      if (!run.deck.some((c) => c.id === command.id))
        return reject('Choose a card from your deck.');
      run.deck = run.deck.filter((c) => c.id !== command.id);
      run.gold -= price;
      run.removals++;
      run.removalUsed = true;
      log(run, `Card removed for ${price} gold.`);
      break;
    }
    case 'leaveShop':
      if (run.phase !== 'shop') return reject('No shop is open.');
      run.phase = 'map';
      run.shop = [];
      break;
    case 'event': {
      if (run.phase !== 'event') return reject('No event is active.');
      const error = eventAction(run, command.choice, command.card);
      if (error) return reject(error);
      break;
    }
    case 'takeTreasure':
      if (run.phase !== 'treasure') return reject('No chest is here.');
      if (!command.skip) {
        if (run.rewardRelic) grantRelic(run, run.rewardRelic);
        if (run.relics.includes('cursedKey'))
          addPermanentCard(run, pick(run, ['injury', 'regret']));
        if (roll(run) < 0.5) run.gold += Math.floor(23 + roll(run) * 6);
      }
      run.rewardRelic = null;
      run.phase = 'map';
      log(
        run,
        command.skip ? 'Leave the chest unopened.' : 'Open the chest and collect its relic.',
      );
      break;
    case 'potion': {
      if (run.phase !== 'combat') return reject('Use potions during combat.');
      const potion = run.potions[command.index];
      if (!potion) return reject('Potion unavailable.');
      const target = aliveEnemies(run).find((e) => e.id === command.target);
      if (POTIONS[potion].target && !target) return reject('Choose a living enemy target.');
      if (potion === 'fire') hit(run, target!, 20, 'Fire Potion');
      if (potion === 'weak') applyStatus(target!, 'weak', 3);
      if (potion === 'explosive')
        for (const enemy of aliveEnemies(run)) hit(run, enemy, 10, 'Explosive Potion');
      if (potion === 'block') gainBlock(run, 12);
      if (potion === 'strength') applyStatus(run.combat!.player, 'strength', 2);
      if (potion === 'dexterity') applyStatus(run.combat!.player, 'dexterity', 2);
      if (potion === 'energy') run.combat!.energy += 2;
      if (potion === 'blood') heal(run, Math.floor(run.maxHp * 0.2));
      run.potions.splice(command.index, 1);
      checkCombat(run);
      break;
    }
    case 'discardPotion':
      if (!run.potions[command.index]) return reject('Potion unavailable.');
      run.potions.splice(command.index, 1);
      break;
    default:
      return reject('Unknown command.');
  }
  return { state: run };
}
