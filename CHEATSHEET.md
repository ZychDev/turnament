# Jaskinia Cup — Cheatsheet dla właściciela

## Szybki start

1. Wejdz na strone turnieju
2. Kliknij **Panel Admina** (prawy gorny rog)
3. Zaloguj sie haslem admina
4. Gotowe — mozesz zarzadzac turniejem!

---

## Panel Admina — zakladki

### 1. Drabinka

#### Dodawanie druzyn do drabinki (seeding)
- **Przeciagnij i upusc** druzyne z zakladki "Druzyny" na wolny slot w drabince
- Lub **kliknij pusty slot** → wybierz druzyne z listy
- Aby **usunac przypisanie**: kliknij ✕ obok nazwy druzyny w WB Runda 1

#### Edycja meczu
- Kliknij **naglowek meczu** (gorny pasek z ID meczu i ikonka ✎)
- Otworzy sie modal z opcjami:

| Pole | Opis |
|------|------|
| **Zaplanowany czas** | Ustaw date i godzine meczu (pojawi sie odliczanie na stronie) |
| **Status** | `Brak` / `LIVE` / `Zakonczony` — status LIVE automatycznie zmienia sie na "Zakonczony" gdy wybierzesz zwyciezce |
| **Wynik** | BO1: kliknij zwyciezce. BO3/BO5: uzyj +/- do ustawienia wynikow |
| **MVP** | Wybierz z listy graczy lub zostaw puste (auto-obliczone z KDA) |
| **Link transmisji** | Wklej link do Twitch/YouTube — pojawi sie na stronie przy meczu LIVE |
| **Komentarz** | Notatka widoczna pod meczem |
| **Statystyki gier** | Wpisz K/D/A/CS i championa dla kazdego gracza w kazdej grze |

#### Champion picker
- W statystykach gier, kliknij pole "Champ" → pojawi sie dropdown z ikonami championow
- Wpisz nazwe aby wyszukac (np. "Ahri", "Yasuo")
- Kliknij championa aby wybrac

#### Automatyczne zachowania
- **Auto-finish**: Gdy wybierzesz zwyciezce → status automatycznie zmienia sie na "Zakonczony"
- **Auto-MVP**: Jesli nie wybierzesz MVP recznie → system obliczy najlepszego gracza na podstawie: `kills×3 + assists×2 - deaths×1.5 + cs×0.01`
- **Auto-propagacja**: Zwyciezca automatycznie przechodzi do nastepnej rundy, przegrany do drabinki przegranych

---

### 2. Druzyny

#### Dodawanie druzyny
- Kliknij **"+ Dodaj druzyne"** (max 8 druzyn)
- Wypelnij:

| Pole | Opis |
|------|------|
| **Ikona** | Domyslna (emoji) lub wlasna (upload pliku max 500KB lub URL obrazka) |
| **Nazwa** | Pelna nazwa druzyny |
| **Tag** | Skrot (max 5 znakow, np. "SOL") |
| **Kolor** | Wybierz z 16 presetow |
| **Gracze** | 5 rol: Top, Jungle, Mid, ADC, Support |
| **Kapitan** | Kliknij 👑 przy jednym graczu |
| **op.gg** | Wpisz nick lub pelny link op.gg |

#### Edycja/Usuwanie
- **Edytuj**: kliknij "Edytuj" na karcie druzyny
- **Usun**: kliknij "Usun druzyne" (nie mozna usunac druzyny ktora jest w aktywnym meczu)

---

### 3. Ustawienia

| Akcja | Opis |
|-------|------|
| **Nazwa turnieju** | Zmien nazwe wyswietlana na stronie |
| **🎲 Losuj pary** | Losowo przypisz druzyny do WB Runda 1 |
| **↩ Cofnij** | Cofnij ostatnia zmiane (historia zmian) |
| **📄 Eksport CSV** | Pobierz wyniki meczy jako plik CSV |
| **📋 Eksport JSON** | Pobierz pelne dane turnieju jako JSON |
| **📦 Archiwizuj** | Zapisz snapshot turnieju do archiwum |
| **⚠️ Resetuj turniej** | Wyczysc WSZYSTKIE wyniki (zachowuje przypisania WB R1) |
| **Format rund** | Zmien BO1/BO3/BO5 dla kazdej rundy osobno |
| **Kod QR** | Wygeneruj QR do udostepnienia linku turnieju |
| **Zmien haslo** | Zmien haslo admina (min 4 znaki) |

---

## Strona publiczna — zakladki

### Drabinka
- Widok drabinkowy (desktop) lub listowy (mobile/przycisk "Lista")
- Kliknij mecz → szczegoly meczu z statystykami i czatem
- Mecze LIVE swieca na czerwono i auto-scroll do nich
- **Eksportuj PNG** — pobierz zdjecie drabinki

### Druzyny
- Kliknij druzyne → pelny roster, op.gg linki, historia meczy

### Harmonogram
- Mecze posortowane po dacie
- Odliczanie do przyszlych meczy (countdown)
- Pasek postepu w ostatniej godzinie przed meczem
- Mecze LIVE swieca czerwono + link do transmisji

### Statystyki
- **Ranking graczy**: KDA, K/D/A, CS, gry, championy
- **Ranking druzyn**: wygrane, przegrane, win rate %
- **Tiebreaker KDA**: gdy dwoch graczy ma to samo KDA, ranking decyduje: 1) wiecej kills+assists, 2) mniej smierci, 3) wiecej CS

### Predykcje
- Glosuj kto wygra nadchodzace mecze
- Kazdy moze zaglosowac raz na mecz
- Wyniki glosowan widoczne w % na pasku

### Hall of Fame
- 🏆 Mistrz turnieju (po zakonczeniu Grand Finalu)
- 🌟 Top 5 graczy (najlepsze KDA)
- ⚔️ Najpopularniejsze championy
- 👑 MVP kazdego meczu
- 🔥 Najciekawsze mecze (najmniejsza roznica wynikow)
- 📊 Statystyki turnieju (ile druzyn, meczy, championow)

### Regulamin
- Wyswietla regulamin turnieju wpisany przez admina
- Obsluguje formatowanie: naglowki (#, ##, ###), listy (-, *), numeracje (1. 2. 3.), cytaty (>), linie (---)

---

## Jak prowadzic turniej krok po kroku

### Przed turniejem
1. **Dodaj 8 druzyn** z pelnym rosterem (zakladka Druzyny)
2. **Ustaw seeding** — przeciagnij druzyny na sloty lub kliknij "Losuj pary"
3. **Ustaw format rund** — BO1/BO3/BO5 w Ustawieniach
4. **Zaplanuj mecze** — edytuj kazdy mecz i ustaw date/godzine
5. **Wygeneruj QR** — udostepnij link uczestnikom

### Podczas meczu
1. **Ustaw status na LIVE** (edytuj mecz → Status → LIVE)
2. Opcjonalnie **dodaj link transmisji** (pole "Link do transmisji")
3. Po meczu **wpisz wynik** — status automatycznie zmieni sie na "Zakonczony"
4. Opcjonalnie **wpisz statystyki** — K/D/A/CS i championy
5. Zwyciezca **automatycznie przechodzi** do nastepnej rundy

### Po turnieju
1. Sprawdz **Hall of Fame** — mistrz, MVP, statystyki
2. **Archiwizuj turniej** (Ustawienia → Archiwizuj)
3. **Eksportuj dane** jako CSV lub JSON na pamiatke

---

## Drabinka — jak dziala double elimination

```
WB Runda 1 (4 mecze)
    ↓ wygrani → WB Runda 2
    ↓ przegrani → LB Runda 1

WB Runda 2 (2 mecze)
    ↓ wygrani → WB Runda 3
    ↓ przegrani → LB Runda 2

WB Runda 3 (1 mecz)
    ↓ wygrany → Grand Final (slot 1)
    ↓ przegrany → LB Final

LB Runda 1 (2 mecze) → LB Runda 2 (2 mecze) → LB Runda 3 (1 mecz) → LB Final (1 mecz)
    ↓ wygrany LB Final → Grand Final (slot 2)

Grand Final — zwyciezca = MISTRZ TURNIEJU 🏆
```

Przegrani w LB sa eliminowani (nie propaguja dalej).

---

## Szybkie skroty

| Co chcesz zrobic | Jak |
|-------------------|-----|
| Dodac druzyne | Admin → Druzyny → "+ Dodaj druzyne" |
| Przypisac do drabinki | Admin → Drabinka → kliknij pusty slot lub przeciagnij |
| Rozpoczac mecz LIVE | Admin → Drabinka → kliknij naglowek meczu → Status: LIVE |
| Zakonczyc mecz | Admin → kliknij naglowek meczu → wybierz zwyciezce |
| Dodac transmisje | Admin → edytuj mecz → pole "Link do transmisji" |
| Cofnac zmiane | Admin → Ustawienia → "Cofnij ostatnia zmiane" |
| Zresetowac turniej | Admin → Ustawienia → "Resetuj turniej" |
| Zmienic BO format | Admin → Ustawienia → "Format rund" → wybierz BO1/3/5 |
| Zmienic jezyk | Przycisk EN/PL w prawym gornym rogu |
| Zmienic motyw | Przelacznik ciemny/jasny obok jezyka |
| Dodac regulamin | Admin → Ustawienia → sekcja "Regulamin" → wpisz tekst → Zapisz |

---

## Powiadomienia na zywo

- Strona **automatycznie odswieża** dane co 1 sekunde (SSE)
- Gdy mecz sie zakonczy → **dzwiek powiadomienia** + wyskakujacy toast
- Gdy ktos wygra Grand Final → **konfetti** 🎉
- Nie trzeba przeladowywac strony — wszystko aktualizuje sie w czasie rzeczywistym

---

## Limity bezpieczenstwa

| Akcja | Limit |
|-------|-------|
| Logowanie admina | max 10 prob/min |
| Glosowanie predykcji | max 30/min, 1 glos/mecz |
| Komentarze czatu | max 20/min, nick ≤20 zn., wiadomosc ≤200 zn. |
| Ikona druzyny | max 500KB |
| Tag druzyny | max 5 znakow |
