// 환자 명단 붙여넣기 파서 (CLAUDE.md §9).
// 한 줄에 한 명. 시간은 이름 앞/뒤 어디에 와도 되고 구분자는 공백/탭 무관.
//   "09:00 김OO" · "김OO 09:00" · "09:00\t김OO" · "김OO"(시간 없음)

const TIME_RE = /\b(\d{1,2}):(\d{2})\b/;

export function parseQueueText(text) {
  const patients = [];

  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const match = line.match(TIME_RE);
    let scheduledTime = null;
    let name = line;

    if (match) {
      scheduledTime = `${match[1].padStart(2, '0')}:${match[2]}`;
      name = (line.slice(0, match.index) + line.slice(match.index + match[0].length)).trim();
    }

    if (!name) continue; // 시간만 있고 이름이 없는 줄은 건너뜀
    patients.push({ name, scheduled_time: scheduledTime });
  }

  return patients;
}
