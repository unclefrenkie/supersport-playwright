import { test, expect } from '@playwright/test';
import { SupersportPage } from '../pages/SupersportPage';

test('Nasumičan odabir ishoda, unos uloga i provjera dobitka', async ({ page }) => {
  const supersport = new SupersportPage(page);

  // Otvaranje stranice
  await supersport.goto();

  // Provjera da uopće ima utakmica
  const matchCount = await supersport.getMatchCount();
  expect(matchCount).toBeGreaterThan(0);

  // Nasumičan odabir utakmice i ishoda
  const { card, teamNames } = await supersport.pickRandomMatch();
  console.log(`Odabrana utakmica: ${teamNames.join(' - ')}`);

  const { button, name, oddsText, odds } = await supersport.pickRandomOutcome(card);
  console.log(`Odabran ishod: ${name}, koeficijent: ${odds}`);

  // Dodavanje u listić
  await supersport.addOutcomeToSlip(button);

  // Provjera (točka 4): opklada se pojavila u listiću s ispravnim timom i koeficijentom
  await supersport.verifyBetInSlip({ teamNames, oddsText });

  // Unos uloga
  const stake = 10;
  await supersport.enterStake(stake);

  // Provjera tečaja u listiću vs koeficijent s gumba
  const tecaj = await supersport.getSlipTecaj();
  console.log(`Tečaj u listiću: ${tecaj}, koeficijent s gumba: ${odds}`);
  expect(tecaj).toBeCloseTo(odds, 2);

  // Egzaktna provjera isplate prema matematičkoj formuli
  const payout = await supersport.getSlipPayout();
  const expectedPayout = supersport.calculateExpectedPayout(stake, tecaj);
  console.log(`Ev. isplata (UI): ${payout}, Izračunato: ${expectedPayout}`);

  expect(payout).toBeCloseTo(expectedPayout, 2); // egzaktno, do 2 decimale

  // Priprema za uplatu (uplata listića - template za poslovnicu)
  await supersport.prepareForPayment();
});