# ELEN

Strona pokazująca dobową produkcję energii jednostek wytwórczych raportowanych przez PSE. Node.js 22+, bez zależności npm.

```sh
npm start
# http://localhost:3000
npm test
```

Domyślna data: poprzedni dzień w Europe/Warsaw. Dostępna historia od 14 czerwca 2024. Wyszukiwanie, grupowanie elektrowni i jednostek, filtr nazw PV, wykres mocy, eksport CSV i informacja o kompletności serii. API backendu: `/api/production?date=YYYY-MM-DD`. PORT domyślnie 3000. Serwer nasłuchuje lokalnie; produkcyjne wdrożenie wymaga reverse proxy i HTTPS.

## Dane i obliczenia

Źródło: https://api.raporty.pse.pl/api/gen-jw. Mapowanie: https://api.raporty.pse.pl/EndpointsMap.pdf. Backend pobiera wszystkie strony odpowiedzi, buforuje je 15 minut i scala równoczesne zapytania. Nie ma danych przykładowych ani zastępowania awarii sztucznymi wynikami.

Raport zawiera średnią moc MW w interwałach 15 minut. Energia MWh jest sumą MW × 0,25 h; uwzględniane są tylko rekordy trybu Generacja. Rewizje rozpoznawane po kodzie jednostki i czasie UTC: ostatnia publikacja zastępuje poprzednią. Braki nie są zerami. Doby zmiany czasu obejmują 92/100 interwałów, pozostałe 96. Pokrycie elektrowni jest liczbą dostępnych pomiarów względem oczekiwanej liczby pomiarów wszystkich jej raportowanych jednostek.

**Zakres:** nie należy utożsamiać sumy raportu z całkowitą produkcją Polski. Publiczny raport nie zapewnia pełnego wykazu wszystkich farm PV ani innych instalacji KSE. Grupowanie wykorzystuje nazwy PSE, bloki reprezentują kody JW; filtr PV bazuje na nazwie, a nie potwierdzonym rejestrze technologii. Rozszerzenie do pełnej ewidencji wymaga dodatkowego źródła danych i mapowania jednostek.

Testy: agregacja energii, rewizje, brakujące wartości, wyłączenie poboru magazynów, dni zmiany czasu i data według Warszawy.
