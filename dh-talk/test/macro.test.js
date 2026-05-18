import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMacroText, macroTextNeeds, matchesHotkey } from '../src/renderer/lib/macro.js';

const ev = (over) => ({
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...over,
});

test('{patient} 치환', () => {
  assert.equal(resolveMacroText('{patient} 님 들어오세요', { patient: '김OO' }), '김OO 님 들어오세요');
});

test('빈 환자명 치환', () => {
  assert.equal(resolveMacroText('{patient} 님', { patient: '' }), ' 님');
});

test('변수 없는 텍스트 그대로', () => {
  assert.equal(resolveMacroText('5분 대기', {}), '5분 대기');
});

test('macroTextNeeds 감지', () => {
  assert.equal(macroTextNeeds('{patient} 님', 'patient'), true);
  assert.equal(macroTextNeeds('5분 대기', 'patient'), false);
});

test('Ctrl+1 핫키 매칭', () => {
  assert.equal(matchesHotkey('Ctrl+1', ev({ ctrlKey: true, key: '1' })), true);
});

test('Ctrl+1 — ⌘(meta) 도 허용', () => {
  assert.equal(matchesHotkey('Ctrl+1', ev({ metaKey: true, key: '1' })), true);
});

test('수식키 없으면 불일치', () => {
  assert.equal(matchesHotkey('Ctrl+1', ev({ key: '1' })), false);
});

test('다른 키면 불일치', () => {
  assert.equal(matchesHotkey('Ctrl+1', ev({ ctrlKey: true, key: '2' })), false);
});
