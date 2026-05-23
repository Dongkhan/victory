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

  function sendTemplate(template: string) {
    const rendered = renderMacro(template, selectedPatient?.name);
    onSend(rendered);
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
            <button
              type="button"
              className="macro-send"
              style={{ background: macro.color }}
              onClick={() => sendTemplate(macro.template)}
              disabled={!selectedPatient}
            >
              {macro.title}
            </button>
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
