# Victory 4개 프로젝트 실사용 직전 품질 감사 보고서

작성일: 2026-05-19
대상 repo: `/opt/data/victory-cbti-work`, `origin/main`
기준 커밋: `08f021f Remove relax routine obstructive controls`
검증 환경: local HTTP server, Browser smoke, pytest, Vite build, npm audit

## 0. 결론

| 프로젝트 | 최신 검토 버전 | 판정 | 실사용 직전 여부 | 핵심 blocker |
|---|---:|---|---|---|
| Relax Routine | v1.3 | 조건부 가능 | 80% | 세션 시작 시 완료/진도 기록이 너무 빨리 들어감 |
| CBT-I Care | v1.1 | 조건부 가능 | 75% | UI 상단 버전이 v1.0으로 남아 신뢰도 손상, 임상 오류 입력 시각화 부족 |
| Behavioral Activation / ActivaCare | v0.8 | 조건부 가능 | 75% | 안전 체크 UI가 고위험 선택지도 체크 표시처럼 보임 |
| DH Talk | Electron app | 미달 | 60% | 서버가 shared_key 미설정 시 인증 fail-open 가능 |

전체 결론: 네 프로젝트 모두 “프로토타입 시연”은 가능하지만, “실사용 직전”으로 보기에는 아직 부족하다. 특히 DH Talk은 실제 LAN 환경에서 쓰기 전 P0 보안 수정이 필요하다. 나머지 3개는 P0 치명 오류는 없지만, 임상/사용자 신뢰를 깨는 P1 이슈가 남아 있다.

## 1. 검증 범위와 실행 로그

실행한 검증:

```bash
git fetch origin --prune && git checkout main && git pull --ff-only origin main
pytest -q
cd dh-talk && npm run build
cd dh-talk && npm audit --omit=dev --audit-level=high
cd dh-talk && npm audit --audit-level=high || true
python3 -m http.server 4183
```

결과:

- Python 회귀 테스트: `35 passed in 3.54s`
- DH Talk Vite build: 성공, `✓ built in 875ms`
- DH Talk production dependency audit: `found 0 vulnerabilities`
- DH Talk full audit: high 취약점 10개 포함 12개, 주로 dev/build chain 및 Electron 33 계열 advisory
- 브라우저 콘솔: Relax / CBT-I / ActivaCare / DH Talk fallback 모두 확인 범위에서 JS error 없음

파일 크기:

```text
32M  relax-routine/prototype/v1.3.html
40K  cbti-care/prototype/v1.1.html
48K  behavioral-activation/prototype/v0.8.html
```

Relax Routine은 단일 self-contained HTML이 32MB라 모바일 첫 로딩에는 여전히 무겁다.

## 2. 프로젝트별 판정

## 2.1 Relax Routine v1.3

### 확인된 정상 동작

- 최신 index가 v1.3으로 연결됨.
- 하단 `내보내기 / 초기화` 플로팅 버튼 제거 확인.
- 첫 화면에서 `오늘의 추천 세션 시작` CTA가 명확히 보임.
- CTA 클릭 시 overlay가 제거되고 복식호흡 세션 화면으로 진입함.
- 세션 화면에서 `시작하기`, `일시정지`, `중단하고 나가기`까지 표시됨.
- 콘솔 오류 없음.
- viewport: `width=device-width, initial-scale=1.0, viewport-fit=cover`.

### 발견 이슈

#### P1. 세션 완료 전 진도/완료 기록이 먼저 증가함

관찰:

- `오늘의 추천 세션 시작`을 누르는 순간 localStorage에 `completedRoutines`, `completedDates`, `progress`가 기록된다.
- 실제로 아직 `시작하기`를 누르지 않았고 세션을 끝내지도 않았는데 progress가 `50%`까지 올라간 상태가 관찰됐다.
- 세션 화면에는 `중단하고 나가기 — 완료로 기록되지 않습니다`라고 되어 있어, 실제 저장 동작과 문구가 충돌한다.

영향:

- 사용자가 시작만 하고 중단해도 완료로 집계될 수 있다.
- 치료적 자기모니터링 데이터 신뢰도가 떨어진다.

권장 수정:

- CTA 클릭 시에는 `activeSession`, `lastStarted`, `recommendedRoutine`만 저장.
- `recordRoutineProgress`는 실제 세션 완료 시점에만 호출.
- `중단하고 나가기`, `뒤로`, `홈`은 완료 기록을 남기지 않도록 통일.

#### P1. 단일 HTML 32MB로 모바일 첫 로딩 부담이 큼

관찰:

- `v1.3.html` 크기: 32MB.
- self-contained bundle 구조라 데모 배포에는 편하지만 실제 모바일 접근에서는 첫 로딩, 캐시, 저사양 기기 안정성이 불리하다.

권장 수정:

- 단기: 현재 artifact는 유지하되 로딩 상태 문구와 skeleton 품질 개선.
- 중기: 원본 build source에서 asset 분리/압축/PWA cache 전략으로 전환.

#### P2. CTA 흐름은 좋아졌지만 “몇 분짜리 세션인지” 첫 CTA에 부족

권장 수정:

- `오늘의 추천 세션 시작` 아래에 `복식호흡 · 약 1분 · 완료 전에는 기록되지 않음` 같은 문구 추가.

### 판정

실사용 직전 80%. 흐름은 크게 개선됐지만, 완료 전 기록 문제는 다음 코딩 라운드 1순위다.

---

## 2.2 CBT-I Care v1.1

### 확인된 정상 동작

- 최신 index가 v1.1로 연결됨.
- 첫 실행은 빈 상태로 시작하고, 7일 미만에서는 수면창 권고를 보류함.
- `QA 7일 데이터 입력` 후 리포트 생성 정상.
- 관찰된 리포트:
  - 권고 수면창 상태: `적용 가능`
  - 권고 수면창: `6h 48m`
  - 계산 설명: 최근 7일 평균 TST + 30분, 최소 5시간 안전 하한, 최대 9시간 상한
- 콘솔 오류 없음.
- viewport: `width=device-width, initial-scale=1, viewport-fit=cover`.

### 발견 이슈

#### P1. v1.1 파일인데 앱 상단 pill은 `v1.0`으로 표시됨

관찰:

- `cbti-care/prototype/v1.1.html` title은 v1.1.
- 앱 화면 상단에는 `CBT-I CARE / v1.0 / 출시 직전 앱 수준`으로 표시됨.

영향:

- 실제 사용 전 최종 확인에서 버전 신뢰도 손상.
- 진료 현장에서 스크린샷/피드백 수집 시 어떤 버전인지 혼란.

권장 수정:

- v1.1 표시를 전 surface에서 통일.
- index 설명도 현재 v1.1 기능인 SRT 상태 분류를 정확히 반영.

#### P1. “적용 가능/보류/진료 확인 필요”는 생겼지만 보류 사유 UI가 아직 약함

관찰:

- 리포트에는 상태가 표시되지만, 사용자/의사가 빠르게 보기에 어떤 조건 때문에 보류됐는지 badge화가 부족하다.

권장 수정:

- 예: `7일 미만`, `졸림 위험`, `조증/양극성 위험`, `수면무호흡 의심`, `TST>TIB 입력 오류`를 별도 chips로 표시.
- 진료 리포트에도 `보류 사유` 항목 분리.

#### P1. 임상적으로 불가능한 입력값의 신뢰도 경고가 아직 충분히 강하지 않음

권장 수정:

- TST > TIB, SOL+WASO+TST > TIB, 지나치게 높은 SE 등은 리포트 최상단에 `자료 신뢰도 낮음` 표시.
- 권고 수면창 자동 계산은 해당 데이터 제외 또는 보류.

#### P2. QA 기능이 사용자 화면에 그대로 노출됨

관찰:

- `QA 7일 데이터 입력`, `데이터 가져오기`가 리포트 화면의 일반 기능처럼 노출된다.

권장 수정:

- 실제 배포용에서는 `개발자/검증 모드` 접힘 영역 뒤로 이동.

### 판정

실사용 직전 75%. 계산 엔진과 안전 문구는 좋아졌지만, 버전 표시 불일치와 데이터 신뢰도 UI가 남아 있다.

---

## 2.3 Behavioral Activation / ActivaCare v0.8

### 확인된 정상 동작

- 최신 v0.8 직접 로드 정상.
- 오늘 행동 CTA, 체크 모달, 타이머, 완료 기록 저장 흐름 작동.
- 완료 저장 후 Review 화면으로 이동하고 기록이 localStorage에 저장됨.
- 성공률 추이 bar 7개와 `data-rate` 값 확인.
- 외래 요약에서 추천 근거, 가치 영역, 마찰 조건 설명 확인.
- 콘솔 오류 없음.

### 발견 이슈

#### P1. 안전 체크 고위험 선택지가 모두 체크 표시처럼 보임

관찰:

외래 탭 안전 체크에서 다음 선택지들이 모두 `✓`와 함께 표시된다.

- 위험 신호 없음
- 죽고 싶다는 생각이 스쳐 지나감
- 자주 있거나 구체적 계획이 있음

영향:

- 고위험 항목이 “선택됨/정상 확인됨”처럼 보일 수 있다.
- 자살위험 상황에서 UI 의미가 모호하다.

권장 수정:

- 기본값은 `위험 신호 없음`만 선택 상태.
- 다른 항목은 선택 전에는 빈 circle 또는 `선택 시 안전 플랜으로 전환`으로 표시.
- `자주 있거나 구체적 계획` 선택 시 행동 처방 UI를 중단하고 안전 연결 화면으로 전환.
- 안전 화면에는 119/응급실/자살예방상담전화 109/보건소 생명존중사업 의뢰 문구 포함.

#### P1. 타이머 시작 후 모달 DOM/버튼 잔류가 관찰됨

관찰:

- `타이머 시작` 후 화면에는 타이머가 나오지만, DOM probe에서 `실행 전 체크` dialog와 `완료 기록 저장`, `부분 수행으로 저장` 버튼이 함께 남아 있었다.
- 시각적으로는 큰 문제 아닐 수 있으나 접근성 tree나 키보드 navigation에서는 혼란 가능성이 있다.

권장 수정:

- 타이머 시작 시 pre-check modal을 완전히 닫고, 완료/부분 저장은 timer 완료 또는 중단 화면에서만 노출.
- `aria-hidden`/focus trap 정리.

#### P1. 타이머를 끝까지 기다리지 않아도 완료 저장 버튼을 누를 수 있음

관찰:

- DOM상 `완료 기록 저장` 버튼을 즉시 클릭 가능했다.

영향:

- 실제 행동 수행 전 완료 기록이 들어갈 수 있다.

권장 수정:

- 완료 버튼은 timer 완료 후 활성화.
- 중간에는 `부분 수행으로 저장`만 허용.

#### P2. 추천 근거가 아직 다소 전문가용 표현에 가까움

권장 수정:

- 환자 화면: “이 조건이 가장 덜 부담스러웠어요”처럼 단순화.
- 외래 화면: 현재처럼 가치 영역/마찰 조건/성공률 설명 유지.

### 판정

실사용 직전 75%. 핵심 BA 흐름은 작동하지만 안전 UI와 completion semantics는 수정해야 한다.

---

## 2.4 DH Talk / DK Talk

### 확인된 정상 동작

- `npm run build` 성공.
- 브라우저에서 renderer dist를 열면 blank 대신 안전 fallback 표시:
  - `DH Talk은 Electron 앱에서 실행해야 합니다`
- Electron 보안 기본값은 양호한 편:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
- 서버가 메시지 sender를 client payload가 아니라 `socket.userId`로 보정함.
- 공유키 저장 UI, 설정 진단, 체크리스트가 존재함.
- production dependency audit: 취약점 없음.

### 발견 이슈

#### P0. 서버가 shared_key 미설정 시 인증 fail-open 됨

근거:

`dh-talk/src/main/server.js`

```js
if (!authToken) {
  console.warn('[server] DHTALK_SHARED_KEY/server.shared_key 미설정 — LAN 인증이 비활성화됩니다. 실사용 전 반드시 설정하세요.');
}
...
if (authToken && token !== authToken) {
  return reject(socket, 'auth_failed', '공유키가 일치하지 않습니다.');
}
```

`authToken`이 없으면 token 검증이 생략된다.

기본 설정:

`config/settings.yaml`

```yaml
shared_key: "CHANGE_ME_BEFORE_USE"
```

현재 기본값은 서버 authToken으로 들어갈 수 있고, 미설정/오설정 시 경고만 하거나 기본키 상태로 동작할 여지가 있다.

영향:

- 실제 LAN에서 인증 없는 접속/메시지 주입 가능성이 생긴다.
- 병원 내부 메신저로는 실사용 전 반드시 fail-closed가 필요하다.

권장 수정:

- 서버 시작 시 shared_key가 없거나 `CHANGE_ME_BEFORE_USE`이거나 20자 미만이면 WebSocket 서버를 시작하지 말고 명시적 오류 상태로 진입.
- renderer도 shared key missing 상태에서는 socket 연결 자체를 열지 않도록 수정.
- 테스트 추가: missing/default/short key일 때 `startServer` 또는 connect가 거부되는지 확인.

#### P1. `ws://` 평문 LAN 통신

관찰:

- renderer가 `new WebSocket(`ws://${host}:${info.wsPort}`)` 사용.

해석:

- 로컬 폐쇄망이면 당장 TLS가 필수는 아닐 수 있으나, 환자명/호출/메모가 오갈 수 있어 실제 배포 전 네트워크 범위를 명확히 제한해야 한다.

권장 수정:

- 단기: 공유키 강제 + 방화벽 allowlist + 같은 서브넷 안내.
- 중기: wss 또는 Tailscale/ZeroTier 같은 암호화 overlay 전제.

#### P1. full npm audit high 취약점 존재

관찰:

- production dependency audit는 clean.
- full audit는 Electron 33 및 electron-builder chain에서 high advisory가 다수.

권장 수정:

- 배포 빌드 전 Electron 최신 안정 major 호환성 검토.
- electron-builder 26 계열 업그레이드는 breaking 가능성이 있어 별도 브랜치에서 검증.

#### P1. Electron GUI end-to-end 테스트 미완료

관찰:

- 현재 환경에서는 실제 Windows LAN 2-PC 환경을 재현하지 못했고, renderer fallback/build/source audit까지만 수행.

권장 실사용 전 테스트:

- desk1 서버 PC + doctor/desk2 client PC 2대 이상에서 실제 메시지 송수신.
- shared_key 불일치/누락/짧은 키 시 연결 차단.
- 방화벽 차단 시 진단 안내 정확도.
- 알림 ack/escalation이 특정 메시지 id에 정확히 작동하는지 확인.

### 판정

실사용 직전 60%. UI/빌드는 진전됐지만, fail-open 인증은 병원 메신저 실사용 전 P0다.

---

## 3. 공통 리스크

### 3.1 “완료 기록” 의미가 앱마다 너무 빨리 저장되는 경향

- Relax Routine: 세션 완료 전 progress 증가.
- ActivaCare: timer 완료 전 완료 저장 버튼 가능.

권장 공통 원칙:

- 시작 기록과 완료 기록 분리.
- `startedAt`, `completedAt`, `abortedAt`, `partial`를 구분.
- 임상 요약에는 완료/부분/중단을 분리 표시.

### 3.2 QA/개발자 기능이 사용자 화면에 노출됨

- CBT-I의 `QA 7일 데이터 입력`.
- 실제 사용 전에는 접힘/숨김/개발자 모드 전환 필요.

### 3.3 버전 표시와 index 설명의 불일치

- CBT-I v1.1 화면이 v1.0으로 표시.
- 사용자가 피드백할 때 버전 혼선 가능.

## 4. 다음 코딩 라운드 권장 순서

1. DH Talk P0 인증 fail-closed
   - shared_key 미설정/default/20자 미만이면 서버 시작 차단.
   - renderer connect도 차단.
   - 테스트 추가.

2. Relax Routine 완료 기록 시점 수정
   - 시작과 완료 저장 분리.
   - 중단/뒤로/홈에서는 완료 기록 금지.

3. ActivaCare 안전 체크 및 완료 버튼 gating
   - 고위험 안전 선택지 UI 수정.
   - 타이머 완료 전 완료 저장 비활성화.
   - 자살위험 선택 시 안전 화면 전환과 생명존중사업/109/응급 연결.

4. CBT-I v1.1 버전 표시와 데이터 신뢰도 badge
   - 모든 surface v1.1 통일.
   - TST/TIB 오류, 안전 플래그 보류 사유 chip화.

## 5. 최종 판정

현재 네 프로젝트는 “데모 가능한 후기 프로토타입” 단계다. “실사용 직전”까지는 한 라운드 이상 더 필요하다.

가장 중요한 차이는 기능 수가 아니라 기록 신뢰성·안전 gating·보안 fail-closed다. 다음 라운드에서 위 P0/P1을 해결하면 세 프로젝트는 실제 파일럿에 가까워지고, DH Talk은 LAN 실사용 후보 수준으로 올라갈 수 있다.
