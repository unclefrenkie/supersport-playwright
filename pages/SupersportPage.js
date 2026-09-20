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
    this.slipOdds =
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

  async getSlipOdds() {
    const locator = this.page.locator(this.slipOdds);
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

  calculateExpectedPayout(stake, odds) {
    const handlingFee = stake * 0.05;
    const effectiveStake = stake - handlingFee;
    const gross = effectiveStake * odds;
    const taxableAmount = gross - effectiveStake;

    const brackets = [
      { limit: 1500, rate: 0.10 },
      { limit: 4000, rate: 0.15 },
      { limit: 66361.40, rate: 0.20 },
      { limit: Infinity, rate: 0.30 },
    ];

    let tax = 0;
    let previousLimit = 0;
    let remaining = taxableAmount;

    for (const { limit, rate } of brackets) {
      if (remaining <= 0) break;
      const bracketRange = limit - previousLimit;
      const taxableInBracket = Math.min(remaining, bracketRange);
      // round each bracket to 2 decimals, matching how the slip displays it
      tax += Math.round(taxableInBracket * rate * 100) / 100;
      remaining -= taxableInBracket;
      previousLimit = limit;
    }

    return parseFloat((gross - tax).toFixed(2));
  }
}