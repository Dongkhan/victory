# Victory 5개 제품 추가 개선점 분석 보고서

작성일: 2026-05-26 13:16 UTC
대상 repo: `Dongkhan/victory`
검토 기준: `origin/main` / merge commit `82b66b6` / PR #8 병합 후 최신 main
대상 제품: Relax Routine, Behavioral Activation, CBT-I Care, DH-TALK V2, Digital Family Coach

## 0. 현재 완료 상태

PR #8 `fix: harden five Victory products`를 squash merge하여 최신 main에 반영했다.

반영 완료 항목:

- RR v3.1: `RelaxRouteStack` 참조 오류, storage key drift, CSS keyframes 중첩 오류 수정
- BA v2.8: Crisis Lock fail-closed, `tel:119`/`tel:109` CTA, legacy version residue 제거
- CBT-I v2.272: SRT safety copy 정합화, `tel:119`/`tel:109` CTA, stale service-worker path 제거
- DFC P2: `esc()` 적용, 계약서 prerequisite guard, crisis aria/default 표시, `tel:119`/`tel:109` CTA, getter형 QA hook
- DHT2: Supabase mutation failover, `syncState: pending`, alert ACK zero-row 검출, WebAudio 호출음, object URL cleanup

검증 완료:

- `python -m pytest -q` → 88 passed
- `cd DH-TALK_V2/app && npm test -- --run` → 17 files / 35 tests passed
- `cd DH-TALK_V2/app && npm run build` → success
- Browser smoke: RR v3.1, BA v2.8, CBT-I v2.272, DFC P2, DHT2 dev app
- GitHub PR #8 Vercel check success 후 merge 완료

## 1. 요약 판정

이전 보고서의 핵심 P0/P1/P2 항목은 main에 반영되었다. 다음 단계는 “프로토타입 안전장치”보다 “운영 데이터 정합성, 실제 Supabase 스키마, localStorage 실패/손상, 접근성 상태관리”가 중심이다.

최우선 수정 권고:

1. DHT2 Supabase DB schema와 앱 코드 불일치 해결
2. DHT2 인증/RLS 운영 플로우 명확화
3. DFC 위기 상태 reload fail-closed 보강
4. CBT-I SRT action gate를 7일 기록/자료 품질 조건과 일치
5. BA crisis notice runtime overwrite 시 전화 CTA 유지

## 2. P0 즉시 수정 권고

### P0-1. DHT2 신규 환자 ID가 Supabase uuid 컬럼과 불일치

근거:

- `DH-TALK_V2/app/src/features/patients/usePatientBoard.ts:145-146`
  - `createPatientId()`가 `p-${Date.now()}-...` 문자열 ID 생성
- `DH-TALK_V2/supabase/migrations/001_initial_schema.sql:22-23`
  - `patients_today.id uuid primary key`

영향:

Supabase 연동 환경에서 신규 환자 또는 예약표 붙여넣기 환자 upsert가 `invalid input syntax for type uuid`로 실패할 수 있다. 현재 failover 덕분에 로컬 pending으로 남겠지만, 원격 동기화 자체는 계속 실패한다.

권고:

- 프론트 신규 ID를 `crypto.randomUUID()`로 변경
- legacy local id가 남아 있을 때는 remote insert 시 UUID 재매핑 테이블을 둔다
- 회귀 테스트: Supabase repository upsert payload의 `id`가 UUID regex를 만족해야 함

### P0-2. DHT2 call_alerts ACK 컬럼이 앱 코드와 migration에서 불일치

근거:

- 앱 코드: `DH-TALK_V2/app/src/data/callRepository.ts`
  - `acknowledged_by`, `acknowledged_device` select/update 사용
- migration: `DH-TALK_V2/supabase/migrations/001_initial_schema.sql:58-67`
  - `call_alerts`에는 `acknowledged_at`만 존재

영향:

운영 DB가 migration 기준이면 호출 목록 조회 또는 ACK 처리 시 컬럼 없음 오류가 발생한다. 최근 ACK zero-row 하드닝은 유효하지만, schema가 맞지 않으면 ACK 플로우가 시작부터 실패한다.

권고:

- 새 migration 추가:
  - `acknowledged_by uuid references auth.users(id) on delete set null`
  - `acknowledged_device text`
- 또는 앱 코드에서 해당 컬럼 사용을 제거하고 `acknowledged_at`만 사용
- Supabase migration test 또는 static schema test 추가

### P0-3. DHT2 RLS는 authenticated 전용인데 로그인/세션 플로우가 없음

근거:

- `DH-TALK_V2/supabase/migrations/001_initial_schema.sql:100-119`
  - 주요 policy가 모두 `to authenticated`
- `DH-TALK_V2/app/src/lib/supabaseClient.ts`
  - anon client 생성만 있음
- 앱 전체에 `signIn`, `getSession`, `auth.` 기반 인증 플로우 없음

영향:

환경변수만 설정한 운영 배포에서는 anon 상태로 read/write가 막힐 가능성이 높다. UI는 “원격 연결”처럼 보이지만 실제 저장은 전부 실패하고 pending failover로만 동작할 수 있다.

권고:

- MVP 운영 방식 중 하나를 명확히 선택
  1. clinic shared login/session UI 추가
  2. service role을 쓰는 안전한 backend proxy 도입
  3. RLS policy를 현재 MVP 운영 방식에 맞게 재설계
- 연결 상태 UI에 “인증됨/인증 안 됨/RLS 차단”을 구분 표시

### P0-4. DFC 위기 상태가 reload 후 일반 화면으로 복귀할 수 있음

근거:

- `family-link-coach/index.html:303`
  - crisis toggle에서 `save()`가 먼저 실행되고, 그 뒤 `render('crisis')`
- `family-link-coach/index.html:309`
  - 초기 로드는 `render(state.screen||'start')`만 수행

영향:

위기 신호가 true로 저장되어 있어도 `state.screen`이 이전 화면이면 새로고침 후 일반 실행 화면이 먼저 보일 수 있다. “위기 시 규칙 조정 중단” 원칙에는 reload fail-closed가 필요하다.

권고:

- 초기 render 전 `if (hasCrisisLock()) state.screen='crisis'`
- crisis toggle 시 `state.screen='crisis'`를 먼저 설정하고 저장
- 회귀 테스트: crisis=true localStorage를 주입하고 reload 시 crisis 화면이어야 함

### P0-5. BA crisis notice가 runtime에서 tel CTA를 덮어쓸 수 있음

근거:

- `behavioral-activation/prototype/v2.8.html`에 `tel:119`, `tel:109` CTA는 있음
- 하지만 `applyCrisisLock()`이 `#crisisLockNotice.innerHTML`을 텍스트 중심으로 다시 씀

영향:

위기 플래그 선택 후 실제 사용자가 보는 crisis notice에서 전화 CTA가 사라질 수 있다.

권고:

- `applyCrisisLock()`이 crisis notice를 재작성할 때도 `tel:119`, `tel:109` 링크 유지
- 브라우저 회귀: crisis flag toggle 후 `document.querySelectorAll('a[href^="tel:"]')` 존재 확인

## 3. P1 다음 라운드 수정 권고

### P1-1. CBT-I SRT action gate가 7일 기록/자료 품질 조건과 불일치

근거:

- `calculateSrtRecommendation()`은 7일 미만, 자료 신뢰도 낮음, safety gate 미확인 시 보류 처리
- `srtSafe()`는 `reviewed && hardFlags().length===0` 중심

영향:

안전 체크만 통과하면 7일 기록이 부족해도 일부 SRT action 버튼이 활성화될 수 있다.

권고:

- SRT 버튼 활성 조건을 `calculateSrtRecommendation().status === 'ready'`와 일치
- “진료 확인 전 참고용”과 “실제 제한 권고”를 DOM 상태에서도 분리

### P1-2. DHT2 pending local changes 재전송 큐가 없음

근거:

- 원격 실패 시 `syncState: 'pending'`으로 fallback 저장
- 네트워크 복구 후 pending만 골라 remote upsert하는 replay loop 없음

영향:

복구 후 원격 목록이 다시 로드되면 로컬 pending 변경이 화면에서 사라질 수 있다.

권고:

- outbox queue 도입
- `pending`, `syncing`, `failed` 상태 분리
- “동기화 재시도” 버튼 추가

### P1-3. DHT2 failed local alert dismiss가 원격 ACK에 묶임

근거:

- 전송 실패 시 `failed-alert-*`를 local state에 추가
- 닫기 시 항상 `callRepository.closeAlert(id)` 호출
- Supabase에는 없는 ID이므로 zero-row error 가능

영향:

네트워크 장애 중 생긴 failed alert가 닫히지 않을 수 있다.

권고:

- `syncState === 'failed'` 또는 `id.startsWith('failed-alert-')`는 로컬 dismiss 우선
- 원격 ACK와 로컬 dismiss action을 분리

### P1-4. DHT2 Realtime 연결 실패/끊김 상태 감지와 polling backup 부족

근거:

- `patientRealtime.ts`, `callRealtime.ts`에서 subscribe 상태 콜백/에러 상태를 UI에 반영하지 않음

영향:

실시간 연결이 끊겨도 UI가 이를 명확히 알리지 못하고, 데스크-진료실 변경 누락이 발생할 수 있다.

권고:

- Realtime status: `connected`, `degraded`, `disconnected`
- disconnected 시 10~30초 polling fallback
- 마지막 수신 시각 표시

### P1-5. BA/CBT-I localStorage disabled/quota 상황에서 런타임 예외 가능

근거:

- BA `save()`가 `localStorage.setItem`을 try/catch 없이 호출
- CBT-I `persist()`/초기화도 storage 실패 UX가 부족

영향:

Safari private mode, storage disabled, quota exceeded에서 저장/위기 체크/일기 입력이 예외로 끊길 수 있다.

권고:

- safeStorage wrapper 도입
- 저장 실패 시 “이번 세션만 유지” 상태로 fallback
- local-only 안내에 “저장 실패 시 세션 종료 후 사라짐” 표시

### P1-6. DFC localStorage 상태 검증 부족

근거:

- `load()`가 shallow merge만 수행
- `state.concerns.includes`, `state.childGoals.includes`, `state.selfLog.push` 등 타입 가정 사용

영향:

이전 버전/수동 변경/부분 손상 localStorage에서 앱이 렌더 중 중단될 수 있다.

권고:

- schema version 기반 migration/normalize
- 배열/객체/string/number 타입 guard
- 손상 상태 감지 시 “로컬 상태 복구” 안내

### P1-7. DFC 위기 해제 버튼이 단일 클릭으로 전체 해제됨

근거:

- `위기 신호 없음으로 되돌리기` 단일 버튼
- 클릭 즉시 모든 crisis flag false

영향:

자해/폭력/학대 등 고위험 신호가 실수로 쉽게 해제될 수 있다.

권고:

- 개별 flag 해제 또는 확인 modal 추가
- “안전한 어른과 확인했음” 체크 후 해제

## 4. P2 개선 권고

### P2-1. DHT2 localStorage 평문 민감정보 보존 정책 필요

환자명, 운영 메모, 호출 내용이 localStorage에 남는다. 공유 PC 환경에서는 보존 기간, 자동 만료, 시작 시 “오늘 기록 초기화”, 민감정보 최소화 문구가 필요하다.

### P2-2. DHT2 삭제 실패 tombstone/pending delete 부족

오프라인 삭제가 원격 복구 후 되살아날 수 있다. 삭제도 pending queue와 tombstone이 필요하다.

### P2-3. DHT2 환자 카드 키보드 접근성 부족

clickable `<article>`에 `role`, `tabIndex`, keyboard handler가 부족하다.

### P2-4. DHT2 입력 길이 제한 UI 부족

DB check constraint는 operational note 120자, message body 500자인데 UI에 `maxLength`/counter가 부족하다.

### P2-5. RR title/version drift

파일과 body는 v3.1이나 embedded script에 v2.4/v2.5/v2.13 title 갱신이 남아 있다. QA/배포 확인 혼란을 줄이려면 document.title도 v3.1로 통일해야 한다.

### P2-6. RR crisis number set 일관성

RR 내부 safety copy에서 109/1577-0199/129/119/응급실 조합이 화면별로 다르다. “119/응급실, 109, 지역 정신건강복지센터/보건소 생명존중사업” 순서로 통일하는 것이 좋다.

### P2-7. BA/DFC modal focus management

modal/sheet가 열릴 때 focus 이동, Escape 닫기, background inert/focus trap이 부족하다.

### P2-8. DFC 공식 보호 도구 실행 가이드 구체화

Family Link/Screen Time 안내가 아직 “공식 도움말 확인” 수준이다. 실제 실행성을 높이려면 Android/iOS별 설정 경로, 자녀에게 설명할 문장, 예외 설정 실수 방지 항목을 분리해야 한다.

### P2-9. DFC contract rule 하드코딩 제거

계약서의 “숙제 후 게임 40분, 짧은 영상 20분”이 사용자 입력과 무관하게 고정된다. 선택형 또는 편집형 필드로 바꾸는 것이 좋다.

### P2-10. CBT-I duplicate id 정리

`cbti-v6-hygiene`, `cbti-v6-compact-polish` id가 style/script에 중복되어 후속 `getElementById` 기반 하드닝과 QA 안정성을 떨어뜨릴 수 있다.

## 5. 권장 실행 순서

1. DHT2 schema/auth P0 3개를 먼저 처리
   - uuid ID
   - ACK columns
   - authenticated/RLS 운영 플로우
2. DFC reload crisis fail-closed와 BA runtime tel CTA 유지 보강
3. CBT-I SRT gate를 계산 엔진과 DOM action gate에 일치
4. DHT2 pending replay queue와 failed alert local dismiss 처리
5. localStorage failure/normalization 공통 wrapper를 BA/CBT-I/DFC에 적용
6. 접근성/UX P2 정리

## 6. 결론

현재 main은 이전 보고서의 핵심 안정화 항목이 반영되어 테스트와 빌드가 통과한다. 다음 병목은 DHT2의 실제 Supabase 운영 적합성이다. 특히 DB schema와 앱 코드 불일치, RLS 인증 플로우 부재는 실사용 전 반드시 해결해야 한다.
