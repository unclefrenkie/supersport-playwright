## Što test radi

1. Otvara početnu stranicu SuperSporta
2. Nasumično odabire jednu utakmicu s liste popularnih događaja
3. Nasumično odabire ishod (1 / X / 2) i čita njegov koeficijent
4. Dodaje okladu u listić
5. Provjerava da su se naziv utakmice i koeficijent stvarno pojavili u listiću
6. Unosi ulog
7. Provjerava da se tečaj u listiću poklapa s koeficijentom s gumba
8. Izračunava očekivanu isplatu prema SuperSportovoj formuli i provjerava
   da se egzaktno (do centa) poklapa s iznosom prikazanim u UI-ju
9. Priprema listić za uplatu (klik na "PRIPREMI ZA UPLATU")

## Formula izračuna isplate

Isplata se ne računa kao obični `ulog × koeficijent`. SuperSport primjenjuje:

1. **Manipulativni trošak** = 5% od uplate
2. **Efektivni ulog** = uplata − manipulativni trošak
3. **Bruto** = efektivni ulog × tečaj
4. **Porezna osnovica** (dobitak) = bruto − efektivni ulog
5. **Progresivni porez** po razredima:
   - 0 – 1.500 € → 10%
   - 1.500 – 4.000 € → 15%
   - 4.000 – 66.361,40 € → 20%
   - iznad 66.361,40 € → 30%
6. **Eventualna isplata** = bruto − porez

Test replicira ovu formulu i uspoređuje rezultat s onim što stranica prikazuje.

## Napomene

Stranica koristi CSS-modules hashirane klase (npr. `__NYsFg`), koje se mogu
promijeniti pri redeployu. Zato su svi selektori grupirani na jednom mjestu
u Page Objectu radi lakšeg održavanja.

Test se izvršava protiv žive produkcijske stranice s promjenjivim podacima,
pa može biti osjetljiv na dostupnost utakmica ili zaštitu od botova
(posebno u CI okruženju). U produkcijskom bi se radu testiralo protiv
staging okruženja ili s mockanim podacima.