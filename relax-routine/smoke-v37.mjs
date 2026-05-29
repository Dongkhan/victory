import { chromium, devices } from 'playwright';

const base = process.env.RR_BASE_URL || 'http://127.0.0.1:8787/relax-routine/prototype/v3.7.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ...devices['iPhone 12'] });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

async function expectVisible(selector, label) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout: 5000 });
  if (!await loc.isVisible()) throw new Error(`${label} not visible`);
}
async function clickText(text) { await page.getByText(text, { exact: true }).first().click(); }

await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); location.hash = 'home'; });
await page.reload({ waitUntil: 'domcontentloaded' });
await expectVisible('#relax-v37-home', 'home');
for (const tab of ['홈','세션','정보','설정']) await expectVisible(`.tabbar >> text=${tab}`, `tab ${tab}`);

await clickText('세션');
await expectVisible('#rr-v37-sessions', 'sessions');
await clickText('복식호흡');
await expectVisible('#rr-v37-breath', 'breath screen');
await expectVisible('.breath-balloon', 'breathing balloon');
const breathAnim = await page.locator('.breath-balloon').evaluate(el => getComputedStyle(el).animationName);
if (!/breathBalloon/.test(breathAnim)) throw new Error(`breathing balloon animation missing: ${breathAnim}`);
await page.locator('#breathToggle').click();
await page.waitForTimeout(1200);
const breathCount = await page.locator('#breathCount').textContent();
if (!/들이마시기|내쉬기/.test(breathCount || '')) throw new Error(`breathing phase did not update: ${breathCount}`);
await page.locator('#breathComplete').click();
await expectVisible('.tabbar >> text=홈', 'tabbar after breath completion');

await clickText('세션');
await clickText('자율훈련');
await expectVisible('#rr-v37-autogenic', 'autogenic screen');
const autoText = await page.locator('#autoWord').textContent();
if (!/무겁다/.test(autoText || '')) throw new Error(`autogenic formula missing: ${autoText}`);
await page.locator('#autoNext').click();
const autoText2 = await page.locator('#autoWord').textContent();
if (!/따뜻/.test(autoText2 || '')) throw new Error(`autogenic next formula missing: ${autoText2}`);

await clickText('세션');
await clickText('점진적 근육이완');
await expectVisible('#rr-pmr-v3', 'pmr screen');
const pmrText = await page.locator('#rr-pmr-v3').textContent();
if (/수면\s*PMR|data-mode="sleep"/.test(pmrText || '')) throw new Error('sleep PMR still visible in PMR screen');
if (await page.locator('[data-mode="sleep"]').count()) throw new Error('sleep PMR mode button still present');
await page.locator('#pmrPrimary').click();
await page.waitForTimeout(500);
const pmrButton = await page.locator('#pmrPrimary').textContent();
if (!/다음 근육군/.test(pmrButton || '')) throw new Error(`PMR did not start: ${pmrButton}`);

await clickText('홈');
await expectVisible('#relax-v37-home', 'home after PMR');

if (errors.length) throw new Error(`console/page errors: ${errors.join(' | ')}`);
await browser.close();
console.log('Relax Routine v3.7 smoke passed: sleep PMR removed, breathing balloon restored, autogenic formulas restored, tabs intact.');
