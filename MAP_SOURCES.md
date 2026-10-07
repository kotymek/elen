# Mapa ELEN — źródła i zakres

Stan weryfikacji: 7 października 2026. Mapa pokazuje lokalizacje obiektów,
nie połączenia sieciowe ani obszary zasilania. Przypisania do nazw PSE są jawne
w `public/map.mjs`; nie stosujemy dopasowania przybliżonego.

| Obiekt | Nazwy PSE | Współrzędne (lat, lon) | Źródło |
|---|---|---|---|
| Bełchatów | Bełchatów | 51.26626, 19.32684 | https://www.wikidata.org/wiki/Q1546242 |
| Opole | Opole | 50.75182, 17.88196 | https://www.gem.wiki/Opole_power_station |
| Kozienice | Kozienice 1, Kozienice 2 | 51.66528, 21.46444 | https://www.wikidata.org/wiki/Q1786153 |
| Turów | Turów | 50.94583, 14.91472 | https://en.wikipedia.org/wiki/Tur%C3%B3w_Power_Station |
| Żarnowiec | Żarnowiec | 54.72222, 18.08222 | https://www.wikidata.org/wiki/Q1727941 |

Kozienice 1 i 2 mają wspólny punkt: jego energia jest sumą obu pozycji;
wybór punktu przenosi fokus na listę szczegółów. Interfejs podaje liczbę
zmapowanych pozycji względem całego raportu. Nieznane nazwy pozostają poza mapą.
Pole koła jest proporcjonalne do energii; wartość zerową oznacza pusty punkt.

Granica Polski: Natural Earth 1:110m, public domain.
Źródło: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
Warunki: https://www.naturalearthdata.com/about/terms-of-use/
W `public/poland.mjs` zapisano wyłącznie geometrię obiektu ADM0_A3=POL.
Współrzędne Wikidata są dostępne na zasadach CC0. Pozostałe źródła służą
weryfikacji punktów; nie kopiujemy opisów ani pełnych baz.
