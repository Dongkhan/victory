# Victory 프로젝트별 추가 보완점 분석 보고서 3차

작성일: 2026-05-18  
대상 repo: `/opt/data/victory`  
현재 작업 브랜치: `hermes/fix-victory-improvements`  
현재 HEAD: `e5f1de5 fix: finish victory improvement pass`  
비교 대상: `origin/main`, `origin/claude/setup-electron-foundation-f66H8`, `origin/claude/polish-relax-routine-WeWLu`

## 0. 요약

이전 보고서의 P0/P1 중 상당 부분은 `hermes/fix-victory-improvements`에 반영되어 있다. 특히 DH Talk의 HMAC 인증, shared key 기본값 제거, 파일 5MB 제한, 위험 확장자 차단, CBT-I 하단 네비게이션 겹침 수정은 현재 브랜치에서 검증됐다.

하지만 새로 확인된 미반영/추가 개선점이 있다.

1. **Relax Routine v0.5**: 새 원격 브랜치 `origin/claude/polish-relax-routine-WeWLu`가 생겼고, 영어 i18n, 스크롤 안전성, 위기 전화 연결, 접근성 보완이 포함되어 있다. 현재 `hermes/fix-victory-improvements`에는 아직 통합되지 않았다.
2. **CBT-I Care**: 하단 탭 겹침은 해결됐지만, 현재 index가 여전히 `cbti-v0.2.html`을 latest로 가리킨다. 원격 브랜치에는 `cbti-v0.3.html`이 있었고, 현재 브랜치는 v0.3 파일을 별도로 보존하지 않고 v0.2에 일부 반영한 형태다. 버전/파일명/인덱스 정책이 불명확하다.
3. **DH Talk**: 현재 테스트/빌드는 통과하지만, 다른 agent의 최신 DH Talk 브랜치에는 `npm run key`, 테스트 파일 분리, Electron 35 안정화 방향이 추가되어 있다. 현 브랜치에는 key 생성 스크립트와 세분화 테스트가 없다.
4. **Repo 운영**: prototype 단일 HTML들이 거대 번들 형태라 diff review와 반복 QA가 어렵다. 제품별 QA 체크리스트와 최소 자동 검증이 필요하다.

## 1. 실행/검증 로그 요약

### 1.1 Git 상태

```text
## hermes/fix-victory-improvements...origin/hermes/fix-victory-improvements
?? reports/
```

원격 신규/갱신 브랜치:

```text
origin/claude/polish-relax-routine-WeWLu  959db1e
origin/claude/setup-electron-foundation-f66H8  ca36f75
origin/hermes/fix-victory-improvements  e5f1de5
origin/main  506a7a3
```

현재 브랜치와 main 비교:

```text
25 files changed, 1258 insertions(+), 2416 deletions(-)
```

### 1.2 DH Talk 검증

```bash
cd /opt/data/victory/dh-talk
npm test
npm run build
npm audit --audit-level=high
```

결과:

```text
node --test: 4/4 pass
vite build: success, 43 modules transformed
npm audit: found 0 vulnerabilities
```

### 1.3 CBT-I 브라우저 검증

`prototype/cbti-v0.2.html`을 정적 서버에서 열고 일기 탭 최하단까지 스크롤했다.

```text
console_messages: []
js_errors: []
수면일기 저장 버튼 bottom: 406.9px
하단 nav top: 507px
gap: 100.1px
```

즉, 직전 P0였던 하단 탭 겹침은 현재 브랜치에서 해결되어 있다.

### 1.4 Relax Routine 브라우저 확인

`prototype/v0.5.html` 실행 시 명시적 초기 로딩 실패는 없었다. 다만 현재 브랜치의 v0.5는 새 `polish-relax-routine` 브랜치의 정책 보완 문구 및 일부 UX 변경이 미반영 상태다.

## 2. 프로젝트별 추가 보완점

## 2.1 Relax Routine

### 현재 상태

- 현재 브랜치에는 기존 `prototype/v0.5.html`이 유지되어 있다.
- 새 브랜치 `origin/claude/polish-relax-routine-WeWLu`가 `index.html`, `prototype/v0.5.html`을 수정한다.
- 해당 브랜치 설명상 보완 범위는 다음과 같다.
  - 영문 i18n
  - 스크롤 안전성
  - 위기 안내 전화 연결
  - 접근성

### 남은 리스크

| 우선순위 | 항목 | 근거 | 권장 조치 |
|---|---|---|---|
| P0 | 위기 안내 CTA의 실제 전화 연결/행동 가능성 확인 | 정신건강 앱에서 위기 안내가 텍스트만 있으면 실사용성이 낮다 | `tel:` 링크, 보호자/진료실/119 또는 지역 응급 자원 안내를 버튼화하고 모바일에서 클릭 검증 |
| P1 | 새 `polish-relax-routine` 브랜치 미통합 | 현재 main/hermes 브랜치에는 새 커밋 `959db1e`가 없다 | 별도 diff 검토 후 v0.5에 병합. 단, 현재 index의 DH Talk 링크 삭제 변경은 되돌려야 함 |
| P1 | 단일 대형 HTML 번들로 diff review가 사실상 불가능 | v0.5 diff가 수십 MB로 팽창하여 실제 수정점 확인이 어렵다 | 소스 HTML/JS를 별도 파일로 유지하고 빌드 산출물은 release artifact로 분리 |
| P1 | 하단 nav/safe-area 회귀 가능성 | CBT-I에서 이미 반복 발생한 유형 | Relax Routine에도 자동 DOM 측정 스모크 테스트 추가: CTA bottom과 nav top 간격 >= 24px |
| P2 | 접근성 라벨/키보드 탐색 일관성 | 카드형 버튼과 div role button 혼재 가능 | 주요 CTA, modal, bottom nav에 aria-label/aria-expanded/keyboard handler 점검 |

### 결론

Relax Routine은 기능 자체보다 **정책 안전성, 접근성, 빌드 구조**가 다음 개선 대상이다. 새 `polish-relax-routine` 브랜치는 무시하면 안 되지만, index에서 DH Talk 섹션을 삭제하는 변화가 섞여 있으므로 그대로 merge하면 안 된다.

## 2.2 CBT-I Care

### 현재 상태

- 현재 브랜치의 index는 `prototype/cbti-v0.2.html`을 latest로 표시한다.
- 원격 `origin/claude/improve-cbti-mobile-ui-thWxf`에는 `prototype/cbti-v0.3.html`이 추가됐으나, 현재 브랜치에는 독립 파일로 존재하지 않는다.
- 직전 개선 작업으로 v0.2에 다음이 반영됐다.
  - 수면일기 하단 버튼 겹침 수정
  - `safe-area-inset-bottom` 반영
  - Rx/OSA 등 초기 평가 시작 step 분기
  - 위기 분기 문구 강화

### 남은 리스크

| 우선순위 | 항목 | 근거 | 권장 조치 |
|---|---|---|---|
| P0 | 버전 정책 혼선: v0.2 파일이 사실상 v0.3 기능을 포함 | index와 파일명이 v0.2라 임상/QA 추적이 꼬일 수 있다 | `cbti-v0.3.html`로 명시 승격하거나 index 문구를 현재 실제 기능에 맞게 정리 |
| P0 | 위기 분기 후 행동 프로토콜이 UI 안에서 충분히 강제되는지 확인 필요 | 자살사고/위기 항목은 CBT-I 자동 진행보다 안전 프로토콜 우선 | 위기 응답 선택 시 다음 버튼/프로토콜 진행 차단, 진료실 연락/119/생명존중사업 안내 명시 |
| P1 | 수면제 점감 보조 모드의 경고 문구와 진료 연결성 | 약물 감량은 앱 단독 결정처럼 보이면 안 됨 | 모든 Rx 관련 화면에 “처방 변경은 진료에서만” 문구, 감량 이벤트 기록 export 추가 |
| P1 | 수면일기 데이터 검증 부족 | HTML prototype 단계라 음수/비현실 시간/누락 입력 검증이 약할 수 있음 | 취침/기상/수면잠복/각성횟수 범위 검증 및 “기록 불완전” 상태 표시 |
| P1 | 진료용 요약 export 부재 또는 약함 | 외래 연결 제품이면 원장/데스크가 볼 수 있는 요약 구조가 핵심 | 7일 평균 TST/SE/SOL/WASO/ISI 변화/위험 플래그를 JSON 또는 복사 가능한 텍스트로 생성 |
| P2 | 정적 프로토타입 회귀 테스트 없음 | 하단 nav, CTA, 탭 전환 문제가 반복됨 | Playwright 또는 브라우저 스크립트로 탭별 console error와 CTA gap 측정 |

### 결론

CBT-I의 다음 작업은 UI보다 **임상 안전 분기와 버전/릴리즈 정리**다. 하단 nav P0는 해결됐으나, 위기 분기와 약물 관련 표현은 제품화 전 P0/P1로 남겨야 한다.

## 2.3 DH Talk

### 현재 상태

현재 브랜치에서 반영된 개선:

- HMAC SHA256 challenge-response 인증
- `auth.shared_key` 기본값 빈 문자열
- shared key 미설정 시 연결 거부
- sender 위장 방지: 서버가 인증된 `socket.userId`로 강제
- 파일 5MB 제한
- 위험 확장자 차단
- WebSocket `maxPayload` 제한
- 진단 패널에 shared key 설정 여부/close code 표시
- `node --test` 4개 테스트 통과
- `npm run build` 통과
- `npm audit --audit-level=high` 0 vulnerabilities

### 새로 확인된 미반영 개선 후보

`origin/claude/setup-electron-foundation-f66H8` 최신 커밋 `ca36f75`에는 현재 브랜치에 없는 항목이 있다.

```text
A dh-talk/scripts/generate-shared-key.js
A dh-talk/test/auth.test.js
A dh-talk/test/macro.test.js
A dh-talk/test/queue-parser.test.js
A dh-talk/test/validate.test.js
M dh-talk/vite.config.js
```

### 남은 리스크

| 우선순위 | 항목 | 근거 | 권장 조치 |
|---|---|---|---|
| P0 | Windows 실제 빌드 미검증 | Linux에서는 `vite build`만 확인. 실제 사용처는 Windows PC | Windows에서 `npm install`, `npm run build:win`, 실행/방화벽/DB 파일 경로 확인 |
| P0 | shared key 초기 설정 UX 부족 | 현재 README 수동 안내만 있고 생성 명령이 없다 | `scripts/generate-shared-key.js`와 `npm run key`를 현재 브랜치에 이식 |
| P1 | 테스트가 하나의 `auth-validate.test.js`에 묶여 있음 | queue parser, macro 치환, validate를 독립적으로 회귀 검증하기 어렵다 | 다른 브랜치의 분리 테스트를 가져와 `auth.test.js`, `validate.test.js`, `macro.test.js`, `queue-parser.test.js`로 세분화 |
| P1 | Electron 버전 전략 결정 필요 | 현재 브랜치는 Electron 39, 다른 브랜치는 Electron 35로 안정화 방향. 둘 다 Node 20 호환 | Windows 네이티브 빌드 기준으로 35 vs 39 중 하나를 고정하고 README/engines/package-lock 일치 |
| P1 | 인증 실패 사유 사용자 표시 제한 | 서버 로그/진단 패널은 있으나 desk 사용자가 바로 해결하기엔 부족할 수 있음 | “shared_key 없음/불일치/user id 불일치/server unreachable”를 UI 상태로 분리 표시 |
| P1 | 첨부 저장 파일명 충돌 가능성 | 현재 `HH-mm_sender_filename`라 같은 분에 같은 파일명이 오면 덮어쓸 수 있음 | timestamp ms 또는 message id/uuid를 파일명에 추가 |
| P1 | 첨부 base64 브로드캐스트로 메모리/네트워크 부담 | 5MB라도 여러 PC 동시 전송 시 부담 | 저장 후 `attachment_path` 중심 전송, 필요 시 fetch/download IPC 구조로 전환 |
| P2 | 감사 로그/운영 로그 정책 미정 | 의원 내 커뮤니케이션 기록은 삭제/보존 정책이 중요 | retention과 cleanup 결과를 UI/README에 더 명확히 표시 |

### 결론

DH Talk는 현재 브랜치 기준으로 “개발 검증”은 통과했다. 다음 단계는 **Windows 실기기 검증, shared key 생성 flow, 테스트 분리, 첨부 저장 안전성**이다.

## 2.4 Repo / Release 운영

### 현재 상태

- `reports/`는 untracked 상태다.
- 정적 prototype, Electron app, 보고서가 한 repo에 섞여 있다.
- `index.html`은 제품 포털 역할을 한다.

### 남은 리스크

| 우선순위 | 항목 | 근거 | 권장 조치 |
|---|---|---|---|
| P0 | PR/branch 정리 전 사용자가 어떤 브랜치를 봐야 하는지 혼선 | `main`, `hermes/fix`, `claude/*`가 각각 개선분을 들고 있음 | `hermes/fix-victory-improvements`를 기준 브랜치로 삼고, 필요한 remote branch 변경만 선별 cherry-pick |
| P1 | 보고서 파일 untracked | 분석 결과가 repo history에 남지 않음 | 보고서를 commit할지, repo 밖 artifact로 둘지 정책 결정 |
| P1 | prototype index가 실제 latest와 불일치 가능 | CBT-I v0.2/v0.3 혼선, Relax v0.5 polish 미반영 | index에 “latest/stable/experimental” 구분 추가 |
| P1 | 자동 QA 부재 | 반복적으로 하단 nav, CTA, JS 에러가 발견됨 | `scripts/qa-prototypes.mjs`로 주요 HTML console error와 CTA/nav gap 측정 자동화 |
| P2 | GitHub CLI 없음 | PR 자동 생성 불가 | 환경에 `gh` 설치하거나 push URL 기반 수동 PR 운영 |

## 3. 다음 코딩 작업 추천 순서

### 1순위: branch reconciliation

현재 기준 브랜치:

```text
hermes/fix-victory-improvements
```

선별 반영할 것:

1. `origin/claude/polish-relax-routine-WeWLu`
   - Relax Routine 위기 전화 연결/접근성/safe-area 보완만 선별
   - index에서 DH Talk 섹션 삭제는 반영하지 않음
2. `origin/claude/setup-electron-foundation-f66H8`
   - `scripts/generate-shared-key.js`
   - `npm run key`
   - 분리 테스트 파일들
   - Electron 35/39는 Windows 검증 후 결정

### 2순위: DH Talk 운영 안전성

- shared key 생성 명령 추가
- 첨부 파일명 충돌 방지
- 인증 실패 UI 세분화
- Windows build checklist 문서화

### 3순위: CBT-I 임상 안전성

- v0.3 파일/인덱스 정책 정리
- 위기 분기 진행 차단 자동화
- 생명존중사업/진료실/응급 안내 문구 정리
- 진료용 요약 export 구현

### 4순위: prototype QA 자동화

- index, CBT-I, Relax Routine 실행 후 console error 수집
- 각 탭 최하단 CTA와 bottom nav 간격 측정
- 실패 시 exit 1

## 4. 최종 판정

| 프로젝트 | 현재 판정 | 다음 액션 |
|---|---|---|
| Relax Routine | 기능은 살아 있으나 새 polish 브랜치 미반영 | P0/P1 정책·접근성 보완 선별 병합 |
| CBT-I Care | 하단 겹침은 해결, 임상 안전/버전 정책은 미완 | v0.3 승격 또는 index 정리, 위기 분기 강화 |
| DH Talk | Linux 개발 검증 통과, Windows 실사용 검증 전 | key 생성 flow, 테스트 분리, Windows build 검증 |
| Repo 운영 | 브랜치/버전 혼선 있음 | 기준 브랜치 확정 후 remote branch 변경 선별 반영 |

## 5. 바로 코딩 가능한 작업 목록

1. `dh-talk/scripts/generate-shared-key.js` 추가 및 `package.json`에 `"key": "node scripts/generate-shared-key.js"` 추가
2. DH Talk 테스트 파일 분리 및 queue/macro 테스트 추가
3. `saveAttachment()` 파일명에 `Date.now()` 또는 `crypto.randomUUID()` 추가
4. `index.html`에 CBT-I stable/latest 구분 정리
5. Relax Routine polish 브랜치에서 위기 전화 연결/접근성/safe-area 패치만 선별 반영
6. `scripts/qa-prototypes.mjs` 추가: CBT-I/Relax console error 및 하단 nav overlap 자동 검사
