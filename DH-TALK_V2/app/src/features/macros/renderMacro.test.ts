import { describe, expect, it } from 'vitest';
import { renderMacro } from './renderMacro';

describe('renderMacro', () => {
  it('replaces patient name variable', () => {
    expect(renderMacro('{name}님 들어오세요.', '홍길동')).toBe('홍길동님 들어오세요.');
  });

  it('requires selected patient', () => {
    expect(() => renderMacro('{name}님 들어오세요.')).toThrow('환자를 먼저 선택해야 합니다.');
  });
});
