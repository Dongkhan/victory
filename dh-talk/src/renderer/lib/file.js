// 파일 전송 보조 (renderer 전용).
export { MAX_FILE_BYTES } from '../../shared/limits.js';

// File/Blob → data URL ("data:image/png;base64,...")
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// data URL → { mime, base64 }
export function splitDataUrl(dataUrl) {
  const comma = String(dataUrl).indexOf(',');
  if (comma < 0) return { mime: '', base64: '' };
  const header = String(dataUrl).slice(5, comma); // "data:" 이후 ~ "," 이전
  return { mime: header.split(';')[0], base64: String(dataUrl).slice(comma + 1) };
}

export function isImageMime(mime) {
  return /^image\//.test(String(mime || ''));
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
