import type { MacroTemplate, TodayPatient } from '../../domain/types';
import { renderMacro } from './renderMacro';

interface MacroPanelProps {
  selectedPatient?: TodayPatient;
  macros: MacroTemplate[];
  directMessage: string;
  onDirectMessageChange: (value: string) => void;
  onSend: (body: string) => void;
  onAddMacro: () => void;
  onUpdateMacro: (id: string, patch: Partial<MacroTemplate>) => void;
  onDeleteMacro: (id: string) => void;
}

export function MacroPanel({
  selectedPatient,
  macros,
  directMessage,
  onDirectMessageChange,
  onSend,
  onAddMacro,
  onUpdateMacro,
  onDeleteMacro
}: MacroPanelProps) {
  const sortedMacros = [...macros].sort((a, b) => a.sortOrder - b.sortOrder);

  function renderTemplate(template: string) {
    return renderMacro(template, selectedPatient?.name);
  }

  function sendTemplate(template: string) {
    onSend(renderTemplate(template));
  }

  function applyTemplate(template: string) {
    onDirectMessageChange(renderTemplate(template));
  }

  return (
    <section className="panel macro-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">현재 선택</p>
          <h2>{selectedPatient ? selectedPatient.name : '환자를 선택하세요'}</h2>
        </div>
        <button type="button" onClick={onAddMacro}>매크로 추가</button>
      </div>

      <div className="macro-grid">
        {sortedMacros.map((macro) => (
          <article className="macro-card" key={macro.id} style={{ borderColor: macro.color }}>
            <div className="macro-actions">
              <button
                type="button"
                className="macro-send"
                style={{ background: macro.color }}
                onClick={() => applyTemplate(macro.template)}
                disabled={!selectedPatient}
                aria-label={`문구 넣기: ${macro.title}`}
              >
                {macro.title}
              </button>
              <button
                type="button"
                className="macro-quick-send"
                onClick={() => sendTemplate(macro.template)}
                disabled={!selectedPatient}
                aria-label={`바로 보내기: ${macro.title}`}
              >
                바로
              </button>
            </div>
            <p>{selectedPatient ? renderMacro(macro.template, selectedPatient.name) : macro.template}</p>
            <details>
              <summary>수정</summary>
              <input
                value={macro.title}
                onChange={(event) => onUpdateMacro(macro.id, { title: event.target.value })}
                aria-label="매크로 제목"
              />
              <textarea
                value={macro.template}
                onChange={(event) => onUpdateMacro(macro.id, { template: event.target.value })}
                aria-label="매크로 문구"
              />
              <input
                type="color"
                value={macro.color}
                onChange={(event) => onUpdateMacro(macro.id, { color: event.target.value })}
                aria-label="매크로 색상"
              />
              <button type="button" className="danger" onClick={() => onDeleteMacro(macro.id)}>삭제</button>
            </details>
          </article>
        ))}
      </div>

      <label className="direct-message">
        직접 입력
        <textarea
          value={directMessage}
          onChange={(event) => onDirectMessageChange(event.target.value)}
          placeholder="{name} 변수를 사용할 수 있습니다."
        />
      </label>
      <button
        type="button"
        className="primary full"
        onClick={() => sendTemplate(directMessage)}
        disabled={!selectedPatient || !directMessage.trim()}
      >
        메시지 보내기
      </button>
    </section>
  );
}
