import { describe, expect, it } from 'vitest';
import { createTransferFileCard, getDownloadLabel } from './prepareTransferFile';

describe('prepareTransferFile', () => {
  it('creates a transfer card with a browser download URL for local-mode files', () => {
    const file = new File(['hello'], '안내문.txt', { type: 'text/plain' });
    const now = new Date('2026-05-23T00:00:00.000Z');

    const card = createTransferFileCard(file, now, () => 'blob:local-download-url');

    expect(card).toMatchObject({
      filename: '안내문.txt',
      sizeBytes: 5,
      uploadedAt: '2026-05-23T00:00:00.000Z',
      expiresAt: '2026-05-30T00:00:00.000Z',
      downloadUrl: 'blob:local-download-url'
    });
    expect(card.id).toMatch(/^f-/);
  });

  it('distinguishes ready downloads from metadata-only transfer records', () => {
    expect(getDownloadLabel({ downloadUrl: 'blob:ready' })).toBe('다운로드');
    expect(getDownloadLabel({ downloadUrl: undefined })).toBe('업로드 대기');
  });
});
