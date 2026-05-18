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
ok('index marks CBT-I stable/latest honestly', /CBT-I prototype v0\.3-stable/.test(index));
ok('index marks Relax Routine v0.5 polish', /폴리시 보완/.test(index));

const cbti = read('prototype/cbti-v0.2.html');
ok('CBT-I has safe-area bottom handling', cbti.includes('safe-area-inset-bottom'));
ok('CBT-I has bottom nav safety padding', /--bottom-nav-h\s*:\s*82px/.test(cbti) && /calc\(var\(--bottom-nav-h\)/.test(cbti));
ok('CBT-I diary save button is not sticky-overlay', !/saveDiary[^\n]*position\s*:\s*sticky/.test(cbti));
ok('CBT-I crisis copy includes 119', cbti.includes('119'));
ok('CBT-I crisis copy includes 생명존중사업', cbti.includes('생명존중사업'));
ok('CBT-I route cards can start selected intake step', /data-start-step/.test(cbti) && /startStep/.test(cbti));

const relax = read('prototype/v0.5.html');
ok('Relax Routine has emergency phone link', relax.includes('tel:'));
ok('Relax Routine has safe-area handling', relax.includes('safe-area-inset-bottom'));
ok('Relax Routine has accessibility labels', relax.includes('aria-label'));
ok('Relax Routine contains crisis/help policy copy', /위기|crisis|119/.test(relax));

for (const rel of ['prototype/cbti-v0.2.html', 'prototype/v0.5.html']) {
  const text = read(rel);
  ok(`${rel} has no merge conflict markers`, !/^(<<<<<<<|=======|>>>>>>>) /m.test(text));
  ok(`${rel} has root element`, /<html|<!doctype html/i.test(text));
}

console.log(`Prototype QA checks: ${checks.filter((c) => c.ok).length}/${checks.length} passed`);
for (const c of checks) {
  console.log(`${c.ok ? 'ok' : 'FAIL'} - ${c.name}${c.detail ? ` (${c.detail})` : ''}`);
}

if (failures.length) {
  console.error('\nFailures:');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
