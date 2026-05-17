// main / renderer 양쪽에서 공유하는 상수와 타입.

// WebSocket 서버 포트. v1 echo 단계에서는 고정값.
// 추후 config/settings.yaml 의 server.ws_port 로 오버라이드 예정.
export const WS_PORT = 8123;

// messages.type 값 (CLAUDE.md §6)
export const MessageType = Object.freeze({
  TEXT: 'text',
  FILE: 'file',
  MACRO: 'macro',
  SYSTEM: 'system',
});

// messages.alert_level 값
export const AlertLevel = Object.freeze({
  NEXT_PATIENT: 'next_patient',
  URGENT: 'urgent',
});
