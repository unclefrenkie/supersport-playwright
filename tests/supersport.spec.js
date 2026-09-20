import { test, expect } from '@playwright/test';
import { SupersportPage } from '../pages/SupersportPage';

test('Nasumičan odabir ishoda, unos uloga i provjera dobitka', async ({ page }) => {
  const supersport = new SupersportPage(page);

  await page.goto('/');

  const matchCount = await supersport.getMatchCount();
  expect(matchCount).toBeGreaterThan(0);

  const { card, teamNames } = await supersport.pickRandomMatch();
  console.log(`Odabrana utakmica: ${teamNames.join(' - ')}`);

  const { button, name, oddsText, odds } = await supersport.pickRandomOutcome(card);
  console.log(`Odabran ishod: ${name}, koeficijent: ${odds}`);

  await button.click();

  await supersport.verifyBetInSlip({ teamNames, oddsText });

  const stake = 10;
  await supersport.enterStake(stake);

  const tecaj = await supersport.getSlipTecaj();
  console.log(`Tečaj u listiću: ${tecaj}, koeficijent s gumba: ${odds}`);
  expect(tecaj).toBeCloseTo(odds, 2);

  const payout = await supersport.getSlipPayout();
  const expectedPayout = supersport.calculateExpectedPayout(stake, tecaj);
  console.log(`Ev. isplata (UI): ${payout}, Izračunato: ${expectedPayout}`);
  expect(payout).toBeCloseTo(expectedPayout, 2);

  await page.getByRole('button', { name: 'PRIPREMI ZA UPLATU' }).click();
});