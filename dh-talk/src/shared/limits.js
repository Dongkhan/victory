// 파일 전송 크기 한도 — server / validate / renderer 가 같은 기준을 공유한다
// (개선분석 2차 6순위 — payload/file size 상수 통합).

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

// base64 는 원본의 약 4/3 + 패딩
export const MAX_FILE_B64 = Math.ceil((MAX_FILE_BYTES * 4) / 3) + 16;

// WebSocket maxPayload — base64 + JSON 봉투(메타 필드) 여유분
export const WS_MAX_PAYLOAD = MAX_FILE_B64 + 64 * 1024;
