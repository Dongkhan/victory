# CLAUDE.md — DH Talk

> Claude Code 작업 컨텍스트 문서. 이 프로젝트에 처음 들어왔거나 새 세션을 시작할 때 가장 먼저 읽을 것.

---

## 0. 프로젝트 한 줄 요약

**DH Talk** — 동행 정신건강의학과의원(김포, 1인 클리닉)의 원장 ↔ 데스크 간 LAN 메신저. Electron + Node.js + SQLite. Mac에서 개발, Windows ×4에 배포.

---

## 1. 사용자(현석) 컨텍스트

- **역할:** 1인 클리닉 원장. 정신과 외래.
- **개발 환경:** Mac (`dongkan` user, `~/Desktop/DK/dh-talk/`)
- **실사용 환경:** Windows ×4 (데스크 PC ×3 + 원장실 PC ×1), 원장 휴대폰은 원장 PC 미러링
- **GitHub:** `Dongkhan/victory` ← 이 프로젝트가 푸시될 repo
- **요청 톤:** peer-level, 간결, 직답. 일반적 면책조항 불필요. 한국어 informal 톤.
- **워크/세션 중단 금지:** 현석이 직접 요청하지 않는 한 "쉬어가자/잠시 멈추자" 류의 제안 절대 하지 말 것.

---

## 2. 프로젝트 의도 (이게 왜 만들어지는가)

기존 클리닉 메신저(카카오톡/사내 카톡/일반 사내 메신저)의 문제점:
1. **매크로가 불편하다** — 자주 쓰는 문장 등록/호출이 어색
2. **"다음 환자" 알람이 묻힌다** — 일반 채팅 알림과 시각적으로 동급이라 원장이 진료 중 놓침
3. **파일 전송이 번거롭다** — 보험 서류 스캔본을 진료실로 보내는 게 클릭 여러 번
4. **외부 클라우드 경유** — 환자명 등 PHI가 외부로 흘러감

DH Talk의 해법:
- 매크로 10개를 그리드 버튼 + `Ctrl+1~9` 핫키로 원클릭 호출
- "다음 환자" 메시지는 **별도 펄스 알람창** (always-on-top, non-focusable) — 진료 작업 방해 없이 시각적 강조
- 드래그앤드롭 + 클립보드 붙여넣기로 파일 전송
- LAN 내부 통신, PHI 외부 유출 최소화 (Telegram 미러는 선택적 옵트인)

---

## 3. 기술 스택 (확정)

| 영역 | 선택 |
|---|---|
| 데스크탑 셸 | Electron |
| UI | React + Vite |
| Main process | Node.js |
| 통신 | WebSocket (`ws`) over LAN |
| DB | SQLite (`better-sqlite3`) + FTS5 (한글 `unicode61` tokenizer) |
| 설정 | YAML (`yaml` 패키지), `chokidar` 핫리로드 |
| 빌드 | electron-builder (Windows NSIS 타깃) |
| 미러링 | Hermes VPS (`76.13.179.163:8090`) 경유 Telegram |

**금지 사항:**
- 외부 클라우드 채팅 SDK 사용 금지 (PHI 이유)
- HTML5 localStorage/sessionStorage 사용 금지 — 모든 상태는 SQLite로
- 메시지 본문에 환자명을 마스킹하지 말 것 (현석 결정: 풀네임 사용)
- 슬랙 미러링은 v1 범위 외 (v2로 미룸)

---

## 4. 아키텍처

```
              ┌──── 데스크1 PC (Windows) ─────┐
              │  DH Talk (서버 + 클라이언트) │ ← WebSocket 서버 호스팅
              │  SQLite + 첨부파일 저장      │
              └──────────────┬───────────────┘
                             │
              ┌──────────────┼──────────────┐
              │ LAN (192.168.x.x) WebSocket │
              │                              │
   ┌──────────┴────┐  ┌─────┴─────┐  ┌─────┴─────┐
   │ 데스크2 PC    │  │ 데스크3 PC │  │ 원장 PC  │
   │ 클라이언트    │  │ 클라이언트 │  │ 클라이언트│
   └───────────────┘  └───────────┘  └──────┬───┘
                                            │
                                  휴대폰 미러링 (KVM/원격)

   메시지 발생 시 → (선택) Hermes VPS 경유 Telegram 알림
```

**서버 선택 이유:** 데스크1 PC가 가장 안정적으로 켜져있음. 별도 서버 머신 없이 데스크1이 dual role.

---

## 5. 폴더 구조

```
dh-talk/
├── package.json
├── electron-builder.yml
├── README.md
├── CLAUDE.md                    ← 이 문서
├── .gitignore                   ← data/, node_modules/, dist/ 제외
│
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.js             # 앱 진입점, BrowserWindow 생성
│   │   ├── server.js            # WebSocket 서버 (데스크1만 실행)
│   │   ├── db.js                # SQLite + FTS5 + 마이그레이션
│   │   ├── cleanup.js           # 30일 자동 삭제 cron
│   │   ├── hermes-mirror.js     # Telegram 미러링 HTTP 클라이언트
│   │   ├── queue-parser.js      # 환자 명단 붙여넣기 파서
│   │   └── ipc.js               # renderer ↔ main IPC 핸들러
│   │
│   ├── renderer/                # UI
│   │   ├── index.html
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── MacroGrid.jsx
│   │   │   ├── PatientQueue.jsx
│   │   │   ├── ChatPane.jsx
│   │   │   ├── AlertPulse.jsx       # 별도 BrowserWindow
│   │   │   ├── SearchBar.jsx
│   │   │   └── FileDropZone.jsx
│   │   └── styles.css
│   │
│   └── shared/
│       └── types.js
│
├── config/                      # 사용자 편집 영역 (메모장으로도 가능)
│   ├── macros.yaml              # 매크로 10개
│   ├── settings.yaml            # 서버 IP, Hermes URL, 알람 옵션
│   └── users.yaml               # desk1/desk2/desk3/doctor 식별
│
├── data/                        # 런타임 (gitignore)
│   ├── messages.db
│   ├── attachments/
│   │   └── YYYY-MM-DD/
│   └── logs/
│
└── scripts/
    ├── dev.sh
    ├── build-windows.sh
    └── deploy-checklist.md
```

---

## 6. 핵심 데이터 모델

### SQLite 스키마

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,                  -- unix ms
  sender TEXT NOT NULL,                 -- 'desk1' | 'desk2' | 'desk3' | 'doctor'
  recipient TEXT NOT NULL,              -- 'all' | 'doctor' | 'desk1' ...
  type TEXT NOT NULL,                   -- 'text' | 'file' | 'macro' | 'system'
  body TEXT,
  patient_name TEXT,                    -- 매크로의 {patient} 치환값
  attachment_path TEXT,                 -- data/attachments/... 상대경로
  alert_level TEXT,                     -- NULL | 'next_patient' | 'urgent'
  acknowledged_at INTEGER,              -- 펄스 알람 확인 시각
  mirrored_to TEXT                      -- JSON array, e.g. '["telegram"]'
);

CREATE INDEX idx_messages_ts ON messages(ts);
CREATE INDEX idx_messages_patient ON messages(patient_name);

-- FTS5 (한글 검색)
CREATE VIRTUAL TABLE messages_fts USING fts5(
  body, patient_name, sender,
  content='messages', content_rowid='id',
  tokenize='unicode61'
);

-- 동기화 트리거 (INSERT/UPDATE/DELETE)
CREATE TRIGGER messages_ai AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid, body, patient_name, sender)
  VALUES (new.id, new.body, new.patient_name, new.sender);
END;
-- (delete, update 트리거도 동일 패턴)

CREATE TABLE patients_today (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  scheduled_time TEXT,                  -- 'HH:MM' or NULL
  status TEXT NOT NULL,                 -- 'waiting' | 'current' | 'done'
  is_walkin INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 메시지 객체 (WebSocket 페이로드)

```javascript
{
  ts: 1716000000000,
  sender: 'desk1',
  recipient: 'doctor',
  type: 'macro',
  body: '김OO 님 들어오세요',
  patient_name: '김OO',
  alert_level: 'next_patient',
  attachment_path: null,
  mirror_to: ['telegram']
}
```

---

## 7. 매크로 시스템

### `config/macros.yaml` (사용자 편집)

```yaml
macros:
  - id: call_next
    label: "다음 환자"
    color: "#06b6d4"
    hotkey: "Ctrl+1"
    alert_level: "next_patient"     # 수신측에서 펄스 알람 트리거
    text: "{patient} 님 들어오세요"
    action_after: "advance_queue"   # 큐에서 current → done, 다음 waiting → current
    mirror_to: ["telegram"]

  - id: hold_5min
    label: "5분 대기"
    color: "#f59e0b"
    hotkey: "Ctrl+2"
    text: "잠시 5분만 대기 부탁드립니다"

  # ... 총 10개. 나머지는 현석과 인터뷰 후 채움
```

### 치환 변수

- `{patient}` → 현재 큐에서 `status='current'`인 환자의 `name`. 없으면 빈 문자열 또는 placeholder 모달 띄움.
- v1 범위 내 다른 변수 없음. `{time}`, `{wait_count}` 등은 v2.

### 핫키 정책

- **In-app shortcut만** 사용 (`globalShortcut` 금지). DH Talk 창이 포커스됐을 때만 동작.
- 이유: 데스크가 EMR 작업 중 실수로 매크로 전송되는 사고 방지.

---

## 8. 펄스 알람 (가장 중요한 차별점)

### 동작 규칙

1. 수신 메시지의 `alert_level === 'next_patient'`이면 별도 `BrowserWindow` 띄움
2. 위치: 우상단, 크기 320×120
3. `setAlwaysOnTop('floating')` + `setFocusable(false)` + `setSkipTaskbar(true)`
4. 다른 창의 포커스/입력을 절대 가로채지 않음
5. CSS animation: 청록색 배경이 3초 주기로 호흡 (opacity 0.7 ↔ 1.0)
6. "확인" 버튼 클릭 시 ack 메시지 송신, 창 닫힘
7. 30초 미확인 시 작은 사운드 (Web Audio API, 짧은 "딩")
8. 60초 미확인 시 같은 메시지를 다른 데스크 PC로 자동 에스컬레이션

### `alert_level: 'urgent'`

- 풀스크린 플래시 + 더 큰 사운드
- v1에서는 매크로 하나만 (긴급 호출) urgent 사용

---

## 9. 환자 큐 (좌측 사이드바)

### 입력 방식 2가지

**A. 아침 일괄 붙여넣기 (메인 워크플로우)**
- "명단 붙여넣기" 버튼 → 모달 → textarea
- 한 줄에 한 명. 다음 형식 모두 파싱:
  - `09:00 김OO`
  - `김OO 09:00`
  - `09:00\t김OO`
  - `김OO` (시간 없음)
- 파서는 `src/main/queue-parser.js`

**B. 워크인 추가 (그때그때)**
- 사이드바 하단 `[+ 환자 추가]` 버튼 → 인라인 입력 → Enter
- `is_walkin=1`로 저장

### 상태 머신

```
waiting ─(advance_queue 액션)─→ current ─(다음 advance)─→ done
```

매 시점 `current`는 0개 또는 1개. `advance_queue` 액션:
1. 기존 `current` → `done` (`updated_at` 갱신)
2. `waiting` 중 가장 빠른 `scheduled_time` → `current`
3. 모두 `done`이면 no-op + 알림

### 자정 리셋

- 매일 00:00 KST에 `patients_today` 테이블 비움 (또는 `archive_patients` 테이블로 이동 — v2)
- 진행 중 환자(`current`/`waiting`)도 모두 삭제. 다음날 아침 다시 붙여넣기.

---

## 10. 파일 전송

- 드래그앤드롭: `FileDropZone.jsx`에서 `ondrop` 핸들
- 클립보드 이미지: 입력창에서 `Ctrl+V` → `clipboard.readImage()` → PNG 변환 → 임시 파일 저장 → 전송
- 저장 경로: `data/attachments/YYYY-MM-DD/HH-mm_<sender>_<filename>`
- 파일 자체는 WebSocket binary frame으로 전송 (5MB 이하). 5MB 초과 시 SMB 공유 폴더 fallback 또는 에러.

**Windows 배포 시:** 첨부 저장 경로는 `%USERPROFILE%\Documents\DH Talk\attachments\` 권장. Mac 개발 중엔 프로젝트 폴더 내 `data/`.

---

## 11. 30일 보관 정책

- 매일 02:00 KST cron (`node-cron` 또는 `setTimeout` 자체 구현)
- `messages` 테이블: `ts < (now - 30일)` 행 삭제
- `attachments/YYYY-MM-DD/` 폴더: 30일 지난 폴더 통째로 삭제
- FTS5 인덱스는 트리거로 자동 동기화됨
- 삭제는 영구. 백업/아카이브 없음 (현석 결정).

---

## 12. Hermes 미러링

### 클라이언트 (DH Talk 측)

```javascript
// src/main/hermes-mirror.js
import fetch from 'node-fetch';

const HERMES_URL = process.env.HERMES_URL || 'http://76.13.179.163:8090';
const API_KEY = process.env.DHTALK_API_KEY;

export async function mirror(message) {
  if (!message.mirror_to?.includes('telegram')) return;

  try {
    await fetch(`${HERMES_URL}/dhtalk/relay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        sender: message.sender,
        body: message.body,
        patient_name: message.patient_name,
        alert_level: message.alert_level,
        ts: message.ts,
      }),
      timeout: 5000,
    });
  } catch (err) {
    // 미러링 실패는 메인 메시지 흐름을 막지 않음. 로그만.
    console.error('[hermes-mirror]', err.message);
  }
}
```

### 서버 (VPS 측 — 별도 작업)

`/docker/hermes-agent-lgoz/data/health_server.py`에 `/dhtalk/relay` 엔드포인트 추가 필요. 현석이 별도 세션에서 작업할 예정.

**필요 환경변수:**
- `DHTALK_API_KEY` (양쪽 동일 값)

---

## 13. 작업 규칙 (Claude Code가 지킬 것)

### DK 폴더 작업 공통 규칙

- 메인 작업 디렉토리: `~/Desktop/DK/dh-talk/` (Mac 기준)
- 커밋 전 `npm run lint` (있으면) + 수동 동작 확인
- 한글 파일명/경로 OK (Mac/Windows 둘 다 유니코드 지원)
- 외부 패키지 설치 시 항상 `npm install --save` 또는 `--save-dev`로 `package.json` 기록

### 코드 스타일

- ESM (`import`/`export`) 사용. CommonJS는 불가피한 경우만.
- 비동기는 `async`/`await` 일관 사용. `.then()` 체이닝 금지.
- 에러는 삼키지 말고 최소 `console.error`로 로그. Hermes 미러링 등 비핵심 경로만 silent fail 허용.
- 한국어 주석/UI 텍스트 자유 사용. 변수명/함수명은 영문.

### 보안

- 환자명 풀네임은 LAN 메시지에 OK. 단 로그 파일에는 마스킹 (`김OO`) 권장.
- API 키는 `.env` 파일에 두고 `.gitignore`에 포함.
- `data/` 폴더 전체 `.gitignore`.

### 커밋 메시지

- 한국어 OK, prefix는 영문: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- 예: `feat: 펄스 알람 컴포넌트 추가`, `fix: 환자 큐 파서 시간 정규식 수정`

---

## 14. GitHub 저장 (작업 완료 시)

이 프로젝트는 **`Dongkhan/victory`** repo에 저장한다.

### 초기 push (최초 1회)

```bash
cd ~/Desktop/DK/dh-talk

# .gitignore 확인 후
git init
git add .
git commit -m "feat: DH Talk 초기 골격 (Day 1)"

git branch -M main
git remote add origin https://github.com/Dongkhan/victory.git
git push -u origin main
```

만약 `victory` repo가 이미 다른 내용을 담고 있다면:
- 새 브랜치 `dh-talk`로 푸시: `git checkout -b dh-talk && git push -u origin dh-talk`
- 또는 현석에게 확인 후 진행

### 작업 단위 push

- 의미 있는 작업 마디(Day 단위 또는 기능 단위)마다 commit + push
- 푸시 전에 `git status`로 의도치 않은 파일(data/, .env 등) 포함 여부 반드시 확인
- 푸시 후 현석에게 "GitHub `victory` repo에 `<커밋 메시지>` 푸시 완료" 보고

### `.gitignore` 필수 항목

```
node_modules/
dist/
data/
*.log
.env
.env.local
.DS_Store
Thumbs.db
*.db
*.db-journal
```

---

## 15. 개발 로드맵 (7일 MVP)

| Day | 작업 | 검증 |
|---|---|---|
| 1 | 프로젝트 셋업, Electron + Vite + React 부팅, WebSocket echo | `npm run dev`로 창 뜨고 echo 확인 |
| 2 | SQLite + FTS5 스키마, macros.yaml 로더, MacroGrid UI | 매크로 버튼 10개 렌더, 클릭 시 콘솔 로그 |
| 3 | PatientQueue + 파서 + advance 로직 | 명단 붙여넣기 → 큐 표시 → advance 동작 |
| 4 | 메시지 송수신 + `{patient}` 치환 + ChatPane + 핫키 | 데스크1 ↔ 원장 PC 메시지 왕복 |
| 5 | AlertPulse 별도 BrowserWindow, 펄스/ack/에스컬레이션 | 다음 환자 매크로 → 펄스 알람 표시 → 확인 |
| 6 | 파일 드래그앤드롭/클립보드, 검색 UI, 30일 cleanup | 이미지 붙여넣기 전송, 한글 검색 동작 |
| 7 | Hermes 미러링, Windows 빌드, 데스크1 설치 테스트 | 텔레그램 알림 수신, `.exe` 설치/실행 |

각 Day 끝나면 git commit + `victory` push.

---

## 16. v2 백로그 (지금 만들지 말 것)

- 슬랙 미러링
- 슬래시 커맨드 (`/`)
- 매크로 변수 확장 (`{time}`, `{wait_count}`)
- 메시지 아카이브 (30일 후 압축 보관)
- 진료실 상태 토글 (진료중/대기/식사/외출)
- EMR OCR 연동
- 음성 알람 (TTS로 "다음 환자 들어오세요" 자동 재생)
- 모바일 클라이언트 (Electron 아닌 별도 RN/PWA)

v1 작업 중 이런 기능 떠올라도 **추가하지 말고** 이 섹션에 메모만 남길 것.

---

## 17. 시작 명령

새 세션에서 작업 시작할 때:

```bash
cd ~/Desktop/DK/dh-talk
cat CLAUDE.md          # 이 문서 다시 한 번
git status             # 어디까지 했는지
git log --oneline -10  # 최근 커밋
```

작업 시작 전 현석에게 "Day N 작업 시작합니다, 목표: ..." 한 줄 보고.
작업 끝나면 "Day N 완료, 커밋: ..., victory repo 푸시 완료" 보고.

---

## 18. 막혔을 때

- Electron 알람 동작이 macOS와 Windows에서 다르면 → Windows 동작 우선 (실사용 환경)
- `better-sqlite3` 네이티브 빌드 실패 → `electron-rebuild` 또는 `@electron/rebuild` 시도, 안되면 현석에게 보고
- 한글 폰트 깨짐 → Pretendard (MIT 라이선스) 번들
- 매크로 사용성 의문 (텍스트/색상/핫키) → 현석에게 질문, 임의 결정 금지
- 기능 범위 의문 (v1 vs v2) → 위 16번 백로그 참조, 의심되면 v2로 미룸
