import { expect } from '@playwright/test';

export class SupersportPage {
  constructor(page) {
    this.page = page;

    this.matchCard = '[class*="top-hot-match-module_topHotCard__"]';
    this.teamName = '[class*="top-hot-match-module_teamName__"]';
    this.outcomeButton = '[class*="bet-button-module_betButton__"]';
    this.outcomeName = '[class*="bet-button-module_outcomeName__"]';
    this.outcomeOdds = '[class*="bet-button-module_outcomeOdds__"]';
    this.stakeInput = 'input.custom-input[inputmode="decimal"]';
    this.slipTecaj =
      '[class*="SlipPreparationFinancialHeader-module_value__"][class*="SlipPreparationFinancialHeader-module_sub-heading__"]';
    this.slipPayout =
      '[class*="SlipPreparationFinancialHeader-module_value__"][class*="SlipPreparationFinancialHeader-module_heading__"]';
  }

  async getMatchCount() {
    await this.page
      .locator(this.matchCard)
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});
    return this.page.locator(this.matchCard).count();
  }

  async pickRandomMatch() {
    const cards = this.page.locator(this.matchCard);
    const count = await cards.count();
    const index = Math.floor(Math.random() * count);
    const card = cards.nth(index);

    const teamNames = await card.locator(this.teamName).allInnerTexts();
    return { card, teamNames };
  }

  async pickRandomOutcome(card) {
    const buttons = card.locator(this.outcomeButton);
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const index = Math.floor(Math.random() * count);
    const button = buttons.nth(index);

    const name = (await button.locator(this.outcomeName).innerText()).trim();
    const oddsText = (await button.locator(this.outcomeOdds).innerText()).trim();
    const odds = parseFloat(oddsText.replace(',', '.'));

    return { button, name, oddsText, odds };
  }

  async enterStake(amount) {
    const input = this.page.locator(this.stakeInput);
    await input.click();
    await input.fill(amount.toString());
  }

  async getSlipTecaj() {
    const locator = this.page.locator(this.slipTecaj);
    await expect(locator).toBeVisible();
    const text = (await locator.innerText()).trim();
    return parseFloat(text.replace(',', '.'));
  }

  async getSlipPayout() {
    const locator = this.page.locator(this.slipPayout);
    await expect(locator).toBeVisible();
    const text = (await locator.innerText()).trim();
    return parseFloat(text.replace('€', '').replace(',', '.').trim());
  }

  async verifyBetInSlip({ teamNames, oddsText }) {
    const slip = this.page.getByRole('complementary');
    await expect(slip.getByText(teamNames[0], { exact: false })).toBeVisible();
    await expect(slip.getByText(oddsText, { exact: false }).first()).toBeVisible();
  }

  calculateExpectedPayout(uplata, tecaj) {
    const manipulativniTrosak = uplata * 0.05;
    const efektivniUlog = uplata - manipulativniTrosak;
    const bruto = efektivniUlog * tecaj;
    const poreznaOsnovica = bruto - efektivniUlog;

    const razredi = [
      { granica: 1500, stopa: 0.10 },
      { granica: 4000, stopa: 0.15 },
      { granica: 66361.40, stopa: 0.20 },
      { granica: Infinity, stopa: 0.30 },
    ];

    let porez = 0;
    let prethodnaGranica = 0;
    let preostalo = poreznaOsnovica;

    for (const { granica, stopa } of razredi) {
      if (preostalo <= 0) break;
      const rasponRazreda = granica - prethodnaGranica;
      const oporezivoURazredu = Math.min(preostalo, rasponRazreda);
      porez += oporezivoURazredu * stopa;
      preostalo -= oporezivoURazredu;
      prethodnaGranica = granica;
    }

    return parseFloat((bruto - porez).toFixed(2));
  }
}