# ELEN

Strona pokazująca dobową produkcję energii jednostek wytwórczych raportowanych przez PSE. Node.js 22+, bez zależności npm.

```sh
npm start
# http://localhost:3000
npm test
```

Domyślna data: poprzedni dzień w Europe/Warsaw. Dostępna historia od 14 czerwca 2024. Wyszukiwanie, grupowanie elektrowni i jednostek, wykres mocy, eksport CSV i informacja o kompletności serii. API backendu: `/api/production?date=YYYY-MM-DD`. PORT domyślnie 3000. Serwer nasłuchuje lokalnie; produkcyjne wdrożenie wymaga reverse proxy i HTTPS.

## Dane i obliczenia

Źródło: https://api.raporty.pse.pl/api/gen-jw. Mapowanie: https://api.raporty.pse.pl/EndpointsMap.pdf. Backend pobiera wszystkie strony odpowiedzi, buforuje je 15 minut i scala równoczesne zapytania. Nie ma danych przykładowych ani zastępowania awarii sztucznymi wynikami.

Raport zawiera średnią moc MW w interwałach 15 minut. Energia MWh jest sumą MW × 0,25 h; uwzględniane są tylko rekordy trybu Generacja. Rewizje rozpoznawane po kodzie jednostki i czasie UTC: ostatnia publikacja zastępuje poprzednią. Braki nie są zerami. Doby zmiany czasu obejmują 92/100 interwałów, pozostałe 96. Pokrycie elektrowni jest liczbą dostępnych pomiarów względem oczekiwanej liczby pomiarów wszystkich jej raportowanych jednostek.

**Zakres:** nie należy utożsamiać sumy raportu z całkowitą produkcją Polski. Publiczny raport nie zapewnia pełnego wykazu wszystkich farm PV ani innych instalacji KSE. Grupowanie wykorzystuje nazwy PSE, bloki reprezentują kody JW. Nie klasyfikujemy technologii na podstawie nazwy. Rozszerzenie do pełnej ewidencji wymaga dodatkowego źródła danych i mapowania jednostek.

Testy: agregacja energii, rewizje, brakujące wartości, wyłączenie poboru magazynów, dni zmiany czasu i data według Warszawy.

## GitHub Pages

Publiczna strona: https://kotymek.github.io/elen/. Workflow `.github/workflows/pages.yml` testuje i publikuje katalog `public` po każdym pushu do domyślnej gałęzi `feat/production-dashboard`. GitHub Pages ma ustawione źródło GitHub Actions.

Na stronie statycznej przeglądarka pobiera wszystkie strony raportu bezpośrednio z publicznego API PSE (CORS). Dane nie wymagają ponownego wdrożenia każdego dnia. Serwer Node pozostaje opcjonalny do lokalnego podglądu i udostępnia buforowane API opisane wyżej. Publiczny interfejs korzysta z API PSE bez bufora serwera. Awaria PSE pokazuje komunikat i przycisk ponowienia, bez sztucznych wyników.

Raport zbiorczy his-wlk-cal uzupełnia stronę o energię KSE (jg + jnwrb), wiatr, PV i generację/ładowanie magazynów. Wiatr/PV nie są dodawane drugi raz do sumy. Energia zbiorcza jest pokazywana tylko przy komplecie pomiarów danego pola. Różnica względem listy jednostek jest porównaniem zakresów raportów, nie identyfikacją konkretnych brakujących źródeł. Awaria raportu zbiorczego nie blokuje rankingu jednostek.

## Eksplorator energii

- Zwięzły widok dobowy: KSE, wiatr i PV w GWh oraz podsumowanie oparte na danych.
- Interaktywny wykres w GW z osobnymi seriami, minimum/maksimum i obsługą klawiatury (strzałki, Home, End). Linie mają przerwy przy brakujących pomiarach.
- Porównanie z poprzednią dobą: KSE i procentowa zmiana energii tylko dla pełnych dób. Linie dopasowywane do lokalnej godziny; przy zmianie czasu powtórzony/brakujący interwał nie jest interpolowany. Doby 23/25 h są oznaczone.
- Szczegóły elektrowni i bloków, miniwykresy oraz historia 7/30 dni. Dane historyczne są pobierane kolejno, dopiero po wybraniu zakresu. Zamknięcie panelu, zmiana zakresu lub daty anuluje pobieranie. Brak jednostki lub niepełna seria nie są zerem.
- Pamięć podręczna w przeglądarce: 15 minut, maksymalnie 40 wpisów, bez zapisu do trwałej pamięci. Błędne odpowiedzi nie są buforowane jako sukces.
- Data, wyszukiwanie, grupowanie i porównanie w URL. Przycisk udostępniania kopiuje ten adres, a gdy schowek jest niedostępny, wskazuje pasek adresu.
- Mapa pięciu zweryfikowanych lokalizacji (sześć nazw PSE) z jawnym pokryciem listy. Szczegóły źródeł i rozszerzania słownika w [MAP_SOURCES.md](MAP_SOURCES.md).
- Bez nowych zależności npm i z zachowaniem publikowania statycznego katalogu `public` na GitHub Pages.

Testy `npm test` obejmują też serie jednostek, brakujące interwały, porównania
w dniach zmiany czasu, kompletność historii, walidację adresów z datą,
polskie formy liczebników i udziały mniejsze niż 0,1%.

Mapa nie wyświetla stałych podpisów przy punktach. Nazwa i energia pojawiają się nad mapą po wskazaniu punktu myszą lub ustawieniu na nim fokusu klawiatury. Kliknięcie/dotknięcie otwiera szczegóły; pełne nazwy pozostają również na liście obok. Dawny parametr URL `kind` jest ignorowany i usuwany z adresu.
