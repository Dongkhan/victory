# Victory 프로젝트 추가 개선점 분석 보고서 — Round 5

작성일: 2026-05-18
대상 repo: `/opt/data/victory`
검토 branch/commit: `hermes/fix-victory-improvements` / `50e5522`
목적: 이전 개선 작업 반영 후 한 번 더 실행·정적·브라우저 검토를 돌려 남은 개선점을 재분류

## 0. 요약

현재 브랜치는 기존 P0/P1 다수 항목이 반영되어 있고, 기본 검증은 모두 통과한다.

- CBT-I Care v0.3: 위기/OSA 차단, 수면일기 안전 경고, 모바일 하단 탭 간섭 방지, 진료용 요약 export가 반영됨.
- Relax Routine v0.5: 위기 전화 링크, safe-area, 세션 중 nav 숨김, 중단/완료 구분 문구가 정적 QA에 고정됨.
- DH Talk: HMAC/shared key, 빈 key fail-closed, 연결 실패 원인 배너, 파일/메시지 검증이 반영됨.

남은 핵심 리스크는 “테스트 통과 여부”보다 운영 안전성 쪽이다.

1. DH Talk 미러링 기본 URL이 평문 HTTP라 PHI/API key 전송 리스크가 있다.
2. DH Talk 멀티 PC 구조에서 SQLite/큐/검색 상태가 서버와 클라이언트별로 갈라질 수 있다.
3. DH Talk 연결 끊김 이후 자동 재연결·전송 실패 UX가 약하다.
4. CBT-I/Relax는 정적 문자열 QA에서 실제 클릭·렌더 DOM 기반 QA로 승격할 필요가 있다.
5. CBT-I 접근성 세부 항목, 위기 persistent CTA, OSA 상태에서 diary hint 문구 보수화가 남아 있다.

## 1. 실행/검증 로그 요약

| 항목 | 결과 |
|---|---|
| `git fetch origin --prune` | 완료 |
| `git status --short --branch` | clean, `hermes/fix-victory-improvements...origin/hermes/fix-victory-improvements` |
| `node scripts/qa-prototypes.mjs` | 40/40 pass |
| `cd dh-talk && npm test` | 39/39 pass |
| `cd dh-talk && npm run build` | pass |
| `cd dh-talk && npm audit --audit-level=high --omit=dev` | 0 vulnerabilities |
| 브라우저 index smoke | console error 없음 |
| 브라우저 CBT-I v0.3 smoke | console error 없음 |
| CBT-I 홈 DOM geometry | 활성 홈 CTA와 하단 nav overlap 없음 |

## 2. 원격 브랜치 재확인

최근 원격 브랜치:

- `origin/hermes/fix-victory-improvements` — 현재 후보 브랜치, `50e5522`
- `origin/claude/polish-relax-routine-WeWLu` — Relax 보완 브랜치이나, 현재 후보 대비 `prototype/cbti-v0.3.html`, QA, 보고서, DH Talk 테스트/인증 파일을 삭제하는 방향의 큰 collateral diff 포함
- `origin/claude/setup-electron-foundation-f66H8` — 일부 Electron 안정화 아이디어가 있으나 현재 후보에 HMAC/검증/연결 진단 상당 부분이 이미 선별 반영됨
- `origin/claude/improve-cbti-mobile-ui-thWxf` — CBT-I v0.3 기반 작업은 현재 후보가 더 최신

판정: 현 시점에서 다른 agent 브랜치는 blanket merge 금지. 필요한 아이디어만 선별 port가 맞다.

## 3. 프로젝트별 추가 개선점

### 3.1 DH Talk

| 우선순위 | 개선점 | 근거 | 권장 작업 |
|---|---|---|---|
| P0 | Telegram/Hermes 미러링 기본 URL을 HTTP에서 제거 또는 HTTPS 강제 | `dh-talk/src/main/hermes-mirror.js`의 `DEFAULT_URL = 'http://76.13.179.163:8090'`. `mirror_to: ['telegram']` 사용 시 환자명/본문/alert/API key가 평문 전송될 수 있음 | 기본 URL 제거, `HERMES_URL` 미설정 시 미러링 비활성화. `https://`만 허용. PHI 포함 가능성 경고와 명시적 opt-in 추가 |
| P0 조건부 | 멀티 PC DB/큐 동기화 구조 명확화 | 서버는 메시지를 서버 SQLite에 저장하고 broadcast하지만, 클라이언트의 초기 `getRecentMessages/search/listPatients`는 로컬 DB를 본다. 재시작 후 클라이언트 검색/히스토리/큐 상태가 분리될 수 있음 | “서버 DB 단일 진실원”으로 통합. 서버 경유 API 또는 WebSocket request/response로 최근 메시지·검색·환자큐를 조회. 클라이언트 로컬 DB는 캐시로만 사용 |
| P1 | WebSocket 자동 재연결/수동 재연결 버튼 | `App.jsx`는 최초 1회 연결 후 close/error 상태에서 재연결 루프가 없음 | exponential backoff, “다시 연결” 버튼, 마지막 성공 시각, 재연결 중 상태 표시 추가 |
| P1 | 전송 실패 UX 강화 | `sendMessage`, `sendFile`은 연결 닫힘 시 `console.error`만 남김 | 입력/전송 버튼 disabled, toast/banner, 실패 메시지 로컬 표시, 재시도 큐 또는 pending outbox 추가 |
| P1 | ack/escalate 권한·canonical payload 검증 | renderer가 `kind: 'escalate', id, original`을 보내고 서버가 original을 신뢰할 가능성. ack도 id만 있으면 처리 가능 | 서버가 DB에서 원본 메시지를 조회해 escalate payload 구성. ack 가능 주체/대상 검증. 클라이언트 제공 `original` 무시 |
| P1 | Electron CSP 하드닝 | contextIsolation/sandbox는 좋지만 renderer/alert HTML에 명시 CSP가 확인되지 않음 | `default-src 'self'`; `script-src 'self'`; `img-src 'self' data:`; `connect-src ws://LAN https://...` 등 환경별 CSP 적용 |
| P1 | 첨부 MIME/magic byte allowlist | 현재 확장자 blocklist + 크기 제한 중심. MIME은 클라이언트 제공값을 신뢰 | 허용 확장자/허용 MIME allowlist, magic byte 확인, 저장 파일 권한, 열기 정책 추가 |
| P2 | 통합 테스트 보강 | 현재 39개 테스트는 auth/parser/static renderer 중심 | 실제 WebSocket handshake, 다중 클라이언트 broadcast, reconnect, ack/escalate 권한, 파일 roundtrip 테스트 추가 |

### 3.2 CBT-I Care v0.3

| 우선순위 | 개선점 | 근거 | 권장 작업 |
|---|---|---|---|
| P0 | 입력 label-control 연결 | 수면일기 입력 label이 `for`/`id`로 명시 연결되지 않은 항목이 많음 | `diaryDate`, `bedTime`, `lightsOff`, `sleepOnset`, `wakeCount`, `waso`, `wakeTime`, `outTime`, `nap`, `caf`, `med`, `quality`, `textarea`에 `id` 부여 및 label `for` 연결 |
| P0 | 모바일 확대 제한 제거 | `prototype/cbti-v0.3.html` viewport에 `maximum-scale=1` 포함 | `maximum-scale=1` 제거. 저시력/고령/피로 상태 사용자의 pinch zoom 허용 |
| P1 | OSA 위험 상태에서 diary hint도 보수화 | OSA 선택 시 수면제한 모달/세션은 막지만, 낮은 수면효율 diary hint가 “침대에 머문 시간 줄이기” 뉘앙스를 줄 수 있음 | `hasOsaCaution()`이면 diary feedback에서도 “OSA 평가 우선, 수면일기는 진료 참고자료”를 우선 표시 |
| P1 | 위기 상태 persistent CTA | crisis 선택 시 일기/세션 차단은 되지만 홈 복귀 후 상단에 지속적 전화/보호자 CTA가 충분히 남지 않음 | 위기 상태에서는 홈 상단 persistent crisis banner, 119 tel link, 보호자/진료실 연락 CTA 유지 |
| P1 | 수면제한 safety gate 확장 | OSA는 막지만 조증/양극성, 중증 주간졸림, 고위험 직업, 발작, 교대근무 등은 별도 분기 약함 | Week 3 진입 전 safety checklist 추가. 위험군은 자동 수면제한 안내 보류 |
| P2 | nav 차단 시 실제 disabled 처리 | 위기 차단 nav에 `aria-disabled` 중심. 클릭은 JS로 막지만 키보드/보조기기 동작이 일관되지 않을 수 있음 | 차단 대상은 `disabled` 또는 `tabindex=-1` 적용. 대신 안전 안내 CTA는 활성 유지 |
| P2 | modal focus trap/focus restore | `role="dialog"`, `aria-modal`은 있으나 focus trap과 open/close focus 이동은 약함 | 모달 open 시 제목/닫기 버튼 focus, Tab trap, close 후 호출 버튼으로 focus restore |

### 3.3 Relax Routine v0.5

| 우선순위 | 개선점 | 근거 | 권장 작업 |
|---|---|---|---|
| P0 | 모바일 확대 제한 제거 | embedded viewport에 `maximum-scale=1`/`user-scalable=no` 계열 설정 가능성이 확인됨 | 확대 제한 제거. 레이아웃은 반응형 CSS로 대응 |
| P1 | 초기 shell 접근성 | 외부 shell `<html>`에 `lang` 없음. JS 비활성/로딩/오류 상태에서 언어 정보 부족 | shell `<html lang="ko">` 지정 |
| P1 | noscript 한국어화 | `noscript`가 영어 단독: “This page requires JavaScript to display.” | 한국어 우선 문구로 변경: “이 페이지는 표시를 위해 JavaScript가 필요합니다.” |
| P1 | loading residue 제거 | 브라우저 접근성 트리에 `Relax Routine · Loading…`가 남을 가능성 | 부트 로더를 렌더 후 DOM에서 제거하거나 `aria-hidden="true"` 처리 |
| P1 | 실제 렌더 DOM 기반 emergency CTA 검증 | QA는 `relax.includes('tel:')`처럼 번들 문자열 포함 검사 중심 | Playwright/jsdom으로 실제 렌더 후 `a[href^="tel:"]`와 접근 가능한 이름 검증 |
| P2 | PMR 첫 노출 용어 보강 | 일반 사용자에게 `PMR` 약어가 먼저 보일 수 있음 | 첫 노출은 `점진적 근육 이완(PMR)`로 표기 |
| P2 | 32MB 단일 HTML 구조 분리 | `prototype/v0.1~v0.5.html`이 각각 약 31MB | source/release 분리, assets externalization, sourcemap/QA 가능한 구조로 리팩터링 |

### 3.4 QA/검증 체계

| 우선순위 | 개선점 | 근거 | 권장 작업 |
|---|---|---|---|
| P1 | 정적 문자열 QA에서 실행형 QA로 승격 | 현재 `qa-prototypes.mjs`는 includes/regex 중심. 실제 클릭/차단/계산 플로우를 실행하지 않음 | Playwright 또는 jsdom 도입. crisis 선택 후 diary/session 차단, OSA 선택 후 restriction 차단, diary edge case 계산, clipboard fallback 테스트 |
| P2 | merge conflict marker regex 보강 | 현재 `/^(<<<<<<<|=======|>>>>>>>) /m`라 marker 뒤 공백이 없는 경우 놓칠 수 있음 | `/^(<<<<<<<|=======|>>>>>>>)/m`로 완화하고 전체 prototype/report 주요 파일에 적용 |
| P2 | 접근성 자동 검사 추가 | label, viewport zoom, dialog focus 등은 현재 QA가 못 잡음 | axe-core 또는 자체 DOM 검사 추가 |
| P2 | index 접근성 기본값 | `index.html`에 `<html lang>`, viewport, landmark가 부족 | `<html lang="ko">`, viewport meta, `<main>` 추가 |

## 4. 바로 코딩 가능한 작업 목록

### 빠른 P0/P1 패치 묶음

1. `dh-talk/src/main/hermes-mirror.js`
   - `DEFAULT_URL` 제거 또는 `https://` 기본값만 허용
   - `HERMES_URL`이 없으면 미러링 skip
   - `new URL(baseUrl).protocol !== 'https:'`이면 skip + error

2. `prototype/cbti-v0.3.html`
   - viewport 확대 제한 제거
   - diary label `for`/input `id` 연결
   - OSA 상태 diary hint 보수화
   - crisis 상태 홈 persistent banner/`tel:119` CTA 추가

3. `scripts/qa-prototypes.mjs`
   - merge conflict regex 수정
   - viewport 확대 제한 금지 검사 추가
   - CBT-I diary label 연결 검사 추가
   - Hermes mirror HTTP 기본값 금지 검사 추가

4. `index.html`
   - `<html lang="ko">`, viewport meta, `<main>` 추가

### 별도 큰 작업

1. DH Talk 서버 DB 단일 진실원 구조로 정리
2. DH Talk reconnect/outbox/전송 실패 UX
3. DH Talk ack/escalate 권한 모델
4. Relax Routine 32MB 단일 HTML 분해
5. Playwright 기반 실제 UI scenario QA

## 5. 판정

현재 후보 브랜치는 기존 개선점 처리 기준으로 “기본 검증 통과 + 주요 임상 안전 게이트 반영” 상태다. 다만 실제 의원 LAN 운영/환자 정보 취급을 기준으로 보면 DH Talk 쪽에 P0급 운영 보안 리스크가 남아 있다.

다음 코딩 라운드는 아래 순서가 가장 효율적이다.

1. HTTP 미러링 기본값 제거/HTTPS 강제
2. CBT-I 접근성/확대/OSA 힌트/위기 CTA 보강
3. QA 스크립트에 위 항목들을 deterministic check로 고정
4. 그 다음 DH Talk reconnect/outbox와 서버 DB 단일화 설계로 이동
