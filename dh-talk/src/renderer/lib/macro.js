// 매크로 텍스트 치환 + 핫키 매칭 (renderer 전용 순수 함수).

// "{patient} 님 들어오세요" + { patient: '김OO' } → "김OO 님 들어오세요".
// 정의되지 않은 변수는 그대로 둔다.
export function resolveMacroText(text, vars = {}) {
  return String(text ?? '').replace(/\{(\w+)\}/g, (whole, key) =>
    key in vars ? String(vars[key] ?? '') : whole,
  );
}

// 매크로 텍스트가 특정 변수({key})를 포함하는지.
export function macroTextNeeds(text, key) {
  return new RegExp(`\\{${key}\\}`).test(String(text ?? ''));
}

// "Ctrl+1" 같은 핫키 문자열과 keydown 이벤트 매칭.
// Mac 개발 편의를 위해 Ctrl 자리에 ⌘(meta)도 허용한다.
export function matchesHotkey(hotkey, event) {
  if (!hotkey) return false;
  const parts = hotkey.split('+').map((p) => p.trim().toLowerCase());
  const key = parts[parts.length - 1];
  const mods = parts.slice(0, -1);

  if (mods.includes('ctrl') !== (event.ctrlKey || event.metaKey)) return false;
  if (mods.includes('shift') !== event.shiftKey) return false;
  if (mods.includes('alt') !== event.altKey) return false;

  return String(event.key).toLowerCase() === key;
}
