import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const mainIndex = fs.readFileSync(path.join(root, 'src/main/index.js'), 'utf8');
const alertWindow = fs.readFileSync(path.join(root, 'src/main/alert-window.js'), 'utf8');
const rendererHtml = fs.readFileSync(path.join(root, 'src/renderer/index.html'), 'utf8');
const alertHtml = fs.readFileSync(path.join(root, 'src/renderer/alert.html'), 'utf8');

test('Electron windows deny popups and external navigation', () => {
  assert.match(mainIndex, /setWindowOpenHandler\(\(\) => \(\{ action: 'deny' \}\)\)/);
  assert.match(mainIndex, /will-navigate/);
  assert.match(mainIndex, /event\.preventDefault\(\)/);
  assert.match(alertWindow, /setWindowOpenHandler\(\(\) => \(\{ action: 'deny' \}\)\)/);
  assert.match(alertWindow, /will-navigate/);
});

test('renderer and alert HTML declare CSP', () => {
  assert.match(rendererHtml, /Content-Security-Policy/);
  assert.match(rendererHtml, /default-src 'self'/);
  assert.match(rendererHtml, /connect-src/);
  assert.match(alertHtml, /Content-Security-Policy/);
  assert.match(alertHtml, /default-src 'self'/);
});
