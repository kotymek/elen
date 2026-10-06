import {aggregate} from './lib.mjs';
export async function production(date, signal) {
  let url = new URL('https://api.raporty.pse.pl/api/gen-jw');
  url.searchParams.set('$filter', `business_date eq '${date}'`);
  url.searchParams.set('$first', '5000');
  const rows = [], visited = new Set();
  while (url) {
    if (url.origin !== 'https://api.raporty.pse.pl' || visited.has(url.href) || visited.size >= 100) throw new Error('Nieprawidłowa paginacja PSE.');
    visited.add(url.href);
    const response = await fetch(url, {signal});
    if (!response.ok) throw new Error(`PSE jest chwilowo niedostępne (HTTP ${response.status}). Spróbuj ponownie za chwilę.`);
    const page = await response.json();
    if (!Array.isArray(page.value)) throw new Error('Nieprawidłowa odpowiedź PSE.');
    rows.push(...page.value);
    url = page.nextLink ? new URL(page.nextLink, url) : null;
  }
  return {...aggregate(rows, date), fetchedAt: new Date().toISOString()};
}
