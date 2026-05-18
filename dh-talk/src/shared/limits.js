export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_BASE64_CHARS = Math.ceil((MAX_FILE_BYTES * 4) / 3) + 16;
// 5MB 파일의 base64 본문과 JSON envelope 여유분. 서버 maxPayload와 검증 기준을 한 곳에서 관리한다.
export const MAX_WS_PAYLOAD_BYTES = MAX_FILE_BASE64_CHARS + 64 * 1024;
export const MAX_BODY_CHARS = 4000;
export const MAX_FILENAME_CHARS = 255;
