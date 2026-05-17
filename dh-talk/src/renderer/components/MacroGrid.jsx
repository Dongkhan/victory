// 매크로 그리드 — config/macros.yaml 의 매크로를 버튼으로 렌더.
export default function MacroGrid({ macros, onTrigger }) {
  if (!macros.length) {
    return (
      <p className="macrogrid__empty">
        config/macros.yaml 에 매크로가 없습니다.
      </p>
    );
  }

  return (
    <div className="macrogrid">
      {macros.map((macro) => (
        <button
          key={macro.id}
          type="button"
          className="macro"
          style={{ '--macro-color': macro.color || '#06b6d4' }}
          title={macro.text}
          onClick={() => onTrigger(macro)}
        >
          <span className="macro__label">{macro.label}</span>
          {macro.hotkey && <span className="macro__hotkey">{macro.hotkey}</span>}
        </button>
      ))}
    </div>
  );
}
