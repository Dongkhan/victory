// 펄스 알람 표시 여부 결정 (renderer 전용 순수 함수).

// 수신 메시지로 이 PC 가 펄스 알람을 띄워야 하는가.
//  - 자기가 보낸 메시지는 제외
//  - urgent: 전원
//  - next_patient: 원장 PC 만 (desk → doctor 호출이므로)
export function shouldPulse(msg, { me, role }) {
  if (!msg || !msg.alert_level || msg.sender === me) return false;
  if (msg.alert_level === 'urgent') return true;
  if (msg.alert_level === 'next_patient') return role === 'doctor';
  return false;
}

// 에스컬레이션(원장 60초 미확인) 시 데스크 PC 들이 대신 알림을 띄운다.
export function shouldPulseOnEscalate(msg, { me, role }) {
  if (!msg || msg.sender === me) return false;
  return role === 'desk';
}
