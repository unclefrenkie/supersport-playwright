import { expect } from '@playwright/test';

export class SupersportPage {
  constructor(page) {
    this.page = page;

    // --- Selektori (grupirani na jednom mjestu radi lakšeg održavanja) ---
    // Napomena: ovo su CSS-modules hashirane klase; mogu se promijeniti pri
    // redeployu stranice, pa ih je zato dobro držati izolirane ovdje.
    this.matchCard = '.top-hot-match-module_topHotCard__NYsFg';
    this.teamName = '.top-hot-match-module_teamName__T6wzg';
    this.outcomeButton = '.bet-button-module_betButton__5u4fw';
    this.outcomeName = '.bet-button-module_outcomeName__NEnIO';
    this.outcomeOdds = '.bet-button-module_outcomeOdds__7sscT';
    this.stakeInput = 'input.custom-input[inputmode="decimal"]';
    this.slipTecaj =
      '.SlipPreparationFinancialHeader-module_value__NjUAA.SlipPreparationFinancialHeader-module_sub-heading__6SNAi';
    this.slipPayout =
      '.SlipPreparationFinancialHeader-module_value__NjUAA.SlipPreparationFinancialHeader-module_heading__UW-QQ';
  }

  async goto() {
    await this.page.goto('https://www.supersport.hr/');
  }

  // Vraća broj prikazanih utakmica (kartica)
  async getMatchCount() {
    return this.page.locator(this.matchCard).count();
  }

  // Nasumično bira jednu utakmicu; vraća njen locator i nazive timova
  async pickRandomMatch() {
    const cards = this.page.locator(this.matchCard);
    const count = await cards.count();
    const index = Math.floor(Math.random() * count);
    const card = cards.nth(index);

    const teamNames = await card.locator(this.teamName).allInnerTexts();
    return { card, teamNames };
  }

  // Nasumično bira jedan ishod (1 / X / 2) unutar zadane utakmice
  async pickRandomOutcome(card) {
    const buttons = card.locator(this.outcomeButton);
    const count = await buttons.count();
    expect(count).toBe(3);

    const index = Math.floor(Math.random() * count);
    const button = buttons.nth(index);

    const name = (await button.locator(this.outcomeName).innerText()).trim();
    const oddsText = (await button.locator(this.outcomeOdds).innerText()).trim();
    const odds = parseFloat(oddsText.replace(',', '.'));

    return { button, name, oddsText, odds };
  }

  async addOutcomeToSlip(button) {
    await button.click();
  }

  async enterStake(amount) {
    const input = this.page.locator(this.stakeInput);
    await input.click();
    await input.fill(amount.toString());
  }

  // Čita tečaj prikazan u listiću i pretvara ga u broj
  async getSlipTecaj() {
    const locator = this.page.locator(this.slipTecaj);
    await expect(locator).toBeVisible();
    const text = (await locator.innerText()).trim();
    return parseFloat(text.replace(',', '.'));
  }

  // Čita eventualnu isplatu prikazanu u listiću i pretvara je u broj
  async getSlipPayout() {
    const locator = this.page.locator(this.slipPayout);
    await expect(locator).toBeVisible();
    const text = (await locator.innerText()).trim();
    return parseFloat(text.replace('€', '').replace(',', '.').trim());
  }

  // Provjera (točka 4): da se odabrana opklada stvarno pojavila u listiću
  // Listić je u "complementary" landmarku (bočni sidebar).
  async verifyBetInSlip({ teamNames, oddsText }) {
    const slip = this.page.getByRole('complementary');

    // naziv jednog od timova mora biti vidljiv u listiću
    await expect(
      slip.getByText(teamNames[0], { exact: false })
    ).toBeVisible();

    // koeficijent (isti tekst kao na gumbu, npr. "1,75") mora biti u listiću
    await expect(
      slip.getByText(oddsText, { exact: false }).first()
    ).toBeVisible();
  }
    // Izračun eventualne isplate prema formuli koju SuperSport prikazuje.
  // Redoslijed: manipulativni trošak (5%) -> efektivni ulog -> bruto -> progresivni porez.
  calculateExpectedPayout(uplata, tecaj) {
    const manipulativniTrosak = uplata * 0.05;
    const efektivniUlog = uplata - manipulativniTrosak;
    const bruto = efektivniUlog * tecaj;
    const poreznaOsnovica = bruto - efektivniUlog; // = dobitak

    // Progresivni porez po razredima (pragovi kako ih stranica primjenjuje)
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

    const evIsplata = bruto - porez;
    return parseFloat(evIsplata.toFixed(2));
  }
    async prepareForPayment() {
    const button = this.page.getByRole('button', { name: 'PRIPREMI ZA UPLATU' });
    await expect(button).toBeVisible();
    await button.click();
  }
}