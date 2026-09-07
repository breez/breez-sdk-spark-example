import { mkdirSync, rmSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { TIMEOUTS } from '../constants/timeouts';
import { addressBalanceSats, mineBlocks, newAddress, sendToAddress, tipHeight } from '../utils/bitcoind';
import { txConfirmed, waitFor } from '../utils/esplora';
import { freshMnemonic, fundTestWallet } from '../utils/fund';
import { blocksToNextStep, nodesConfirmed, openWallet, storedPlan } from '../utils/exitWizard';
import { deriveFundingKey } from '../../src/features/unilateral-exit/funding';

/**
 * Walks a unilateral exit from a funded wallet to the money at its destination,
 * saving a screenshot of every screen along the way. The video of the whole run
 * lands in demo/run.
 */
const FRAMES = 'demo/frames';
const LEAF_SATS = 200_000;
const LEAF_COUNT = 3;
const PAUSE_MS = 1_500;

let frame = 0;
// The wallet home is sized to the viewport, and a full-page capture of it
// never returns; every other screen scrolls, so it is captured whole.
const snap = async (page: Page, name: string, fullPage = true): Promise<void> => {
  await page.waitForTimeout(PAUSE_MS);
  frame += 1;
  await page.screenshot({ path: `${FRAMES}/${String(frame).padStart(2, '0')}-${name}.png`, fullPage });
};

test('a unilateral exit, screen by screen', async ({ page }) => {
  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });

  const mnemonic = freshMnemonic();
  await fundTestWallet(mnemonic, LEAF_SATS, LEAF_COUNT);
  const destination = await newAddress('demo-exit-destination');

  await openWallet(page, mnemonic);
  await expect(page.getByText(/600[ ,]000/).first()).toBeVisible({ timeout: TIMEOUTS.BALANCE_SYNC });
  await snap(page, 'wallet', false);

  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByText('Settings').click();
  await expect(page.getByTestId('settings-unilateral-exit')).toBeVisible();
  await snap(page, 'settings');
  await page.getByTestId('settings-unilateral-exit').click();

  await expect(page.getByTestId('unilateral-exit-start')).toBeVisible();
  await snap(page, 'intro');
  await page.getByTestId('unilateral-exit-start').click();

  await page.getByPlaceholder('bc1q...').fill(destination);
  await snap(page, 'destination');
  await page.getByTestId('unilateral-exit-destination-continue').click();

  await expect(page.getByText('Fee rate')).toBeVisible({ timeout: TIMEOUTS.UI_ACTION });
  await page.getByText('Slow', { exact: true }).click();
  await snap(page, 'fee-rate');
  await page.getByTestId('unilateral-exit-get-quote').click();

  await expect(page.getByTestId('unilateral-exit-quote-continue')).toBeVisible({ timeout: TIMEOUTS.BALANCE_SYNC });
  await snap(page, 'quote');
  await page.getByTestId('unilateral-exit-quote-continue').click();

  await expect(page.getByTestId('unilateral-exit-funding-address')).toBeVisible({ timeout: TIMEOUTS.UI_ACTION });
  await snap(page, 'fund-waiting');
  await sendToAddress(deriveFundingKey(mnemonic, 'regtest', 0).address, 0.0002);
  await mineBlocks(1);
  const fundContinue = page.getByTestId('unilateral-exit-fund-continue');
  await expect(fundContinue).toBeEnabled({ timeout: TIMEOUTS.BALANCE_SYNC });
  await snap(page, 'fund-confirmed');
  await fundContinue.click();

  await expect(page.getByTestId('unilateral-exit-build')).toBeVisible();
  await snap(page, 'confirm');
  await page.getByTestId('unilateral-exit-build').click();

  const tracker = page.getByTestId('unilateral-exit-tracker');
  await expect(tracker).toBeVisible({ timeout: TIMEOUTS.PAYMENT });
  await snap(page, 'tracker-built');

  // The exit keeps going with its page closed: the wallet shows it as a banner.
  // Settings is still mounted underneath the exit page, so both are closed.
  for (const title of ['Unilateral exit', 'Settings']) {
    await page.getByRole('banner').filter({ hasText: title }).getByLabel('Close').click();
  }
  const banner = page.getByText('Unilateral exit in progress');
  await expect(banner).toBeVisible();
  await snap(page, 'wallet-banner', false);
  await banner.click();
  await expect(tracker).toBeVisible({ timeout: TIMEOUTS.UI_ACTION });

  await waitFor(
    async () => {
      await mineBlocks(1);
      return nodesConfirmed(page);
    },
    done => done,
    { timeoutMs: 120_000, everyMs: 4_000, what: 'the leaf transactions to confirm' },
  );
  await snap(page, 'tracker-leaves-on-chain');

  await mineBlocks(await blocksToNextStep(page, await tipHeight()));
  const refunds = (await storedPlan(page))?.exit.transactions.filter(t => t.kind === 'refund') ?? [];
  await waitFor(
    async () => {
      await mineBlocks(1);
      return (await Promise.all(refunds.map(t => txConfirmed(t.txid)))).every(Boolean);
    },
    landed => landed,
    { timeoutMs: 120_000, everyMs: 4_000, what: 'the refunds to confirm' },
  );
  // The chain has them; the tracker learns it on its next pass.
  await expect(page.getByTestId('unilateral-exit-stages')).toContainText(/safe on-chain[^0-9]*600 000/, {
    timeout: 30_000,
  });
  await snap(page, 'tracker-refunds-confirmed');

  const complete = page.getByTestId('unilateral-exit-complete');
  await waitFor(
    async () => {
      await mineBlocks(1);
      return complete.isVisible().catch(() => false);
    },
    done => done,
    { timeoutMs: 240_000, everyMs: 6_000, what: 'the sweep to confirm' },
  );
  await snap(page, 'complete');

  console.log(`destination holds ${await addressBalanceSats(destination)} sats`);
});
