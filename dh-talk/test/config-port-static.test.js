import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const mainIndex = fs.readFileSync(path.join(root, 'src/main/index.js'), 'utf8');
const ipc = fs.readFileSync(path.join(root, 'src/main/ipc.js'), 'utf8');
const settings = fs.readFileSync(path.join(root, 'config/settings.yaml'), 'utf8');

test('server.ws_port in settings is the single source for runtime port', () => {
  assert.match(settings, /ws_port:\s*8123/);
  assert.match(mainIndex, /wsPort\s*=\s*Number\(config\.settings\.server\?\.ws_port\s*\?\?\s*WS_PORT\)/);
  assert.match(mainIndex, /startServer\(wsPort,/);
  assert.match(mainIndex, /registerIpc\(\(\) => config, \(\) => wsPort\)/);
  assert.match(ipc, /wsPort:\s*getWsPort\(\)/);
});
