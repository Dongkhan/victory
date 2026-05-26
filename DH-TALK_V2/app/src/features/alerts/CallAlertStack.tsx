import { useEffect, useRef, useState } from 'react';
import type { CallAlert } from '../../domain/types';

interface CallAlertStackProps {
  alerts: CallAlert[];
  onClose: (id: string) => void;
  soundEnabled: boolean;
  onSoundEnabledChange: (enabled: boolean) => void;
  playCallAlertBeep?: () => Promise<void> | void;
}

export async function playCallAlertBeep() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.16);
  setTimeout(() => void context.close(), 250);
}

export function CallAlertStack({
  alerts,
  onClose,
  soundEnabled,
  onSoundEnabledChange,
  playCallAlertBeep: playBeep = playCallAlertBeep
}: CallAlertStackProps) {
  const [soundError, setSoundError] = useState<string | null>(null);
  const seenAlertIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newAlert = alerts.find((alert) => !seenAlertIds.current.has(alert.id));
    alerts.forEach((alert) => seenAlertIds.current.add(alert.id));
    if (!newAlert || !soundEnabled) return;
    Promise.resolve(playBeep()).catch(() => {
      setSoundError('브라우저 소리 권한이 차단되었습니다. 호출음 사용을 다시 눌러 권한을 확인하세요.');
    });
  }, [alerts, playBeep, soundEnabled]);

  if (alerts.length === 0) return null;

  return (
    <aside className="call-alert-stack" aria-live="assertive">
      <label className="sound-toggle">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(event) => {
            setSoundError(null);
            onSoundEnabledChange(event.target.checked);
          }}
        />
        호출음 사용
      </label>
      {soundError ? <p className="sync-error" role="alert">{soundError}</p> : null}
      {alerts.map((alert) => (
        <article className="call-alert" key={alert.id}>
          <p className="eyebrow">진료실 호출</p>
          <h3>{alert.body}</h3>
          <p>보낸 사람: {alert.sender}</p>
          <p>시간: {new Date(alert.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</p>
          <button type="button" onClick={() => onClose(alert.id)}>확인/닫기</button>
        </article>
      ))}
    </aside>
  );
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
