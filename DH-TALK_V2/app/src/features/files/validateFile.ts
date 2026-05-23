const allowedExtensions = new Set(['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx', 'hwp', 'hwpx']);
const blockedExtensions = new Set(['exe', 'bat', 'cmd', 'msi', 'zip']);
const maxBytes = 20 * 1024 * 1024;

export interface FileValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateFile(file: Pick<File, 'name' | 'size'>): FileValidationResult {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (file.size > maxBytes) {
    return { valid: false, reason: '20MB 이하 파일만 전송할 수 있습니다.' };
  }
  if (blockedExtensions.has(extension)) {
    return { valid: false, reason: '실행/압축 파일은 전송하지 않습니다.' };
  }
  if (!allowedExtensions.has(extension)) {
    return { valid: false, reason: 'PDF, 이미지, 문서 파일만 전송할 수 있습니다.' };
  }
  return { valid: true };
}
