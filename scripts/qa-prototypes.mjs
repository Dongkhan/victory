#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const checks = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function ok(name, cond, detail = '') {
  checks.push({ name, ok: !!cond, detail });
  if (!cond) failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}
function has(rel, token) {
  return read(rel).includes(token);
}

const index = read('index.html');
const hrefs = [...index.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
for (const href of hrefs) {
  if (/^https?:|^mailto:|^tel:/.test(href)) continue;
  ok(`index link exists: ${href}`, fs.existsSync(path.join(root, href)));
}

ok('index keeps DH Talk section', /DH Talk/.test(index) && /dh-talk\/README\.md/.test(index));
ok('index has Korean language and mobile viewport', /<html lang="ko">/.test(index) && /name="viewport"/.test(index) && /<main>/.test(index));
ok('index marks CBT-I stable/latest honestly', /CBT-I prototype v0\.3-stable/.test(index));
ok('index marks Relax Routine v0.5 polish', /폴리시 보완/.test(index));

const cbti = read('prototype/cbti-v0.3.html');
ok('CBT-I latest file is v0.3', index.includes('prototype/cbti-v0.3.html'));
ok('CBT-I allows mobile zoom', !/maximum-scale\s*=\s*1|user-scalable\s*=\s*no/.test(cbti));
ok('CBT-I diary labels are explicitly associated', ['diaryDate','bedTime','lightsOff','sleepOnset','wakeCount','waso','wakeTime','outTime','nap','caf','med','quality','worryMemo'].every((id) => cbti.includes(`for="${id}"`) && cbti.includes(`id="${id}"`)));
ok('CBT-I has lavender sleep theme', cbti.includes('--accent:#8e7cc3') && cbti.includes('라벤더'));
ok('CBT-I has safe-area bottom handling', cbti.includes('safe-area-inset-bottom'));
ok('CBT-I has bottom nav safety padding', /--bottom-nav-h\s*:\s*82px/.test(cbti) && /calc\(var\(--bottom-nav-h\)/.test(cbti));
ok('CBT-I diary save button is not sticky-overlay', !/saveDiary[^\n]*position\s*:\s*sticky/.test(cbti));
ok('CBT-I crisis copy includes 119', cbti.includes('119'));
ok('CBT-I crisis copy includes 생명존중사업', cbti.includes('생명존중사업'));
ok('CBT-I crisis selection blocks CBT-I progression', cbti.includes('hasCrisisBlock') && cbti.includes('blockedTargets'));
ok('CBT-I crisis block has persistent inline panel', cbti.includes('crisisPanel') && cbti.includes('homeCrisisBanner') && cbti.includes('href="tel:119"') && /aria-disabled/.test(cbti));
ok('CBT-I has clinic summary export', cbti.includes('clinicSummary') && cbti.includes('data-copy-summary'));
ok('CBT-I clinic summary copy has fallback', cbti.includes('copyText') && cbti.includes('execCommand'));
ok('CBT-I diary date is not hard-coded', cbti.includes('diaryDate') && !cbti.includes('value="2026-05-18"'));
ok('CBT-I OSA caution blocks sleep restriction auto-guidance', cbti.includes('hasOsaCaution') && cbti.includes("dataset.modal==='restriction'") && cbti.includes('수면무호흡 위험 신호가 있으면 수면제한이나 침대 시간 축소보다 진료 평가가 우선'));
ok('CBT-I diary validation includes driving and medication risk warnings', cbti.includes('운전·기계작업') && cbti.includes('낙상·주간졸림'));
ok('CBT-I diary validation announces changes accessibly', /id="diaryValidation"[^>]+aria-live="polite"/.test(cbti));
ok('CBT-I route cards can start selected intake step', /data-start-step/.test(cbti) && /startStep/.test(cbti));

const relax = read('prototype/v0.5.html');
ok('Relax Routine has emergency phone link', relax.includes('tel:'));
ok('Relax Routine has Korean language root', /<html lang="ko">/.test(relax));
ok('Relax Routine allows zoom in embedded viewport', !/content=\\"[^\\"]*(maximum-scale=1(?:\\.0)?|user-scalable=no)/i.test(relax));
ok('Relax Routine loading state is announced accessibly', relax.includes('id="__bundler_loading" role="status" aria-live="polite"'));
ok('Relax Routine runtime strips stale zoom lock from bundled templates', relax.includes('Runtime accessibility guard') && relax.includes('user-scalable=no'));
ok('Relax Routine has safe-area handling', relax.includes('safe-area-inset-bottom'));
ok('Relax Routine has accessibility labels', relax.includes('aria-label'));
ok('Relax Routine contains crisis/help policy copy', /위기|crisis|119/.test(relax));
ok('Relax Routine hides bottom nav during active sessions', relax.includes('__hideNav') && relax.includes('!__hideNav'));
ok('Relax Routine distinguishes stop from completed session', relax.includes('ex_session_end_hint') && relax.includes('Will not be recorded as completed'));

for (const rel of ['prototype/cbti-v0.2.html', 'prototype/cbti-v0.3.html', 'prototype/v0.5.html']) {
  const text = read(rel);
  ok(`${rel} has no merge conflict markers`, !/^(<<<<<<<|=======|>>>>>>>)/m.test(text));
  ok(`${rel} has root element`, /<html|<!doctype html/i.test(text));
}

const mirror = read('dh-talk/src/main/hermes-mirror.js');
ok('DH Talk Hermes mirror has no HTTP default URL', !/DEFAULT_URL|http:\/\/76\.13\.179\.163/.test(mirror));
ok('DH Talk Hermes mirror requires explicit HTTPS URL', mirror.includes('HERMES_URL 미설정') && mirror.includes("parsed.protocol !== 'https:'"));

console.log(`Prototype QA checks: ${checks.filter((c) => c.ok).length}/${checks.length} passed`);
for (const c of checks) {
  console.log(`${c.ok ? 'ok' : 'FAIL'} - ${c.name}${c.detail ? ` (${c.detail})` : ''}`);
}

if (failures.length) {
  console.error('\nFailures:');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
