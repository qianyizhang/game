import { SAVE_KEY } from '../../src/games/night-passage/application/live-chronicle';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import {
  dispatch,
  exportChronicle,
  createChronicle,
  restoreChronicle,
  type Chronicle,
} from '../../src/games/night-passage/application/chronicle';
import { boon, RUNES, WEAPONS } from '../../src/games/night-passage/domain/content';
import type { Boon } from '../../src/games/night-passage/domain/types';
import { passageCommand } from '../simulation/night-passage-policy';
import { browserBudget } from './budget';

const review = 'test-results/night-passage-symbols/browser';
async function decorative(container: Locator, id: string) {
  const art = container.locator(`svg[data-np-art="${id}"]`);
  await expect(art).toHaveCount(1);
  await expect(art).toHaveAttribute('aria-hidden', 'true');
  await expect(art).toHaveAttribute('focusable', 'false');
  return art;
}
async function patron(container: Locator, blessing: Boon) {
  const art = await decorative(container, `patron:${blessing.god}`);
  const partner = blessing.requires?.find((god) => god !== blessing.god);
  if (partner) await expect(art).toHaveAttribute('data-np-partner', partner);
  else await expect(art).not.toHaveAttribute('data-np-partner');
}
async function restore(page: Page, session: Chronicle, name: string) {
  await page.getByLabel('Import Night Passage chronicle').setInputFiles({
    name: `${name}.json`,
    mimeType: 'application/json',
    buffer: Buffer.from(exportChronicle(session)),
  });
  await expect(page.getByRole('alert')).toHaveText('Chronicle restored.');
}
async function saved(page: Page) {
  return page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
}
function checkpoints() {
  let session = dispatch(createChronicle('passage-verification'), {
    type: 'start',
    weapon: 'bow',
    runes: ['vigor', 'fleet'],
  }).chronicle;
  let reward: Chronicle | undefined, marketRoute: Chronicle | undefined;
  for (let step = 0; step < 20000; step++) {
    if (session.state.phase === 'reward' && !reward) reward = session;
    if (
      !marketRoute &&
      session.state.phase === 'route' &&
      session.state.gold >= 60 &&
      session.state.routes.some((route) => route.reward === 'shop')
    )
      marketRoute = session;
    if (
      reward &&
      marketRoute &&
      session.state.phase === 'reward' &&
      session.state.offers.some((id) => boon(id).requires)
    )
      return { reward, marketRoute, duo: session };
    if (session.state.phase === 'lost' || session.state.phase === 'won') break;
    const result = dispatch(session, passageCommand(session.state));
    if (result.error) throw new Error(result.error);
    session = result.chronicle;
  }
  throw new Error('Legal pilot did not reach blessing, affordable market and duo checkpoints');
}

for (const viewport of [
  { width: 960, height: 900 },
  { width: 390, height: 844 },
]) {
  test.describe(`${viewport.width}px reward and loadout artwork`, () => {
    test.use({ viewport });
    test.beforeEach(async ({ page }) => {
      await mkdir(review, { recursive: true });
      // Shared decision DOM is exercised in the default 2.5D view and the 2D view.
      await page.addInitScript(
        (width) =>
          localStorage.setItem(
            'card-workshop.night-passage.view.v1',
            width === 960 ? 'scene' : 'canvas',
          ),
        viewport.width,
      );
    });

    test('decorative loadout art preserves names, locked runes, keyboard selection and saved choices', async ({
      page,
    }) => {
      await page.goto('/?game=night-passage');
      const weapons = page.getByRole('group', { name: 'Choose weapon' });
      for (const weapon of WEAPONS) {
        const button = weapons.getByRole('button', {
          name: `${weapon.name} ${weapon.id}`,
          exact: true,
        });
        await decorative(button, `weapon:${weapon.id}`);
        await expect(button).toHaveAttribute('aria-pressed', String(weapon.id === 'sword'));
      }
      const runes = page.getByRole('group', { name: 'Choose up to two runes' });
      for (const rune of RUNES) {
        const name = rune.name + (rune.unlock > 0 ? ` · region ${rune.unlock}` : '');
        const button = runes.getByRole('button', { name, exact: true });
        await decorative(button, `rune:${rune.id}`);
        if (rune.unlock > 0) await expect(button).toBeDisabled();
        else await expect(button).toBeEnabled();
      }
      const bow = weapons.getByRole('button', { name: 'Far Lantern bow', exact: true });
      await bow.focus();
      await page.keyboard.press('Enter');
      await expect(bow).toHaveAttribute('aria-pressed', 'true');
      await expect(
        weapons.getByRole('button', { name: 'Dawnless Edge sword', exact: true }),
      ).toHaveAttribute('aria-pressed', 'false');
      await runes.getByRole('button', { name: 'Root', exact: true }).focus();
      await page.keyboard.press('Space');
      await runes.getByRole('button', { name: 'Well', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(runes.getByRole('button', { name: 'Root', exact: true })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      for (const name of ['Feather', 'Well'])
        await expect(runes.getByRole('button', { name, exact: true })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      await page.screenshot({ path: `${review}/hub-${viewport.width}.png`, fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.getByRole('button', { name: 'Begin passage', exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      const text = (await saved(page))!;
      expect(restoreChronicle(text).state.player).toMatchObject({
        weapon: 'bow',
        runes: ['fleet', 'focus'],
      });
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
      expect(await saved(page)).toBe(text);
      const sidebar = page.getByRole('complementary', { name: 'Your build' });
      for (const id of ['fleet', 'focus']) await decorative(sidebar, `rune:${id}`);
    });

    test('legal blessing, route and market artwork retains choice text and keyboard replay through reload', async ({
      page,
    }) => {
      test.setTimeout(browserBudget(60000));
      const { reward, marketRoute, duo } = checkpoints();
      const index = marketRoute.state.routes.findIndex((route) => route.reward === 'shop');
      const market = dispatch(marketRoute, { type: 'travel', index });
      expect(market.error).toBeNull();
      expect(market.chronicle.state.phase).toBe('shop');
      expect(market.chronicle.state.gold).toBeGreaterThanOrEqual(60);
      const purchase = dispatch(market.chronicle, { type: 'buy', item: 'heart' });
      expect(purchase.error).toBeNull();
      await page.goto('/?game=night-passage');
      await restore(page, reward, 'legal-blessing');
      await expect(page.getByRole('heading', { name: 'Choose a blessing' })).toBeVisible();
      const choices = page.locator('.np-choices button');
      await expect(choices).toHaveCount(reward.state.offers.length);
      for (const [index, id] of reward.state.offers.entries()) {
        const blessing = boon(id),
          button = choices.nth(index);
        await patron(button, blessing);
        await expect(button).toHaveAccessibleName(
          `${blessing.slot} · New blessing ${blessing.name} ${blessing.description}`,
        );
      }
      await page.screenshot({ path: `${review}/blessings-${viewport.width}.png`, fullPage: true });
      const command = passageCommand(reward.state);
      if (command.type !== 'choose') throw new Error('Expected the legal blessing choice');
      const expected = dispatch(reward, command);
      expect(expected.error).toBeNull();
      const selected = boon(command.id);
      await choices.nth(reward.state.offers.indexOf(command.id)).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'Choose your next chamber' })).toBeVisible();
      expect(await saved(page)).toBe(exportChronicle(expected.chronicle));
      await page.reload();
      expect(await saved(page)).toBe(exportChronicle(expected.chronicle));
      const owned = page
        .locator('.np-build article')
        .filter({ has: page.locator('strong', { hasText: selected.name }) });
      await expect(owned.locator('strong')).toHaveText(selected.name);
      await patron(owned, selected);
      await restore(page, marketRoute, 'legal-market-route');
      await expect(page.getByRole('heading', { name: 'Choose your next chamber' })).toBeVisible();
      for (const [index, route] of marketRoute.state.routes.entries()) {
        const button = choices.nth(index);
        await decorative(button, `reward:${route.reward}`);
        await expect(button).toHaveAccessibleName(`${route.label} ${route.detail}`);
      }
      await page.screenshot({ path: `${review}/routes-${viewport.width}.png`, fullPage: true });
      await choices.nth(index).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'Something for the road?' })).toBeVisible();
      expect(await saved(page)).toBe(exportChronicle(market.chronicle));
      for (const item of [
        { name: 'Restore 40 health', icon: 'fountain', cost: 35 },
        { name: '+20 maximum health', icon: 'heart', cost: 60 },
        { name: 'Divine audience', icon: 'boon', cost: 80 },
      ]) {
        const button = page.getByRole('button', {
          name: `${item.name} ${item.cost} gold`,
          exact: true,
        });
        await decorative(button, `reward:${item.icon}`);
      }
      await page.screenshot({ path: `${review}/market-${viewport.width}.png`, fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const heart = page.getByRole('button', { name: '+20 maximum health 60 gold', exact: true });
      await expect(heart).toBeEnabled();
      await heart.focus();
      await page.keyboard.press('Space');
      await expect(heart).toBeDisabled();
      const text = exportChronicle(purchase.chronicle);
      expect(await saved(page)).toBe(text);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Something for the road?' })).toBeVisible();
      await expect(heart).toBeDisabled();
      await decorative(heart, 'reward:heart');
      expect(await saved(page)).toBe(text);
      await restore(page, duo, 'legal-duo-blessing');
      await expect(page.getByRole('heading', { name: 'Choose a blessing' })).toBeVisible();
      const duoId = duo.state.offers.find((id) => boon(id).requires)!;
      const blessing = boon(duoId),
        duoChoice = choices.nth(duo.state.offers.indexOf(duoId));
      await patron(duoChoice, blessing);
      await expect(duoChoice).toHaveAccessibleName(
        `duo · New blessing ${blessing.name} ${blessing.description}`,
      );
      await page.screenshot({ path: `${review}/duo-choice-${viewport.width}.png`, fullPage: true });
      const chosen = dispatch(duo, { type: 'choose', id: duoId });
      expect(chosen.error).toBeNull();
      await duoChoice.focus();
      await page.keyboard.press('Enter');
      const selectedDuo = page
        .locator('.np-build article')
        .filter({ has: page.locator('strong', { hasText: blessing.name }) });
      await patron(selectedDuo, blessing);
      await expect(selectedDuo.locator('strong')).toHaveText(blessing.name);
      const duoText = exportChronicle(chosen.chronicle);
      expect(await saved(page)).toBe(duoText);
      await page.reload();
      await patron(selectedDuo, blessing);
      expect(await saved(page)).toBe(duoText);
    });
  });
}
