import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQueueText } from '../src/main/queue-parser.js';

test('시간 앞 형식', () => {
  assert.deepEqual(parseQueueText('09:00 김환자')[0], {
    name: '김환자',
    scheduled_time: '09:00',
  });
});

test('시간 뒤 형식', () => {
  assert.deepEqual(parseQueueText('이환자 10:30')[0], {
    name: '이환자',
    scheduled_time: '10:30',
  });
});

test('탭 구분', () => {
  const [p] = parseQueueText('13:05\t박환자');
  assert.equal(p.name, '박환자');
  assert.equal(p.scheduled_time, '13:05');
});

test('시간 없는 줄', () => {
  assert.equal(parseQueueText('홍환자')[0].scheduled_time, null);
});

test('한 자리 시(時) 0 패딩', () => {
  assert.equal(parseQueueText('8:30 정환자')[0].scheduled_time, '08:30');
});

test('빈 줄은 무시', () => {
  assert.equal(parseQueueText('김환자\n\n   \n이환자').length, 2);
});
