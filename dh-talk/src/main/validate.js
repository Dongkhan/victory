// 수신 메시지 스키마 검증 (개선분석 8순위).
// 인증된 클라이언트라도 잘못된/위험한 페이로드는 거부한다.

const MESSAGE_TYPES = new Set(['text', 'macro', 'system']);
const ALERT_LEVELS = new Set(['next_patient', 'urgent']);
const MIRROR_TARGETS = new Set(['telegram']);

// 실행 가능 파일 등 위험 확장자 차단 (의원 특성상 hwp/docx/pdf/이미지는 허용).
const BLOCKED_EXT = new Set([
  'exe', 'bat', 'cmd', 'com', 'scr', 'msi', 'vbs', 'vbe', 'js', 'jse',
  'ws', 'wsf', 'wsh', 'ps1', 'jar', 'lnk', 'reg', 'dll', 'cpl', 'hta', 'pif',
]);

const MAX_BODY = 4000;
const MAX_FILENAME = 255;
// 5MB 파일의 base64 길이 상한 (+여유)
const MAX_FILE_B64 = Math.ceil((5 * 1024 * 1024 * 4) / 3) + 16;

export function validateInbound(msg) {
  if (!msg || typeof msg !== 'object') return { ok: false, reason: '형식 오류' };

  switch (msg.kind) {
    case 'message': {
      if (!MESSAGE_TYPES.has(msg.type)) return { ok: false, reason: `type 오류: ${msg.type}` };
      if (msg.alert_level != null && !ALERT_LEVELS.has(msg.alert_level)) {
        return { ok: false, reason: `alert_level 오류: ${msg.alert_level}` };
      }
      if (typeof msg.body !== 'string' || !msg.body) return { ok: false, reason: 'body 없음' };
      if (msg.body.length > MAX_BODY) return { ok: false, reason: 'body 길이 초과' };
      if (msg.mirror_to != null) {
        if (!Array.isArray(msg.mirror_to)) return { ok: false, reason: 'mirror_to 형식 오류' };
        if (!msg.mirror_to.every((t) => MIRROR_TARGETS.has(t))) {
          return { ok: false, reason: 'mirror_to 대상 오류' };
        }
      }
      return { ok: true };
    }

    case 'file': {
      if (typeof msg.filename !== 'string' || !msg.filename) {
        return { ok: false, reason: 'filename 없음' };
      }
      if (msg.filename.length > MAX_FILENAME) return { ok: false, reason: 'filename 길이 초과' };
      const ext = msg.filename.includes('.') ? msg.filename.split('.').pop().toLowerCase() : '';
      if (BLOCKED_EXT.has(ext)) return { ok: false, reason: `차단된 파일 형식: .${ext}` };
      if (typeof msg.dataBase64 !== 'string' || !msg.dataBase64) {
        return { ok: false, reason: '파일 데이터 없음' };
      }
      if (msg.dataBase64.length > MAX_FILE_B64) return { ok: false, reason: '파일 5MB 초과' };
      return { ok: true };
    }

    case 'ack':
    case 'escalate': {
      if (!Number.isInteger(msg.id) || msg.id <= 0) return { ok: false, reason: 'id 오류' };
      return { ok: true };
    }

    default:
      return { ok: false, reason: `알 수 없는 kind: ${msg.kind}` };
  }
}
