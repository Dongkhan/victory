import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/renderer/App.jsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/renderer/styles.css'), 'utf8');

test('renderer explains shared-key and connection failure states', () => {
  assert.match(app, /shared key 미설정/);
  assert.match(app, /인증 실패/);
  assert.match(app, /서버 연결 실패/);
  assert.match(app, /connectionIssue/);
});

test('renderer does not open websocket when mandatory local config is invalid', () => {
  assert.match(app, /initialIssue\?\.title === 'shared key 미설정'/);
  assert.match(app, /initialIssue\?\.title === '내 user id가 users.yaml에 없음'/);
});

test('connection issue banner has visible styles', () => {
  assert.match(css, /\.connection-banner/);
  assert.match(css, /\.connection-banner--error/);
});

test('renderer exposes reconnect, authorized-send gate, draft preservation, and blocked-send UX', () => {
  assert.match(app, /reconnectNow/);
  assert.match(app, /다시 연결/);
  assert.match(app, /전송 대기/);
  assert.match(app, /setSendError/);
  assert.match(app, /status !== 'open'/);
  assert.match(app, /return false/);
  assert.match(app, /환자 큐는 변경하지 않았습니다/);
  const chatPane = fs.readFileSync(path.join(root, 'src/renderer/components/ChatPane.jsx'), 'utf8');
  assert.match(chatPane, /if \(onSendText\(body\)\) setDraft\(''\)/);
});

test('renderer only closes the active alert id on ack broadcasts', () => {
  assert.match(app, /activeAlertIdRef/);
  assert.match(app, /msg\.id === activeAlertIdRef\.current/);
});
