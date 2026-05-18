# Victory 프로젝트 개선 작업 Round 4

## 적용 범위

- CBT-I Care: 라벤더 테마 v0.3 승격, 위기 진행 차단, 진료용 요약 export, 수면일기 계산 검증
- Relax Routine: 기존 v0.5의 세션 중 하단 nav 숨김 및 중단/완료 semantics를 QA 항목으로 고정
- DH Talk: shared key 미설정, user id 불일치, 인증 실패, 서버 연결 실패를 사용자에게 구분 표시

## CBT-I Care

### 구현

1. `prototype/cbti-v0.3.html` 신규 생성
   - 기존 `cbti-v0.2.html` 보존
   - index latest 링크를 v0.3으로 변경

2. 라벤더 수면 테마 적용
   - 주 accent `#8e7cc3`
   - 진한 accent `#5b4b8a`
   - 연한 accent `#e7dff5`
   - 배경을 어두운 라벤더 radial gradient로 변경

3. 위기 진행 차단
   - 초기 평가에서 `심한 기분 변화·위기 상황` 선택 시 `diary`, `sessions` 진입 차단
   - 세션 카드와 빠른 세션 modal도 차단
   - 안내 문구는 보호자, 진료실, 119/응급실, 보건소 생명존중사업 우선 연결로 통일

4. 수면일기 계산/입력 검증
   - TIB, TST, SOL, WASO, SE 계산식 명시
   - 16시간 초과 TIB, 6시간 초과 SOL, WASO>TIB, TST=0 입력 경고
   - 수면제 감량 속도와 중단 시점은 진료에서만 결정한다는 문구 반복

5. 진료용 요약 export
   - 외래 공유용 7일 요약 초안 카드 추가
   - 현재 수면일기 핵심 지표, 복약 상태, 안전 플래그, 권장 방향을 복사 가능하게 구성

## Relax Routine

### 확인 및 고정

- v0.5에 이미 적용된 세션 중 하단 nav 숨김 로직 `__hideNav`를 QA 항목으로 고정
- `중단하고 나가기`는 완료 기록으로 처리되지 않는다는 안내 `ex_session_end_hint`를 QA 항목으로 고정
- 이번 라운드에서는 거대 단일 HTML 구조를 직접 분해하지 않고, 다음 라운드의 별도 리팩터링 대상으로 남김

## DH Talk

### 구현

1. 연결 문제 banner 추가
   - `shared key 미설정`
   - `내 user id가 users.yaml에 없음`
   - `인증 실패`
   - `서버 연결 실패`

2. shared key가 비어 있거나 user id가 잘못된 경우 WebSocket 연결 시도 전 차단
   - 빈 키로 HMAC을 보내며 실패하는 모호한 UX 제거
   - 현장 조치 문구: `서버 PC에서 npm run key 실행 → 생성된 키를 모든 PC settings.yaml에 동일 입력`

3. renderer static test 추가
   - 연결 실패 원인 문구 존재
   - 잘못된 설정 시 WebSocket 미시도
   - banner style 존재 확인

## 검증 항목

- `dh-talk/npm test`
- `dh-talk/npm run build`
- `node scripts/qa-prototypes.mjs`

## 남은 과제

1. DH Talk Windows 실기기 `npm run build:win` 및 설치 실행 확인
2. shared key를 설정 파일 직접 편집이 아니라 앱 내부 첫 실행 wizard로 저장하는 기능
3. Relax Routine 32MB 단일 HTML을 source/release 구조로 분리
4. CBT-I v0.3 브라우저 실기기 시각 QA
