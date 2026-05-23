import type { CallAlert } from '../../domain/types';

interface CallAlertStackProps {
  alerts: CallAlert[];
  onClose: (id: string) => void;
  soundEnabled: boolean;
  onSoundEnabledChange: (enabled: boolean) => void;
}

export function CallAlertStack({ alerts, onClose, soundEnabled, onSoundEnabledChange }: CallAlertStackProps) {
  if (alerts.length === 0) return null;

  return (
    <aside className="call-alert-stack" aria-live="assertive">
      <label className="sound-toggle">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(event) => onSoundEnabledChange(event.target.checked)}
        />
        호출음 사용
      </label>
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
