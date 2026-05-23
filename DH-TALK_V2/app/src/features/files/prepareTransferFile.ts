import type { TransferFileCard } from '../../domain/types';

const DEFAULT_EXPIRY_DAYS = 7;

export function createTransferFileCard(
  file: File,
  now = new Date(),
  createObjectUrl: (file: File) => string = (source) => URL.createObjectURL(source)
): TransferFileCard {
  const expiresAt = new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  return {
    id: `f-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    filename: file.name,
    sizeBytes: file.size,
    uploadedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    downloadUrl: createObjectUrl(file)
  };
}

export function getDownloadLabel(file: Pick<TransferFileCard, 'downloadUrl'>) {
  return file.downloadUrl ? '다운로드' : '업로드 대기';
}
