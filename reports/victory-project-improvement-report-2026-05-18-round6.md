# Victory 프로젝트 추가 개선점 분석 보고서 — Round 6

작성일: 2026-05-18 09:45 UTC
대상 repo: `/opt/data/victory`
검토 branch/commit: `hermes/fix-victory-improvements` / `358785d`
목적: Round 5 패치 이후 다시 QA, 브라우저 스모크, 원격 브랜치 diff, 핵심 코드 경로를 확인해 아직 남은 개선점을 재분류

## 0. 결론

Round 5에서 지적한 즉시 위험 항목은 대부분 닫혔다.

- DH Talk Hermes 미러링: 기본 HTTP URL 제거, `HERMES_URL` 명시 설정 없으면 비활성화, HTTPS만 허용.
- CBT-I Care v0.3: 모바일 확대 제한 제거, 수면일기 label-control 연결, 위기 persistent banner, OSA 보수적 diary hint 반영.
- Index/QA: 한국어 lang, mobile viewport, Relax/CBT-I 링크 및 안전 문자열 45개 QA로 고정.

현재 남은 핵심 리스크는 “기본 테스트 실패”가 아니라 의원 4대 PC 실제 운영에서 드러날 **분산 상태, 연결 복구, 서버 권위성, 실행형 QA 부족**이다.

## 1. 검증 로그

| 항목 | 결과 |
|---|---|
| `git fetch origin --prune` | 완료 |
| `git status --short --branch` | clean, `hermes/fix-victory-improvements...origin/hermes/fix-victory-improvements` |
| 현재 HEAD | `358785d fix: close victory round 5 safety gaps` |
| `node scripts/qa-prototypes.mjs` | 45/45 pass |
| `cd dh-talk && npm test` | 41/41 pass |
| `cd dh-talk && npm run build` | pass |
| `cd dh-talk && npm audit --audit-level=high --omit=dev` | 0 vulnerabilities |
| 브라우저 index smoke | title/lang/main/viewport 확인, console error 없음 |
| 브라우저 CBT-I v0.3 smoke | viewport 확대 가능, diary labels 연결, `homeCrisisBanner` 존재 확인 |
| 브라우저 Relax v0.5 smoke | 앱 렌더 성공, console error 없음. 단 실제 DOM viewport에 확대 제한 잔존 확인 |

## 2. 원격 브랜치 판정

최근 원격 브랜치 재확인 결과:

- `origin/hermes/fix-victory-improvements`: 현재 후보 브랜치, 가장 최신 통합본.
- `origin/claude/polish-relax-routine-WeWLu`: Relax 관련 보완 아이디어가 있으나 현재 후보 대비 DH Talk 보안/테스트/CBT-I v0.3/report/QA 파일을 대량 삭제하는 collateral diff 포함.
- `origin/claude/setup-electron-foundation-f66H8`: Electron 안정화 일부 아이디어가 있으나 현재 후보에 HMAC/검증/진단/테스트가 더 넓게 반영됨.
- `origin/claude/improve-cbti-mobile-ui-thWxf`: CBT-I v0.3 기반이나 현재 후보가 더 최신.

판정: 다른 agent 브랜치는 blanket merge 금지. 필요한 아이디어만 선별 port가 맞다.

## 3. 남은 개선점

### 3.1 P0 — DH Talk escalte payload 서버 권위성 부족

**근거**

- `dh-talk/src/renderer/App.jsx` line 155-156: 알람 창 escalte 요청 시 `{ kind: 'escalate', id: m.id, original: m }`를 renderer가 전송.
- `dh-talk/src/main/server.js` line 127-128: 서버가 `broadcast({ ...msg, kind: 'escalate', by: socket.userId })`로 클라이언트 제공 `original`을 그대로 전파.
- `validateInbound`는 escalate의 `id`만 양의 정수인지 확인한다.

**위험**

인증된 클라이언트가 악성 또는 오동작 상태가 되면 임의 original payload를 만들어 다른 PC에 긴급 알림처럼 전파할 수 있다. sender 위장 방지는 message에는 적용되어 있으나 escalate에는 아직 서버 DB 원본 조회가 없다.

**권장 작업**

1. `db.js`에 `getMessageById(id)` 추가.
2. `server.js`의 escalate 처리에서 클라이언트 `original`을 무시하고 DB의 원본 메시지를 조회.
3. 원본이 없거나 alert 대상이 아니면 reject.
4. broadcast payload는 `{ kind:'escalate', id, by: socket.userId, original: dbMessage }`로 서버가 재구성.
5. 테스트: forged original이 무시되는지, 없는 id escalate가 전파되지 않는지 추가.

### 3.2 P0 조건부 — DH Talk 4대 PC 운영에서 DB/큐 단일 진실원 미흡

**근거**

- `ipc.js`: `messages:recent`, `messages:search`, `patients:list`, `patients:advance` 등은 각 Electron 인스턴스의 로컬 SQLite를 직접 조회/수정한다.
- `server.js`: WebSocket 서버는 서버 PC DB에 수신 메시지를 저장하고 broadcast한다.
- renderer 초기 로딩은 `window.dhtalk.getRecentMessages()`와 `window.dhtalk.listPatients()`로 로컬 DB를 읽는다.

**위험**

데스크1 서버 PC와 원장 PC/데스크 PC들의 메시지 히스토리, 검색, 환자 큐가 재시작 후 서로 달라질 수 있다. 실시간 broadcast 중에는 얼핏 동작하지만, 초기 상태 복구와 검색에서는 분산 상태가 드러난다.

**권장 작업**

- 서버 PC를 단일 진실원으로 선언.
- 최근 메시지, 검색, 환자 큐 조회/변경을 WebSocket request/response 또는 HTTP localhost API를 통해 서버로 위임.
- 클라이언트 로컬 SQLite는 캐시 또는 오프라인 큐로만 제한.
- 초기 연결 성공 후 `sync:snapshot`으로 messages/patients를 내려받게 한다.

### 3.3 P1 — DH Talk WebSocket 재연결/전송 실패 UX 미완성

**근거**

- `App.jsx`는 최초 `new WebSocket(...)` 후 `onclose`에서 상태와 banner만 갱신한다.
- exponential backoff 재연결 루프, 수동 “다시 연결” 버튼, 전송 pending queue가 없다.
- `sendMessage`/`sendFile`은 연결이 닫혀 있으면 `console.error` 후 종료한다.

**위험**

LAN 일시 끊김, 서버 PC 재시작, Windows 절전 복귀 후 사용자가 메시지/파일 전송 실패를 놓칠 수 있다. 의원 데스크 워크플로에서는 “전송됐다고 착각”하는 위험이 크다.

**권장 작업**

1. `connect()` 함수를 분리하고 close 시 1s→2s→5s→10s→30s backoff 재시도.
2. banner에 마지막 성공 시각, 다음 재시도 카운트다운, “지금 다시 연결” 버튼 표시.
3. 연결 닫힘 상태에서 전송 버튼 disabled 또는 명시 toast.
4. 간단한 outbox: 실패 메시지를 화면에 pending으로 남기고 재연결 후 수동 재전송.

### 3.4 P1 — Electron CSP 및 window/open 하드닝 미흡

**근거**

- `src/renderer/index.html`, `src/renderer/alert.html`에 Content-Security-Policy meta가 없다.
- BrowserWindow는 `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`는 적용되어 있으나 `setWindowOpenHandler`, navigation guard, dev/prod별 `connect-src` 제한은 보이지 않는다.

**위험**

현 구조는 React 텍스트 렌더 중심이라 즉시 exploit 가능성은 낮지만, 파일/메시지/환자명 등 사용자 입력을 다루므로 Electron 방어선은 다층으로 두는 편이 안전하다.

**권장 작업**

- `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws://127.0.0.1:* ws://192.168.0.0/16:*` 수준의 CSP를 dev/prod별로 분리.
- `webContents.setWindowOpenHandler(() => ({ action: 'deny' }))`.
- `will-navigate`에서 앱 내부 file/dev URL 외 navigation 차단.
- alert 창도 동일 적용.

### 3.5 P1 — 첨부 검증이 blocklist 중심

**근거**

- `validate.js`는 위험 확장자 blocklist와 크기 제한을 적용한다.
- MIME은 `splitDataUrl()` 결과 또는 클라이언트 제공값에 가깝고, magic byte 검증은 없다.

**위험**

이름을 바꾼 executable, polyglot, 잘못된 MIME 파일이 저장될 수 있다. 현재는 직접 실행하지 않으므로 즉시 위험은 제한적이나, 파일을 Windows에서 여는 운영 시나리오가 생기면 위험이 커진다.

**권장 작업**

- 허용 확장자 allowlist: `pdf`, `png`, `jpg`, `jpeg`, `webp`, `txt`, `csv`, `docx`, `xlsx`, `hwp` 등 실제 필요 목록만.
- magic byte 최소 검증: PDF/PNG/JPEG/WebP/ZIP 기반 Office.
- 저장 후 “폴더 열기/파일 열기” 기능 추가 시 OS 실행 호출 전 추가 확인.

### 3.6 P1 — Relax v0.5 실제 렌더 DOM에 확대 제한 잔존

**근거**

- 브라우저 smoke 결과 actual DOM viewport: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
- 외부 shell은 `<html>`에 `lang`이 없으나, 번들 template 렌더 후 실제 DOM은 `htmlLang: ko`로 교체된다.
- accessibility snapshot에 `Relax Routine · Loading…` 텍스트가 아직 노출된다.

**위험**

고령/불안/피로 상태 사용자에게 pinch zoom 제한은 접근성 저해다. 정적 QA가 Relax의 embedded template 내부 viewport를 잡지 못하고 있다.

**권장 작업**

- Relax source template의 viewport에서 `maximum-scale=1.0, user-scalable=no` 제거.
- boot loading node는 렌더 완료 후 DOM 제거 또는 `aria-hidden="true"`.
- QA를 단순 파일 문자열이 아니라 브라우저 실제 DOM 검사로 보강.

### 3.7 P1 — Relax 위기 전화 CTA 실제 노출 경로 검증 부족

**근거**

- 정적 QA는 `tel:` 문자열 존재를 확인하지만, 브라우저 초기 DOM에서는 `a[href^="tel:"]`가 0개였다.
- 위기/도움말 단계에서 동적으로 나타날 수 있으나 자동 시나리오 검증은 없다.

**위험**

문자열은 번들에 존재하지만 실제 사용자가 위기 흐름에서 접근 가능한 이름의 전화 링크를 볼 수 있는지 보장하지 못한다.

**권장 작업**

- Playwright/jsdom scenario: 위기 관련 선택지 → 도움 화면 → `a[href^="tel:"]` 및 accessible name 확인.
- “119”, “진료실”, “보호자”, “생명존중사업” 같은 안전 CTA는 렌더 DOM 기준으로 검사.

### 3.8 P2 — CBT-I modal/nav 접근성 세부 보완

**근거**

Round 5의 큰 접근성 문제(label, zoom, persistent crisis CTA)는 해결됐다. 아직 modal focus trap/focus restore, blocked nav의 `disabled` 또는 `tabindex=-1` 적용은 정적/브라우저 검증 대상에 없다.

**권장 작업**

- 모달 open 시 제목 또는 첫 버튼 focus.
- Tab trap, Esc close, close 후 호출 버튼으로 focus restore.
- 위기 차단 nav는 보조기기에서도 차단 상태가 일관되도록 실제 disabled 처리 또는 tabindex 관리.

### 3.9 P2 — QA 체계를 실행형으로 승격

**근거**

현재 `scripts/qa-prototypes.mjs`는 45개 항목이지만 대부분 includes/regex 중심이다. Round 6에서 Relax 실제 DOM viewport 문제처럼 “번들 문자열과 실제 렌더 DOM의 불일치”를 놓칠 수 있다.

**권장 작업**

- Playwright smoke script 추가:
  - index link click.
  - CBT-I crisis 선택 후 diary/session 차단 및 119 banner 확인.
  - CBT-I OSA 선택 후 수면제한 안내 차단 확인.
  - Relax 실제 DOM viewport 확대 허용 확인.
  - Relax 위기 CTA 실제 링크 확인.
- CI 또는 local `npm run qa`에 포함.

## 4. 바로 코딩할 작업 순서

### 빠른 P0/P1 묶음

1. DH Talk escalate 서버 권위성 패치
   - `getMessageById` 추가
   - 서버가 DB 원본으로 escalate payload 재구성
   - forged original 무시 테스트 추가
2. DH Talk reconnect/전송 실패 UX
   - reconnect loop, 수동 재연결, 전송 disabled/banner
3. Electron CSP/navigation guard
   - renderer/alert CSP, window-open deny, will-navigate deny
4. Relax v0.5 viewport/loading 접근성 패치
   - embedded template viewport 수정
   - loading node aria-hidden 또는 제거
   - QA에 실제 DOM 검사 추가

### 큰 설계 작업

1. DH Talk 서버 DB 단일 진실원 전환
2. 첨부 allowlist + magic byte 검증
3. Playwright 기반 실행형 QA 전체 승격
4. Relax 32MB 단일 HTML 구조 분리

## 5. 판정

현재 브랜치는 “프로토타입 안전성/기본 검증” 기준으로는 안정권이다. 그러나 실제 의원 LAN 배포 후보로 보려면 다음 라운드에서 최소한 아래 2개는 먼저 닫는 것이 맞다.

1. DH Talk escalate payload를 서버 DB 원본 기반으로 바꿔 클라이언트 original 신뢰 제거.
2. DH Talk reconnect/전송 실패 UX를 넣어 LAN 끊김 때 메시지 유실/착각을 줄임.

그 다음 Relax v0.5 실제 DOM viewport와 실행형 QA를 처리하면 Round 5에서 못 잡은 접근성 회귀도 고정할 수 있다.
