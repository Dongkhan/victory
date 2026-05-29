import { chromium, devices } from 'playwright';

const url = process.env.RR_URL || 'http://127.0.0.1:8787/relax-routine/prototype/v3.6.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 12'] });
const page = await context.newPage();
const errors = [];
page.on('console', msg => {
  if (['error', 'warning'].includes(msg.type())) errors.push(`${msg.type()}: ${msg.text()}`);
});
page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));

async function waitForHome() {
  await page.waitForFunction(() => window.__RELAX_ROADMAP_VERSION__ === 'v3.6', null, { timeout: 30000 });
  await page.waitForSelector('#relax-v36-home', { timeout: 30000 });
}
async function resetHome() {
  await page.evaluate(() => {
    localStorage.removeItem('relax-routine-v36-mobile-state');
    localStorage.removeItem('relax-routine-v35-mobile-state');
    localStorage.removeItem('relax-routine-v34-mobile-state');
    sessionStorage.clear();
    location.hash = '#home';
    window.__rrV36ForceHome?.();
  });
  await page.waitForSelector('#relax-v36-home', { timeout: 10000 });
}
async function expectTab(target, selector) {
  await page.click(`[data-tab="${target}"]`);
  await page.waitForSelector(selector, { timeout: 10000 });
  const active = await page.locator(`[data-tab="${target}"]`).evaluate(el => el.classList.contains('active'));
  if (!active) throw new Error(`Tab ${target} is not active`);
}
async function assertTabsVisible() {
  const labels = await page.locator('.tabbar').innerText({ timeout: 5000 });
  for (const label of ['홈','세션','정보','설정']) {
    if (!labels.includes(label)) throw new Error(`Missing tab label: ${label}`);
  }
}
async function clickRoutine(key) {
  await resetHome();
  await page.click(`[data-start="${key}"]`);
  await assertTabsVisible();
  if (key === 'pmr') {
    await page.waitForSelector('#rr-pmr-v3.rr-v36-unified', { timeout: 10000 });
    const phase = await page.locator('#badge').innerText({ timeout: 5000 });
    if (!/긴장|이완/.test(phase)) throw new Error(`PMR badge missing phase: ${phase}`);
    await expectTab('info', '#rr-v36-info');
    await expectTab('sessions', '#rr-v36-sessions');
  } else {
    await page.waitForSelector('#rr-v36-session', { timeout: 10000 });
    await page.click('#rr-v36-session [data-next]');
    await page.click('#rr-v36-session [data-next]');
    await page.click('#rr-v36-session [data-next]');
    await page.waitForSelector('#rr-v36-session [data-complete-card].show', { timeout: 10000 });
    await assertTabsVisible();
    await expectTab('info', '#rr-v36-info');
    await expectTab('settings', '#rr-v36-settings');
    await expectTab('home', '#relax-v36-home');
  }
}

await page.goto(url, { waitUntil: 'commit', timeout: 60000 });
await waitForHome();
await assertTabsVisible();
await expectTab('sessions', '#rr-v36-sessions');
await expectTab('info', '#rr-v36-info');
await expectTab('settings', '#rr-v36-settings');
await expectTab('home', '#relax-v36-home');
for (const key of ['breath','pmr','bodyscan','autogenic']) await clickRoutine(key);

await page.goto(`${url}#pmr`, { waitUntil: 'commit', timeout: 60000 });
await page.waitForSelector('#rr-pmr-v3.rr-v36-unified', { timeout: 30000 });
await assertTabsVisible();
const pmrText = await page.locator('#rr-pmr-v3').innerText({ timeout: 10000 });
if (!pmrText.includes('5') || !pmrText.includes('10')) throw new Error('PMR does not expose 5/10 timing text');

const overlap = await page.evaluate(() => {
  const btn = document.querySelector('.tabbar');
  if (!btn) return true;
  const r = btn.getBoundingClientRect();
  if (r.bottom > innerHeight || r.top < 0) return true;
  const cta = document.querySelector('#rr-v36-session [data-next], #pmrPrimary');
  if (!cta) return false;
  const cr = cta.getBoundingClientRect();
  return cr.bottom > r.top && cr.top < r.bottom;
});

await browser.close();
if (overlap) throw new Error('Bottom tab or CTA overlap detected');
const fatal = errors.filter(e => !/favicon|404/.test(e));
if (fatal.length) throw new Error(`Console/page errors:\n${fatal.join('\n')}`);
console.log('RR v3.6 smoke passed: restored Home/Session/Info/Settings tabs, session completion navigation, all routine entries, PMR unified route, #pmr deep link, mobile CTA visibility.');
