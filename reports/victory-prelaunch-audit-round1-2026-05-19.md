# Victory 4개 프로젝트 실사용 직전 감사 1차 보고

작성일: 2026-05-19
대상 repo: `Dongkhan/victory`
검토 기준: `origin/main` / `dce25b1` (`feat: elevate CBT-I app to release-quality v0.5`)
검토 범위: Relax Routine, CBT-I Care, Behavioral Activation ActivaCare, DH Talk

## 0. 요약

현재 상태는 다음과 같다.

| 프로젝트 | 현재 수준 | 실사용 직전 차단 이슈 |
|---|---:|---|
| Relax Routine | 프로토타입 v0.5, 기본 흐름 작동 | P1: PWA/저장/데이터 내보내기 없음, 접근성 트리에서 `Loading…` 잔류 가능성 |
| CBT-I Care | v0.5, 4개 중 가장 출시 직전 수준 | P1: localStorage 기반이라 기기 간/브라우저 초기화 리스크, P1: 빈 상태/저장 상태는 좋으나 안전 플래그와 실제 임상 워크플로우 연결은 더 강화 필요 |
| Behavioral Activation / ActivaCare | v0.2, 핵심 치료 루프는 있음 | P1: 기록 지속성·내보내기·7일/주간 리포트가 아직 CBT-I만큼 완성되지 않음, 숨은 모달 요소의 focus 관리 검증 필요 |
| DH Talk | build는 통과하나 실사용 차단 이슈 있음 | P0: LAN WebSocket 인증 없음, P0: 브라우저 단독 실행 시 blank screen, P1: Electron/audit high vulnerability, P1: 현재 환경에서 Electron 기동 불가로 GUI 미검증 |

우선순위는 `DH Talk P0`부터 잡는 것이 맞다. 이유는 환자정보가 오가는 LAN 메신저라서, 프로토타입 UI 완성도보다 인증·실패상태·실제 설치 검증이 실사용 리스크에 직접 연결된다.

## 1. 실행/검증 로그

```bash
git fetch origin --prune
git rev-parse --short HEAD
# dce25b1

python3 -m pytest -q
# 6 passed in 0.02s

cd dh-talk && npm ci
# install/app-deps 성공, 12 vulnerabilities reported

cd dh-talk && npm run build
# Vite renderer build 성공

cd dh-talk && npm audit --omit=dev --audit-level=high
# found 0 vulnerabilities

cd dh-talk && npm audit --audit-level=high --json
# 12 vulnerabilities: 2 low, 10 high. Electron/electron-builder dev/build chain 중심

cd dh-talk && npm start
# 실패: libgtk-3.so.0 없음. 현재 Linux 검증환경에서 Electron GUI 기동 불가
```

브라우저 smoke check:

- Relax Routine `prototype/v0.5.html`: 로드 성공, 주요 버튼 표시, 시작→질문 화면 진입 확인.
- CBT-I Care `prototype/cbti-v0.5.html`: 로드 성공, 일기 저장 시 `cbti-care-v05-state` localStorage 생성 및 홈 지표 갱신 확인.
- ActivaCare `behavioral-activation-dtx/prototype/v0.2.html`: 로드 성공, 하단 탭/CTA 표시 확인.
- DH Talk `dh-talk/dist/renderer/index.html`: 브라우저 단독 로드 시 blank screen, console error `Cannot read properties of undefined (reading 'onMacrosChanged')`.

링크 체크:

- root `index.html`의 Relax/CBT-I/ActivaCare 주요 링크는 모두 존재.
- `behavioral-activation-dtx/index.html`의 prototype/README 링크도 모두 존재.

## 2. 프로젝트별 결과

## 2.1 Relax Routine

### 확인된 장점

- `prototype/v0.5.html`이 root index에서 latest로 노출된다.
- 첫 화면 CTA, 4개 이완법 버튼, 시작 후 6문항 평가 화면 진입이 된다.
- 버튼 크기와 기본 모바일 mockup 레이아웃은 사용 가능 수준이다.

### 문제/개선점

| 우선순위 | 항목 | 근거 | 수정 방향 |
|---|---|---|---|
| P1 | 접근성 트리에 `Relax Routine · Loading…` 잔류 가능성 | browser snapshot에서 화면 전환 후에도 static text로 노출됨. `document.body.innerText`에는 없어 시각 잔류는 아님 | 초기 loading 노드 제거 또는 `aria-hidden=true`, `role=status` 종료 처리 |
| P1 | 실사용 데이터 지속성 부족 | CBT-I v0.5처럼 저장·리포트·내보내기 구조가 없음 | 완료 기록, 8주 진행률, 진료 공유 요약, reset/export 추가 |
| P2 | viewport 확대 금지 | `maximum-scale=1.0, user-scalable=no` | 접근성 기준상 확대 허용 권장. 모바일 앱 설치형이 아니라 웹 prototype이면 제거 검토 |
| P2 | PWA/오프라인 준비 없음 | manifest/service worker 없음 | 홈 화면 설치, offline fallback, version 표시 추가 |

### 다음 코딩 후보

1. Loading 접근성 잔류 제거.
2. CBT-I v0.5의 저장/리포트 패턴을 Relax Routine에 이식.
3. 완료 기록 export `.txt` 생성.

## 2.2 CBT-I Care

### 확인된 장점

- `prototype/cbti-v0.5.html`이 root index latest로 노출된다.
- pytest 6개 통과.
- 브라우저에서 일기 저장 후 홈 지표가 실제 데이터 기반으로 갱신된다.
- 안전 문구에 자살예방 109, 119/응급실, 보건소 생명존중사업 연결이 들어가 있다.
- 빈 상태와 저장 상태가 구분되어 dummy 수치 오해를 줄였다.

### 문제/개선점

| 우선순위 | 항목 | 근거 | 수정 방향 |
|---|---|---|---|
| P1 | localStorage 단독 저장 | `cbti-care-v05-state` localStorage 확인. 브라우저 초기화/기기 변경 시 유실 | 파일 export/import, 백업 안내, `저장 위치` 더 명확화 |
| P1 | 임상 안전 플래그가 실제 입력항목과 제한적으로 연결 | 현재 저장 항목은 TST, med, SE 중심. PHQ-9/자살사고/조증/OSA 위험은 상세 설명은 있으나 홈 safety 계산과 직접 연결 약함 | 안전 체크 입력 섹션 추가 후 dashboard/report에 반영 |
| P1 | 7일 미만에서 수면제한/수면창 권고 오해 가능성 | 홈에는 7일 기준이 있으나 사용자는 1일 저장 후 지표를 바로 볼 수 있음 | 7일 미만일 때 수면창 조정 문구를 더 강하게 차단 |
| P2 | 숨은 export sheet의 `확인` 버튼이 DOM상 focusable일 수 있음 | hiddenClickable probe에서 0x0 확인 버튼 탐지 | sheet hidden 시 `hidden`/`inert`/`aria-hidden` 처리 |

### 다음 코딩 후보

1. 안전 체크 항목: 자살사고, 조증, 수면무호흡, 심한 주간졸림 입력 추가.
2. 7일 미만 수면창 조정 차단 문구 강화.
3. export/import 및 local backup 추가.
4. 숨은 sheet focus trap/inert 처리.

## 2.3 Behavioral Activation / ActivaCare

### 확인된 장점

- root index와 프로젝트 page에서 v0.2가 latest로 연결된다.
- 첫 화면에 Today CTA, 실행 전 체크, 더 작게, 오늘은 어려움, 4법칙 기반 예상 최소화 실험이 들어가 있어 치료적 정체성이 좋다.
- 대상군이 우울증 전용이 아니라 ADHD/실행기능/불안/회피/완벽주의/번아웃까지 확장되어 있다.

### 문제/개선점

| 우선순위 | 항목 | 근거 | 수정 방향 |
|---|---|---|---|
| P1 | 실제 저장/리포트 구조가 CBT-I보다 약함 | 화면은 치료 루프를 보여주나 장기 기록·요약·export가 약함 | 7일 행동 시도, 완료/부분수행, 예상-실제 차이 추세 저장 |
| P1 | 숨은 모달/패널의 focusable 요소가 0x0으로 남음 | `타이머 시작`, `완료 기록 저장`, `재설계 기록 저장` 등 hiddenClickable 탐지 | 비활성 sheet에 `hidden`/`inert` 적용, 열릴 때 focus 이동/닫힐 때 복귀 |
| P1 | 위기/안전 가드레일이 CBT-I보다 약함 | 외래 탭은 있으나 자살위험/기능저하 급성 악화 시 경로가 전면화되어 있지 않음 | Clinic/Safety 탭에 즉시연결 기준, 109/119/생명존중사업 문구 추가 |
| P2 | 치료효과 표현과 wellness-first 경계선 관리 필요 | README는 wellness-first이나 앱 화면은 DTx 정체성이 강함 | “치료 대체 아님”, “진료 보조/자기관리”를 저장·리포트 화면에도 반복 |

### 다음 코딩 후보

1. CBT-I v0.5 패턴으로 localStorage 저장, 주간 요약, export 추가.
2. hidden sheet inert/focus 관리.
3. 안전 탭과 외래 공유 리포트 강화.

## 2.4 DH Talk

### 확인된 장점

- `npm ci` 성공, native `better-sqlite3` rebuild 성공.
- `npm run build` 성공.
- renderer bundle 생성됨.
- packaged config 복사 설정은 있음.
- main BrowserWindow는 `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`로 기본 보안 방향은 좋다.

### 실사용 차단 이슈

| 우선순위 | 항목 | 근거 | 수정 방향 |
|---|---|---|---|
| P0 | LAN WebSocket 인증 없음 | `server.js`가 `new WebSocketServer({ port })` 후 `hello.userId`만 신뢰. 공유키/토큰 검증 없음 | `settings.yaml`에 shared_key 추가, handshake/auth message 검증, 미인증 socket은 close |
| P0 | 브라우저 단독 실행 blank screen | `dh-talk/dist/renderer/index.html`에서 `window.dhtalk` undefined → `onMacrosChanged` 에러 | Electron API 없을 때 명확한 “Electron 앱에서 실행하세요” fallback 화면 또는 mock demo mode |
| P1 | full npm audit high 10개 | Electron 33.4.11 및 electron-builder chain. `npm audit --omit=dev`는 0이지만 배포 빌드 도구·Electron 런타임 high 포함 | Electron 39+ 또는 42 계열 재평가, Node engines와 native rebuild 호환성 확인 후 lock 갱신 |
| P1 | 현재 검증환경에서 Electron GUI 기동 실패 | `libgtk-3.so.0` 없음 | CI/검증환경에 GTK 의존성 설치 또는 Windows 빌드/실행 smoke test를 별도 검증 절차로 고정 |
| P1 | WebSocket 연결 끊김 시 전송 UX 약함 | App.jsx의 `sendMessage`는 console.error 후 return | 사용자 visible error, 재연결, outbox queue, 실패한 메시지 draft 보존 필요 |
| P1 | 서버가 임의 sender/recipient를 신뢰 | client payload의 sender/recipient를 그대로 insert/broadcast | socket 인증된 userId로 sender를 서버에서 덮어쓰기, recipient allowlist 검증 |
| P2 | GUI/IPC 자동 테스트 부재 | package scripts에 test 없음 | pure logic test + Playwright/Electron smoke test 추가 |

### 다음 코딩 후보

1. Shared-key 인증과 sender 서버 권위화.
2. Electron API fallback 화면.
3. 연결 끊김/전송 실패 visible UX와 outbox.
4. Electron/electron-builder 보안 업데이트 가능성 검증.
5. Windows 설치 전 checklist를 실제 smoke script로 전환.

## 3. 권장 작업 순서

1. DH Talk P0: LAN 인증, sender 신뢰 제거, 브라우저 blank fallback.
2. CBT-I P1: 안전 체크 입력과 7일 미만 권고 차단, export/import.
3. ActivaCare P1: 저장·주간 리포트·안전/외래 요약.
4. Relax Routine P1: 저장·진도·export, Loading 접근성 정리.
5. 네 프로젝트 공통: hidden modal inert/focus 관리, PWA/offline/manifest, root index release 상태 정리.

## 4. 판정

- `CBT-I Care`: 제한적 파일럿 직전. 안전 입력과 backup/export만 보강하면 가장 먼저 실사용 후보.
- `ActivaCare`: 치료 루프는 좋으나 아직 prototype v0.2. 저장/리포트가 들어가야 파일럿 가능.
- `Relax Routine`: 콘텐츠 프로토타입은 안정적이나 실사용 앱 기능은 부족.
- `DH Talk`: 실사용 전 P0 수정 필수. 인증 없는 LAN 메신저는 환자정보 환경에서 바로 쓰면 안 된다.
