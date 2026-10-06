import {aggregate,systemSummary} from './lib.mjs';
async function report(endpoint, date, signal) {
  let url = new URL('https://api.raporty.pse.pl/api/'+endpoint);
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
  return rows;
}
export async function production(date, signal) {
  const results = await Promise.allSettled([report('gen-jw',date,signal),report('his-wlk-cal',date,signal)]);
  if(signal?.aborted) throw signal.reason;
  if(results[0].status === 'rejected') throw results[0].reason;
  const units = aggregate(results[0].value,date);
  return {...units,system:results[1].status === 'fulfilled' ? systemSummary(results[1].value,date,units.expected) : null,fetchedAt:new Date().toISOString()};
}
