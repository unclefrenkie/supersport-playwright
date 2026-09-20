import { test, expect } from '@playwright/test';
import { SupersportPage } from '../pages/SupersportPage';

test('Random outcome selection, stake entry and payout validation', async ({ page }) => {
  const supersport = new SupersportPage(page);

  await page.goto('/');

  const matchCount = await supersport.getMatchCount();
  expect(matchCount).toBeGreaterThan(0);

  const { card, teamNames } = await supersport.pickRandomMatch();
  console.log(`Selected match: ${teamNames.join(' - ')}`);

  const { button, name, oddsText, odds } = await supersport.pickRandomOutcome(card);
  console.log(`Selected outcome: ${name}, odds: ${odds}`);

  await button.click();

  await supersport.verifyBetInSlip({ teamNames, oddsText });

  const stake = 10;
  await supersport.enterStake(stake);

  const slipOdds = await supersport.getSlipOdds();
  console.log(`Slip odds: ${slipOdds}, button odds: ${odds}`);
  expect(slipOdds).toBeCloseTo(odds, 2);

  const payout = await supersport.getSlipPayout();
  const expectedPayout = supersport.calculateExpectedPayout(stake, slipOdds);
  console.log(`Payout (UI): ${payout}, Calculated: ${expectedPayout}`);
  expect(payout).toBeCloseTo(expectedPayout, 2);

  await page.getByRole('button', { name: 'PRIPREMI ZA UPLATU' }).click();
});