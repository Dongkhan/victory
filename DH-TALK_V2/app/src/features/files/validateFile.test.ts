import { describe, expect, it } from 'vitest';
import { validateFile } from './validateFile';

describe('validateFile', () => {
  it('allows safe document types', () => {
    expect(validateFile({ name: '의뢰서.hwpx', size: 1024 }).valid).toBe(true);
  });

  it('blocks executable files', () => {
    expect(validateFile({ name: 'setup.exe', size: 1024 }).valid).toBe(false);
  });

  it('blocks oversized files', () => {
    expect(validateFile({ name: 'scan.pdf', size: 21 * 1024 * 1024 }).valid).toBe(false);
  });
});
