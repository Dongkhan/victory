import { chromium } from 'playwright';

const version = process.argv[2] || 'v3.10.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text());
});
page.on('pageerror', err => errors.push(err.message));
await page.goto(`http://127.0.0.1:8787/relax-routine/prototype/${version}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(3000);
const info = await page.evaluate(() => ({
  title: document.title,
  buttons: [...document.querySelectorAll('button')].slice(0,12).map(b => b.innerText.trim()),
  text: document.body.innerText.slice(0,500),
  ready: window.__RELAX_ROADMAP_VERSION__ || null
}));
console.log(JSON.stringify({version, info, errors}, null, 2));
if (errors.length) process.exit(1);
if (!info.buttons.some(x => x.includes('복식호흡')) || !info.buttons.some(x => x.includes('점진적'))) process.exit(2);
await page.getByRole('button', { name: /점진적 근육이완/ }).click();
await page.waitForTimeout(500);
const pmr = await page.evaluate(() => document.body.innerText.slice(0,800));
console.log('PMR_TEXT', pmr.includes('Relax Routine PMR') || pmr.includes('현재:'), pmr.slice(0,200));
if (!pmr.includes('PMR') && !pmr.includes('현재:')) process.exit(3);
await browser.close();
