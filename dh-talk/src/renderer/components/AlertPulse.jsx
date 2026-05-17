import { useEffect, useRef, useState } from 'react';

const DING_AFTER_MS = 30_000; // 30초 미확인 → 사운드
const ESCALATE_AFTER_MS = 60_000; // 60초 미확인 → 에스컬레이션

// 짧은 "딩" — Web Audio API 로 합성 (별도 음원 파일 불필요).
function playDing(urgent) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = urgent ? 1320 : 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(urgent ? 0.5 : 0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (urgent ? 0.9 : 0.5));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (urgent ? 0.9 : 0.5));
  } catch (err) {
    console.error('[alert] 사운드 재생 실패:', err.message);
  }
}

export default function AlertPulse() {
  const [msg, setMsg] = useState(null);
  const dingRef = useRef(null);
  const escalateRef = useRef(null);

  useEffect(() => window.dhtalkAlert.onData((next) => setMsg(next)), []);

  useEffect(() => {
    if (!msg) return undefined;
    const urgent = msg.alert_level === 'urgent';
    dingRef.current = setTimeout(() => playDing(urgent), DING_AFTER_MS);
    escalateRef.current = setTimeout(() => window.dhtalkAlert.escalate(msg), ESCALATE_AFTER_MS);
    return () => {
      clearTimeout(dingRef.current);
      clearTimeout(escalateRef.current);
    };
  }, [msg]);

  if (!msg) return null;

  const urgent = msg.alert_level === 'urgent';

  const ack = () => {
    clearTimeout(dingRef.current);
    clearTimeout(escalateRef.current);
    window.dhtalkAlert.ack(msg);
  };

  return (
    <div className={`pulse ${urgent ? 'pulse--urgent' : ''}`}>
      <div className="pulse__text">
        <span className="pulse__tag">{urgent ? '긴급 호출' : '다음 환자'}</span>
        <span className="pulse__body">{msg.body}</span>
      </div>
      <button type="button" className="pulse__ack" onClick={ack}>
        확인
      </button>
    </div>
  );
}
