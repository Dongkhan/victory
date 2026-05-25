import type { ChangeEvent } from 'react';
import type { TransferFileCard } from '../../domain/types';
import { createTransferFileCard, getDownloadLabel } from './prepareTransferFile';
import { validateFile } from './validateFile';

interface FileTransferPanelProps {
  files: TransferFileCard[];
  onAddFile: (file: TransferFileCard) => void;
}

export function FileTransferPanel({ files, onAddFile }: FileTransferPanelProps) {
  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const validation = validateFile(file);
    if (!validation.valid) {
      window.alert(validation.reason);
      event.target.value = '';
      return;
    }
    onAddFile(createTransferFileCard(file));
    event.target.value = '';
  }

  return (
    <section className="panel file-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">이 PC 임시 첨부</p>
          <h2>로컬 파일 미리보기</h2>
          <p className="muted">선택한 파일은 이 브라우저에서만 object URL로 열립니다. 다른 PC로 자동 전송되지 않습니다.</p>
        </div>
        <label className="upload-button">
          파일 선택
          <input type="file" onChange={handleFile} />
        </label>
      </div>
      <div className="file-list">
        {files.length === 0 && <p className="muted">아직 임시 첨부된 파일이 없습니다.</p>}
        {files.map((file) => (
          <article className="file-card" key={file.id}>
            <strong>{file.filename}</strong>
            <span>{formatBytes(file.sizeBytes)}</span>
            <span>브라우저를 닫거나 새로고침하면 사라질 수 있습니다.</span>
            {file.downloadUrl ? (
              <a className="download-button" href={file.downloadUrl} download={file.filename}>
                {getDownloadLabel(file)}
              </a>
            ) : (
              <button type="button" disabled>{getDownloadLabel(file)}</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
