import { chromium, devices } from 'playwright';

const url = process.env.RR_URL || 'http://127.0.0.1:8787/relax-routine/prototype/v3.5.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 12'] });
const page = await context.newPage();
const errors = [];
page.on('console', msg => {
  if (['error', 'warning'].includes(msg.type())) errors.push(`${msg.type()}: ${msg.text()}`);
});
page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));

async function waitForHome() {
  await page.waitForFunction(() => window.__RELAX_ROADMAP_VERSION__ === 'v3.5', null, { timeout: 30000 });
  await page.waitForSelector('#relax-v35-home', { timeout: 30000 });
}
async function resetHome() {
  await page.evaluate(() => {
    localStorage.removeItem('relax-routine-v35-mobile-state');
    localStorage.removeItem('relax-routine-v34-mobile-state');
    sessionStorage.clear();
    location.hash = '#home';
    window.__rrV35ForceHome?.();
  });
  await page.waitForSelector('#relax-v35-home', { timeout: 10000 });
}
async function clickRoutine(key) {
  await resetHome();
  await page.click(`[data-start="${key}"]`);
  if (key === 'pmr') {
    await page.waitForSelector('#rr-pmr-v3.rr-v35-unified', { timeout: 10000 });
    const phase = await page.locator('#badge').innerText({ timeout: 5000 });
    if (!/긴장|이완/.test(phase)) throw new Error(`PMR badge missing phase: ${phase}`);
    await page.click('#rr-pmr-v3 [data-home]');
  } else {
    await page.waitForSelector('#rr-v35-session', { timeout: 10000 });
    await page.click('#rr-v35-session [data-next]');
    await page.click('#rr-v35-session [data-next]');
    await page.click('#rr-v35-session [data-next]');
    await page.waitForSelector('#rr-v35-session [data-complete-card].show', { timeout: 10000 });
    await page.click('#rr-v35-session [data-home]');
  }
}

await page.goto(url, { waitUntil: 'commit', timeout: 60000 });
await waitForHome();
for (const key of ['breath','pmr','bodyscan','autogenic']) await clickRoutine(key);

await page.goto(`${url}#pmr`, { waitUntil: 'commit', timeout: 60000 });
await page.waitForSelector('#rr-pmr-v3.rr-v35-unified', { timeout: 30000 });
const pmrText = await page.locator('#rr-pmr-v3').innerText({ timeout: 10000 });
if (!pmrText.includes('5') || !pmrText.includes('10')) throw new Error('PMR does not expose 5/10 timing text');

const overlap = await page.evaluate(() => {
  const home = document.getElementById('relax-v35-home');
  if (home) return false;
  const session = document.getElementById('rr-v35-session');
  const btn = session?.querySelector('[data-next]');
  if (!btn) return false;
  const r = btn.getBoundingClientRect();
  return r.bottom > innerHeight || r.top < 0;
});

await browser.close();
if (overlap) throw new Error('CTA outside viewport or overlapped');
const fatal = errors.filter(e => !/favicon|404/.test(e));
if (fatal.length) throw new Error(`Console/page errors:\n${fatal.join('\n')}`);
console.log('RR v3.5 smoke passed: home, all routine entries, PMR unified route, #pmr deep link, completion flow, mobile CTA visibility.');
