# Victory 프로젝트별 보완점 분석 보고서 2차

작성일: 2026-05-18
대상 repo: `/opt/data/victory`
검토 대상 원격 브랜치:

- `origin/claude/improve-cbti-mobile-ui-thWxf` 최신 커밋 `1273f48`
- `origin/claude/setup-electron-foundation-f66H8` 최신 커밋 `7231de0`

## 0. 요약

이번에는 `main`에는 아직 합쳐지지 않은 원격 브랜치 수정분을 별도 worktree로 받아 실제 실행/빌드/스모크 테스트했다.

확인한 것:

- CBT-I Care v0.3 정적 서버 실행
- 브라우저에서 `index.html`, `prototype/cbti-v0.3.html` 직접 확인
- CBT-I v0.3 홈/일기/초기평가 intro 화면의 하단 네비게이션 겹침 확인
- DH Talk v0.1.1 `npm install`, `npm run build`, renderer 브라우저 단독 실행 안내 확인
- DH Talk 인증/HMAC/스키마 검증 로직 일부 Node smoke test
- Git diff 기준으로 Relax Routine / CBT-I / DH Talk 프로젝트별 변경 범위 분리

핵심 결론:

1. **Relax Routine**은 이번 추가 코드 수정이 사실상 없음. v0.5 자체는 기존 최신 프로토타입으로 유지된다.
2. **CBT-I Care**는 v0.3에서 임상 안전 선별, 수면제 점감 보호장치, 진료용 요약 개념이 들어가 방향은 좋아졌다. 다만 하단 네비게이션이 홈 보조 버튼/일기 하단 입력/저장 버튼/초기평가 CTA와 계속 충돌한다.
3. **DH Talk**는 WebSocket 인증, sender 위장 방지, 메시지 검증, retention 설정, 진단 패널이 들어가 보안·운영성이 좋아졌다. 단, Electron 42 업그레이드가 현재 Node 20 개발 환경과 맞지 않아 `npm install`의 postinstall 단계에서 native rebuild 실패가 발생한다. 배포 전 가장 먼저 고쳐야 한다.

---

## 1. 실행/검증 로그 요약

### 1.1 Git 확인

```bash
git fetch origin
git log --oneline --decorate --graph --all -12
```

확인된 새 원격 커밋:

```text
1273f48 feat: CBT-I Care 프로토타입 v0.3 — 임상 안전 분기·진료용 요약
7231de0 fix: Electron 42 보안 업데이트 + 브라우저 단독 실행 안내
37fae6b chore: 버전 0.1.1, README 진행상황 갱신
810837c feat: retention 반영·config 위치·clear 확인·진단 패널 (v0.1.1 운영)
c1c16e6 feat: WebSocket 인증·스키마 검증·위장 방지 (v0.1.1 보안)
```

### 1.2 CBT-I v0.3 실행

```bash
git worktree add /opt/data/victory-review-cbti origin/claude/improve-cbti-mobile-ui-thWxf
cd /opt/data/victory-review-cbti
python3 -m http.server 8091
```

브라우저 확인:

- `http://127.0.0.1:8091/`
- `http://127.0.0.1:8091/prototype/cbti-v0.3.html`

브라우저 콘솔:

```text
console_messages: []
js_errors: []
```

즉, 명시적 JS 런타임 에러는 없었다.

### 1.3 DH Talk 실행/빌드

```bash
git worktree add /opt/data/victory-review-dhtalk origin/claude/setup-electron-foundation-f66H8
cd /opt/data/victory-review-dhtalk/dh-talk
npm install
```

결과:

```text
npm WARN EBADENGINE electron@42.1.0 required node >=22.12.0
current node v20.19.2
...
better-sqlite3 rebuild failed
error: no matching function for call to v8::External::Value()
error: no matching function for call to v8::External::New(...)
npm ERR! command sh -c electron-builder install-app-deps
```

`postinstall`을 우회하면 renderer build는 성공한다.

```bash
npm install --ignore-scripts
npm run build
```

결과:

```text
✓ 42 modules transformed.
✓ built in 915ms
```

브라우저 단독 실행 안내도 정상 표시됐다.

```text
이 화면은 Electron 데스크탑 앱 전용입니다.
일반 브라우저에서는 동작하지 않습니다.
```

Node smoke test:

```text
valid message: ok true
spoofed sender passes schema but server overrides sender: ok true
blocked exe: ok false, 차단된 파일 형식
ack id: ok true
hmac good: ok true
hmac bad: ok false
```

---

## 2. 프로젝트별 변경 범위

## 2.1 Relax Routine

### 변경 여부

이번 신규 원격 수정에서 Relax Routine 기능 코드 자체는 거의 변경되지 않았다.

CBT-I 브랜치 기준:

- `prototype/v0.5.html` 유지
- `index.html`에서 Relax Routine 섹션 유지
- 실제 수정 초점은 CBT-I v0.3 추가

DH Talk 브랜치 단독 diff에서는 `prototype/v0.5.html` 삭제처럼 보이는 구간이 있다.

```text
D prototype/v0.5.html
```

하지만 이는 DH Talk 브랜치가 현재 `main`보다 오래된 분기점에서 이어진 영향이다. 실제 `main`에 병합할 때는 merge-base 기준으로 main 쪽 Relax Routine 파일이 유지되는 구조라 즉시 삭제 충돌로 보이지는 않는다. 그래도 PR 화면에서는 삭제처럼 보일 수 있으므로 병합 전 확인이 필요하다.

### 현재 평가

Relax Routine은 이번 검토 대상 중 안정도가 가장 높다.

좋은 점:

- v0.5가 index에서 latest로 유지됨
- 이전에 확인한 PAQ-S/개인화 엔진/뒤로가기 이벤트 수정 맥락이 유지됨
- CBT-I와 색상/모바일 구조가 어느 정도 통일되어 있음

보완점:

1. **Relax Routine과 CBT-I의 공통 모바일 shell을 분리하는 것이 좋다.**
   - 현재 두 프로토타입 모두 `phone`, `screen-wrap`, `bottom-nav`, `screen`, `card`, `cta` 패턴을 각 HTML에 중복 보유한다.
   - 같은 하단 네비게이션 겹침 문제가 CBT-I에서 반복되고 있으므로 Relax Routine에도 같은 리스크가 있다.
   - 공통 CSS 토큰을 `prototype/shared/mobile-shell.css` 같은 식으로 분리하면 반복 결함을 줄일 수 있다.

2. **프로토타입별 regression checklist가 필요하다.**
   - 확인 항목:
     - 마지막 카드가 하단 nav에 가려지지 않는지
     - CTA가 390×844, 375×667, 360×740에서 보이는지
     - nested scroll이 실제 모바일 터치에서 작동하는지
     - splash overlay가 클릭을 가로막지 않는지

3. **Relax Routine에서 CBT-I로 이어지는 제품 경계가 아직 index 수준이다.**
   - 실제 제품에서는 Relax Routine 사용자가 불면 고위험군이면 CBT-I Care로 유도하는 전환 경로가 필요하다.
   - 예: PAQ-S/수면 관련 응답이 높으면 “CBT-I Care 평가하기” 카드 노출.

### Relax Routine 우선순위

| 우선순위 | 보완점 | 이유 |
|---|---|---|
| P1 | 공통 모바일 shell CSS 분리 | CBT-I에서 반복 발생한 하단 nav 결함 예방 |
| P2 | 모바일 regression checklist 도입 | 프로토타입마다 같은 UI 결함 반복 방지 |
| P3 | CBT-I Care로의 임상적 전환 CTA | 두 프로젝트 간 제품 연결성 강화 |

---

## 2.2 CBT-I Care

### 변경 내용

`origin/claude/improve-cbti-mobile-ui-thWxf`에서 확인된 주요 변경:

```text
index.html               |   3 +-
prototype/cbti-v0.3.html | 824 +++++++++++++++++++++++++++++++++++++++++++++++
```

v0.3 핵심 추가:

- `prototype/cbti-v0.3.html` 신규 추가
- index에서 CBT-I v0.3을 latest로 등록
- 임상 안전 선별 항목 추가
  - 조증
  - 자살사고
  - 수면무호흡
  - 하지불안
  - 진정제/수면제 관련 위험
- 수면제 점감 보호장치 강화
- 진료용 요약 화면 추가
- 날짜/시간 입력칸 폭 확대
- 하단 여백 보정 시도

### 실행 결과

정적 서버 및 브라우저 실행은 정상.

```text
console_messages: []
js_errors: []
```

기능적으로 화면 전환은 가능하고 index에서도 v0.3 링크가 보인다.

### 잘 된 점

1. **임상 안전 선별이 들어간 것은 방향이 좋다.**
   - 순수 수면 습관 앱이 아니라 외래 진료와 연결되는 CBT-I care extension으로 설계 방향이 잡혔다.
   - 조증/자살사고/무호흡/하지불안/진정제 위험을 분리한 것은 실제 임상 워크플로우에 맞다.

2. **수면제 점감 보호장치를 명시한 점이 좋다.**
   - 사용자가 자의적으로 감량하는 앱처럼 보이면 위험하다.
   - v0.3은 감량 보조와 진료 연결성을 강조해 안전성이 좋아졌다.

3. **진료용 요약 화면은 제품 가치가 크다.**
   - 환자용 앱의 기록이 외래에서 바로 쓸 수 있는 구조가 된다.
   - 향후 EMR 복붙용 요약, ISI 변화, 수면효율 변화, 복약/졸림 리스크를 한 화면에 묶으면 실제 진료 시간이 줄어든다.

### 발견된 문제

#### 문제 1. 하단 네비게이션 겹침이 v0.3에서도 남아 있음

홈 화면에서 보조 버튼 영역이 하단 네비게이션과 가까워지고 일부 가려져 보인다.

확인된 버튼:

- `수면일기 바로 쓰기`
- `이번 주 세션 보기`

일기 화면에서도 마지막 입력 영역과 `오늘 일기 저장` 버튼 접근성이 불안정하다. 스크롤 후에도 하단 탭에 의해 마지막 입력칸/저장 버튼이 가려지는 것으로 보였다.

현재 CSS:

```css
.screen-wrap{position:absolute;inset:30px 0 78px;overflow:hidden}
.screen{position:absolute;inset:0;padding:14px 20px 96px;overflow-y:auto;...}
.bottom-nav{position:absolute;left:12px;right:12px;bottom:12px;height:58px;...}
```

96px padding이 들어갔지만 실제 화면에서는 충분하지 않다. 원인은 다음 가능성이 크다.

- `.screen-wrap` 자체가 `bottom:78px`로 잘려 있는데 내부 콘텐츠가 길어 nested scroll에 의존한다.
- 데스크톱 브라우저/모바일 터치에서 body가 아니라 `.screen`만 스크롤되어야 해서 사용자가 스크롤 가능성을 즉시 인지하기 어렵다.
- CTA가 화면 아래쪽에 배치되어 첫 화면에서 안 보인다.
- 하단 nav가 `position:absolute`로 떠 있어 시각적으로 콘텐츠 위에 겹친다.

#### 문제 2. 초기 평가 intro에서 `시작하기` CTA가 첫 화면에 보이지 않음

초기 평가 intro 화면에는 route-card가 5개 있고 그 아래 `시작하기` 버튼이 있다.

실제 브라우저 화면에서는 다음까지만 보인다.

- 불면 심각도
- 수면제 사용 여부
- 우울·불안 동반 여부

그 아래 항목과 `시작하기` CTA가 하단 nav 아래로 밀려 보이지 않는다. 사용자가 스크롤해야 하는 구조인데, 첫 진입 화면의 primary CTA가 안 보이는 것은 UX상 손실이다.

권장:

- 초기 평가 intro에서는 하단 nav를 숨기거나
- route-card 5개를 3개 + “더 보기” 구조로 줄이거나
- `시작하기` CTA를 sticky로 nav 위에 고정하거나
- 카드 리스트 대신 2열 compact row로 압축

#### 문제 3. route-card가 모두 같은 `data-go="intake"`로 연결됨

현재 intro의 다섯 route-card는 모두 같은 화면으로 이동한다.

```html
<button class="route-card" data-go="intake">ISI...</button>
<button class="route-card" data-go="intake">Rx...</button>
<button class="route-card" data-go="intake">M...</button>
<button class="route-card" data-go="intake">교대근무...</button>
<button class="route-card" data-go="intake">임상 안전 선별...</button>
```

사용자 입장에서는 “임상 안전 선별”을 누르면 해당 항목으로 바로 갈 것처럼 보인다. 하지만 실제로는 항상 intake 첫 단계로 간다.

권장:

- route-card별로 시작 step을 달리 지정
  - `data-go="intake" data-start-step="0"`
  - `data-go="intake" data-start-step="1"`
  - `data-go="intake" data-start-step="4"`
- 또는 route-card는 설명용으로 두고 `시작하기` 하나만 클릭 가능하게 변경

#### 문제 4. 안전 선별의 위기 분기 문구를 더 명확히 해야 함

v0.3은 조증/자살사고 등 안전 선별을 넣은 것이 강점이다. 다만 실제 환자용 앱에서는 자살사고/조증이 체크되었을 때 “CBT-I 진행”을 계속 유도하면 위험하다.

권장 분기:

- 자살사고 양성:
  - 앱 내 CBT-I 자동 진행 중단
  - “오늘 진료실/응급 도움 필요” 안내
  - 병원/보호자/응급 연락 안내
  - 진료용 요약에 red flag로 표시
- 조증 의심:
  - 수면제 감량/수면제한 처방 자동 권고 금지
  - 의사 평가 우선
- 수면무호흡/하지불안 의심:
  - 수면창 제한보다 원인 평가 우선

#### 문제 5. `오늘 일기 저장`의 데이터 저장 모델이 아직 프로토타입 수준

현재는 정적 HTML/JS 수준에서 수면 일기 계산을 보여주는 구조다. 향후 실제 앱이 되려면 최소한 다음이 필요하다.

- local persistence
- export JSON/CSV
- 진료용 요약 생성
- 7일 평균 계산
- ISI baseline/follow-up 변화 추적
- 약물 감량 주차와 수면효율 변화 연결

### CBT-I Care 우선순위

| 우선순위 | 보완점 | 이유 |
|---|---|---|
| P0 | 하단 nav 겹침 재수정 | 저장 버튼/CTA 접근성 문제. 실제 모바일 사용성 치명적 |
| P0 | Electron/React 전환 전에도 nested scroll QA 자동화 | 같은 결함이 v0.2→v0.3 반복됨 |
| P1 | route-card별 시작 step 분기 | 사용자가 누른 항목과 실제 화면이 불일치 |
| P1 | 자살사고/조증 양성 시 CBT-I 중단 분기 명확화 | 임상 안전 핵심 |
| P2 | 진료용 요약 export 구조 설계 | 외래에서 쓰는 제품 가치 강화 |
| P2 | 수면일기 7일 평균/수면효율 추세 계산 | CBT-I 핵심 지표화 |

### CBT-I 즉시 수정 제안

하단 nav 겹침을 줄이려면 단순히 `.screen` padding만 늘리는 것보다 구조를 바꾸는 편이 낫다.

권장 CSS 방향:

```css
:root{
  --bottom-nav-h: 82px;
}
.screen-wrap{
  position:absolute;
  inset:30px 0 0;
  overflow:hidden;
}
.screen{
  padding:14px 20px calc(var(--bottom-nav-h) + 36px + env(safe-area-inset-bottom,0px));
}
.bottom-nav{
  bottom:calc(12px + env(safe-area-inset-bottom,0px));
}
```

그리고 CTA가 하단에 있는 화면은 다음 중 하나를 적용하는 것이 좋다.

```css
.screen-cta-sticky{
  position:sticky;
  bottom:calc(var(--bottom-nav-h) + 12px);
  z-index:5;
}
```

---

## 2.3 DH Talk

### 변경 내용

`origin/claude/setup-electron-foundation-f66H8`에서 확인된 주요 변경:

```text
dh-talk/README.md
dh-talk/config/settings.yaml
dh-talk/package-lock.json
dh-talk/package.json
dh-talk/src/main/auth.js
dh-talk/src/main/cleanup.js
dh-talk/src/main/config.js
dh-talk/src/main/db.js
dh-talk/src/main/index.js
dh-talk/src/main/preload.cjs
dh-talk/src/main/server.js
dh-talk/src/main/validate.js
dh-talk/src/renderer/App.jsx
dh-talk/src/renderer/components/AlertPulse.jsx
dh-talk/src/renderer/components/BrowserNotice.jsx
dh-talk/src/renderer/components/DiagnosticsPanel.jsx
dh-talk/src/renderer/components/PatientQueue.jsx
dh-talk/src/renderer/lib/auth.js
dh-talk/src/renderer/main.jsx
dh-talk/src/renderer/styles.css
```

핵심 추가:

- WebSocket shared secret HMAC 인증
- nonce 기반 challenge-response
- sender 위장 방지
- 메시지 스키마 검증
- 파일 확장자 차단
- ack 위조 방지
- retention_days 설정 반영
- packaged 앱 config 위치 userData 이동
- 큐 비우기 확인창
- 운영 진단 패널
- 일반 브라우저 단독 실행 안내
- Electron 42 / electron-builder 26 업그레이드

### 잘 된 점

1. **WebSocket 인증 도입은 가장 중요한 보안 보강이다.**

기존 LAN 메신저는 같은 네트워크 안의 임의 클라이언트가 메시지를 넣을 수 있는 구조가 되기 쉽다. HMAC challenge-response로 최소한의 인증 경계를 만든 것은 좋다.

2. **sender를 클라이언트 입력이 아니라 인증된 socket.userId로 강제한 점이 좋다.**

`server.js`에서 다음처럼 처리한다.

```js
const sender = socket.userId;
const id = insertMessage({ ...msg, sender, ts });
```

즉, 클라이언트가 `sender: doctor`를 넣어도 서버 저장 시 인증된 userId로 덮는다. 의원 내부 메신저에서는 이게 중요하다.

3. **파일 확장자 차단이 들어갔다.**

`exe`, `bat`, `cmd`, `ps1`, `vbs`, `lnk`, `dll` 등을 차단한다. 데스크 PC 간 파일 전달에서 악성 실행 파일 전송 위험을 낮춘다.

4. **브라우저 단독 실행 안내는 개발/오해 방지에 좋다.**

Vite renderer를 직접 열었을 때 실제 앱이 아니라 안내 화면이 뜬다. Electron preload가 없는 상태에서 빈 화면/오작동이 나는 것보다 낫다.

### 발견된 문제

#### 문제 1. `npm install`이 현재 환경에서 실패함

현재 `package.json`:

```json
"engines": {
  "node": ">=20"
},
"devDependencies": {
  "electron": "^42.1.0",
  "electron-builder": "^26.8.1"
}
```

하지만 실제 설치 로그:

```text
electron@42.1.0 required node >=22.12.0
@electron/get@5.0.0 required node >=22.12.0
@electron/rebuild@4.0.4 required node >=22.12.0
current node v20.19.2
```

그리고 `better-sqlite3` native rebuild가 Electron 42의 V8 ABI와 맞지 않아 실패한다.

```text
error: no matching function for call to v8::External::Value()
error: no matching function for call to v8::External::New(...)
```

판단:

- 현재 `engines.node >=20`은 사실과 맞지 않다.
- Electron 42를 유지하려면 개발/빌드 Node를 `>=22.12.0`으로 올려야 한다.
- Windows 배포 PC 또는 GitHub Actions에서도 같은 문제가 날 가능성이 높다.

우선순위는 P0이다. 지금 상태로는 새 환경에서 `npm install`이 깨진다.

#### 문제 2. Electron 42 + better-sqlite3 조합은 배포 리스크가 크다

`better-sqlite3`는 Electron ABI에 맞춰 rebuild가 필요하다. Electron을 너무 최신으로 올리면 native addon 빌드 실패 가능성이 커진다.

선택지:

A. Electron 42 유지

- Node를 22.12 이상으로 고정
- README와 package.json engines를 수정
- GitHub Actions도 Node 22로 고정
- Windows 빌드 머신에서 `npm ci && npm run build:win` 검증

B. Electron을 안정 LTS 계열로 낮춤

- Electron 33 또는 35 계열로 고정
- 기존 Node 20 환경 유지 가능성 증가
- 보안 업데이트가 목적이면 Electron 33 최신 patch 또는 35/36 안정 버전 선택

현재 의원 운영용 MVP라면 B가 더 실용적이다. 최신 Electron보다 설치 재현성과 Windows 배포 안정성이 더 중요하다.

#### 문제 3. 설정 파일에 기본 shared key가 그대로 들어 있음

`settings.yaml`:

```yaml
auth:
  shared_key: "dhtalk-lan-secret-CHANGE-BEFORE-DEPLOY"
```

주석으로 변경 필요성이 명시되어 있지만, 기본값이 repo에 남아 있으면 실사용에서 그대로 배포될 위험이 있다.

권장:

- 기본값은 빈 문자열로 두고 앱 시작 시 blocking error
- 최초 실행 wizard 또는 `scripts/generate-shared-key.js` 제공
- README에 4대 PC 동일 키 배포 절차 명시
- key는 userData의 settings.yaml에만 저장

예:

```yaml
auth:
  shared_key: ""
```

앱 시작 시:

```text
shared_key가 비어 있습니다. 데스크1에서 생성한 키를 4대 PC에 동일하게 입력하세요.
```

#### 문제 4. 인증 실패/스키마 실패가 UI에 충분히 표시되는지 확인 필요

서버에서는 로그를 남기고 연결을 닫는다.

```js
socket.close(4001, 'auth failed');
```

하지만 실제 데스크 직원 화면에서 “왜 연결이 안 되는지” 알 수 있어야 한다.

운영 진단 패널이 추가된 것은 좋지만, 반드시 다음을 보여줘야 한다.

- 서버 IP/포트
- 내 userId
- shared key 설정 여부
- 인증 상태
- 마지막 연결 실패 이유
- 마지막 서버 응답 시간
- WebSocket close code/reason

#### 문제 5. 파일 검증은 확장자 기반이라 충분하지 않다

현재 실행 파일 확장자 차단은 유용하지만 우회 가능하다.

예:

- `malware.pdf.exe`는 마지막 ext가 exe라 차단됨
- 하지만 `malware.pdf` 안에 악성 macro/스크립트가 있을 수 있음
- `.hwp`, `.docm`, `.xlsm` 같은 macro 문서 정책도 정해야 함

의원 워크플로우상 현실적인 정책:

- v1: 위험 실행 확장자 차단 + 5MB 제한 유지
- v1.1: 허용 확장자 allowlist로 전환
  - pdf, jpg, jpeg, png, hwp, hwpx, docx, xlsx 정도
- v2: 파일 열기 전 경고/다운로드 폴더 격리

#### 문제 6. WebSocket payload 상한과 파일 상한이 이중으로 다름

`server.js`:

```js
const MAX_PAYLOAD = 16 * 1024 * 1024;
```

`validate.js`:

```js
const MAX_FILE_B64 = Math.ceil((5 * 1024 * 1024 * 4) / 3) + 16;
```

검증상 5MB 제한은 맞지만, WebSocket 레벨은 16MB까지 받는다. 실제 위험은 크지 않지만 운영 기준은 통일하는 것이 좋다.

권장:

- 상수를 `src/shared/limits.js`로 분리
- UI에도 같은 제한 표시
- 서버 validate와 WebSocket maxPayload를 같은 기준에서 계산

#### 문제 7. unit test 스크립트가 package.json에 없음

현재 기능은 늘었지만 `npm test`가 없다. 인증/검증/큐 파서/cleanup은 테스트 스크립트가 반드시 필요하다.

권장 최소 테스트:

- `validateInbound()` 정상/비정상 메시지
- `verifyHmac()` 정상/오류/길이 mismatch
- sender spoofing이 서버에서 덮이는지
- ack는 인증 userId로만 기록되는지
- blocked ext 차단
- file size 초과 차단
- queue parser 이름/시간 파싱
- retention_days 반영

### DH Talk 우선순위

| 우선순위 | 보완점 | 이유 |
|---|---|---|
| P0 | Electron 42/Node/better-sqlite3 설치 실패 해결 | 새 환경에서 `npm install` 실패. 배포 차단 |
| P0 | `engines.node`와 README를 실제 필요 버전에 맞춤 | 현재 `>=20`은 틀림 |
| P1 | shared_key 기본값 제거 + 최초 설정 flow | 기본 키 그대로 배포되는 위험 |
| P1 | 인증 실패/연결 실패를 UI 진단 패널에 명확히 표시 | 데스크에서 문제 해결 가능해야 함 |
| P1 | package.json에 test 스크립트 추가 | 보안 로직이 늘었는데 자동 검증 없음 |
| P2 | 파일 정책 allowlist화 | 의원 문서 전송 보안 강화 |
| P2 | payload/file size 상수 통합 | 유지보수성 개선 |

### DH Talk 즉시 수정 제안

가장 안전한 단기 수정은 둘 중 하나다.

#### 선택지 A. Node 22로 공식 전환

```json
"engines": {
  "node": ">=22.12.0"
}
```

추가:

- `.nvmrc`에 `22`
- README에 Node 22.12+ 명시
- GitHub Actions가 있다면 `actions/setup-node@v4`에서 `node-version: 22`
- Windows 빌드 PC도 Node 22로 고정

#### 선택지 B. Electron을 안정 버전으로 낮춤

```json
"devDependencies": {
  "electron": "^35.x" 또는 검증된 "33.x",
  "electron-builder": "^25.x" 또는 호환 버전
}
```

MVP 배포 목적이면 B가 더 현실적이다. Electron 42 보안 업데이트 목적은 이해되지만, native module과 Windows 설치본 안정성이 먼저다.

---

## 3. 병합 전 주의점

현재 내 로컬 `/opt/data/victory` main에는 이전 분석 때 만든 수정/보고서가 아직 uncommitted 상태다.

```text
M index.html
M prototype/cbti-v0.2.html
?? reports/
```

이번 원격 브랜치 분석은 별도 worktree에서 수행했기 때문에 main 작업물을 덮지는 않았다.

병합 순서 권장:

1. 현재 로컬 보고서/수정분을 commit 또는 stash
2. CBT-I v0.3 브랜치 merge
3. 하단 nav 겹침 수정 반영
4. DH Talk 브랜치 rebase 또는 최신 main 기준 재생성
5. DH Talk Electron/Node/better-sqlite3 설치 실패 해결
6. Windows 빌드 검증

---

## 4. 최종 권고

### 지금 바로 고쳐야 할 것

1. CBT-I v0.3 하단 nav 겹침
   - 홈 보조 버튼
   - 일기 저장 버튼
   - 초기 평가 CTA

2. DH Talk 설치 실패
   - Electron 42가 Node 22.12+를 요구함
   - 현재 package.json은 Node >=20으로 되어 있어 불일치
   - `better-sqlite3` rebuild 실패가 배포 차단점

3. DH Talk shared_key 기본값 제거
   - `CHANGE-BEFORE-DEPLOY`가 그대로 배포될 가능성 제거 필요

### 다음 단계로 좋은 것

1. CBT-I 임상 안전 분기 강화
   - 자살사고/조증 양성 시 CBT-I 진행 중단 및 진료 우선 안내

2. DH Talk 자동 테스트 추가
   - 인증/검증/큐/retention 최소 테스트 스크립트

3. Relax Routine과 CBT-I 공통 모바일 shell 분리
   - 하단 nav/스크롤/CTA 겹침 문제 재발 방지

---

## 5. 판정

| 프로젝트 | 현재 상태 | 판정 |
|---|---|---|
| Relax Routine | 이번 추가 변경 거의 없음. 기존 v0.5 유지 | 안정, 공통 shell 분리 권장 |
| CBT-I Care | v0.3 기능 방향 좋음. 임상 안전성 강화됨. 하단 nav 겹침 반복 | 병합 전 UI 수정 필요 |
| DH Talk | 보안/운영 기능은 좋아졌으나 Electron 42 설치 실패 | 병합 전 빌드 환경 수정 필수 |

전체적으로 방향은 좋다. 다만 이번 수정분은 **CBT-I는 모바일 하단 레이아웃**, **DH Talk는 설치/빌드 재현성**이 각각 병합 전 P0다.
