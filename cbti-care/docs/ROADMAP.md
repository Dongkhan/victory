# CBT-I Care v3.0 — Product-Grade Roadmap (deeply researched)

**목표**: 환자가 처음 열었을 때 **60초 안에 "어 이거 Sleep Reset / Calm 수준이네"** 라고 느끼는 완성도.

**연구 기반**:
- Apple HIG 4원칙: Clarity / Deference / Depth / Consistency
- Headspace 디자인 원칙: 순백·순흑 금지, 4-2-6 호흡, 600-800ms 차분한 모션, 일러스트 = 브랜드
- Calm/Sleep Reset 온보딩: 60초 안에 first value, "당신만의 계획" 즉시 제시
- Anthropic Claude Code 베스트: 모든 측정 기준은 검증 가능, 안티패턴 명시
- Loóna 대화형 온보딩: 다이얼로그 형식 + 진행률 표시

**작동**: 위에서부터 미완료 [ ] 처리. 항목당 한 commit. 안전 영역(CLAUDE.md R2) 자동 정지.

**완료 정의**: 자동 가능 항목 모두 [X] = v3.0.

---

## Track 0: 메타 — 모든 변경 적용 전 (3 항목)

- [X] **meta-01**: design-tokens.css 섹션 생성 (CSS 변수 한 곳에 정의) → 측정: `<style>` 안에 `:root { --... }` 블록 존재, 변수 ≥ 20개
- [X] **meta-02**: 모션 토큰 정의 (transition-fast 200ms / transition-page 500ms / transition-meditation 800ms) → 측정: CSS 변수 --transition-* 3개 존재
- [X] **meta-03**: prefers-reduced-motion 미디어 룰 추가 (모든 애니메이션 무력화) → 측정: `@media (prefers-reduced-motion: reduce)` 블록 존재 + transition: none/0ms 적용

## Track 1: 명백한 결함 — 즉시 수정 (10 항목)

- [X] **bug-01**: 라우트 스택 기반 뒤로가기 — `history.push(prev)` 패턴 + 뒤로가기 시 stack pop → 측정: 플랜→ISI→뒤로 = 플랜 / 리포트→ISI→뒤로 = 리포트 (테스트 시나리오 2개 정의)
- [X] **bug-02**: 뒤로가기 라벨 통일 — "← 뒤로" 또는 SF Symbol chevron.left + "뒤로" 일관 → 측정: 모든 sub-screen 헤더 텍스트 byte-identical
- [X] **bug-03**: 척도 진입 시 questionIndex = 0 리셋 + 진행률 0% → 측정: ISI/PHQ-9/ESS 진입 함수에 state reset 명시
- [X] **bug-04**: 척도 도중 뒤로가기 → "지금까지 응답이 사라집니다. 그만두시겠어요?" 확인 모달 → 측정: questionIndex > 0 + 뒤로가기 = confirm dialog 노출
- [X] **bug-05**: 일기 작성 도중 뒤로가기 → "임시 저장" 또는 "폐기" 선택 → 측정: dirty flag = true + 뒤로가기 = 2-option modal
- [X] **bug-06**: 모달 ESC + 배경 탭 = 닫힘 (위기 카드 제외) → 측정: 모든 .modal 요소에 ESC listener + backdrop onclick handler
- [X] **bug-07**: 100vh → 100dvh 전환 (iOS Safari 주소창 처리) → 측정: CSS에서 `100vh` 검색 결과 0건 (dvh 또는 -webkit-fill-available로 대체)
- [X] **bug-08**: 새로고침 시 현재 화면 유지 — URL hash 사용 (`#screen-isi`) → 측정: F5 후 같은 화면 표시
- [X] **bug-09**: localStorage 키 충돌 방지 — 모든 키에 prefix `cbticare:` → 측정: localStorage 키 모두 prefix 시작
- [X] **bug-10**: focus 손실 처리 — 화면 전환 시 새 화면의 첫 인터랙티브 요소로 focus → 측정: route change 후 document.activeElement 확인

## Track 2: 60초 First Value — 온보딩 (12 항목)

영상 패턴 + Sleep Reset/Calm 기준: **첫 진입 60초 안에 "당신만의 8주 계획" 제시**.

- [X] **onb-01**: 최초 진입 시 환영 화면 (한 화면, 한 문장: "8주 안에 깊은 잠을 되찾습니다.") + Start 버튼 1개 → 측정: 첫 방문 시 .welcome 화면 표시, 텍스트 ≤ 20자
- [X] **onb-02**: Step 1/4 — 다이얼로그형 질문: "지금 가장 어려운 것은?" 4지선다 (잠들기 / 자다 깸 / 너무 일찍 깸 / 피곤한데 못 잠) → 측정: 라디오 4개, 진행률 표시 "1/4"
- [X] **onb-03**: Step 2/4 — "보통 몇 시쯤 자려고 누우시나요?" iOS time picker → 측정: input[type=time], 진행률 "2/4"
- [X] **onb-04**: Step 3/4 — "일어나야 하는 시각은?" iOS time picker → 측정: input[type=time], 진행률 "3/4"
- [X] **onb-05**: Step 4/4 — "이 프로그램에 대한 안내" (의도된 사용, 진단 아님, 위기 시 109/1393) — 동의 체크박스 1개 → 측정: 4번 화면에 면책 + 동의 체크
- [X] **onb-06**: 즉시 결과 화면 — "당신의 수면 효율: 측정 중. 첫 7일 일기 후 정확한 SE와 SRT 권고가 나옵니다." + 다음 행동 CTA "오늘 밤 일기 시작" → 측정: 완료 후 personalized 메시지 + CTA 1개
- [X] **onb-07**: 온보딩 건너뛰기 — 화면 우상단 작은 "건너뛰기" 텍스트 (default 약함) → 측정: skip 링크 존재, font-size ≤ 14px
- [X] **onb-08**: 온보딩 응답 수정 가능 — 어느 단계든 뒤로가기로 이전 응답 변경 → 측정: 각 단계 진입 시 이전 응답 prefilled
- [X] **onb-09**: 온보딩 도중 이탈 시 진행 저장 → 측정: state.onboarding.step 저장, 재방문 시 그 단계 재개
- [X] **onb-10**: 진행률 시각화 — 상단 4-dot indicator 또는 progress bar → 측정: 4 step 모두에 동일 진행 UI
- [X] **onb-11**: 마지막 화면에 brand 톤 일러스트 (인라인 SVG, 동행 정신과 색감) → 측정: SVG 일러스트 존재, 외부 이미지 0건
- [X] **onb-12**: 첫 진입 → 동의 → 첫 행동 CTA까지 평균 ≤ 60초 (수동 측정 기록) → 측정: dev 환경에서 timestamp 로깅, 5회 평균 ≤ 60s

## Track 3: 정보 다이어트 (15 항목)

### 홈 화면 (현재 가장 무거움)

- [X] **diet-home-01**: 홈 첫 화면 자식 요소 ≤ 5 (헤더 1 + 핵심 카드 1 + 보조 카드 3) → 측정: .screen[data-route="home"] 직속 children ≤ 5
- [X] **diet-home-02**: "오늘의 한 가지 행동" 카드 — 현재 시점 가장 시급한 행동 1개 강조 (어젯밤 일기 / SRT 권고 / 척도 재평가) → 측정: 홈 상단 카드에 동사형 행동 1개 + CTA 1개
- [X] **diet-home-03**: 주차 진행 미니멀 — "Week 3 / 8" + 8칸 progress dots (1줄) → 측정: 글자 + dot 디자인, 총 너비 ≤ 320px
- [X] **diet-home-04**: 홈에 숫자 통계 0개 (모두 리포트 탭으로 이동) → 측정: 홈에 숫자 % 시 분 0건 (date 표시 제외)
- [X] **diet-home-05**: 면책 문구 홈에서 제거, 설정 > About로 이동 → 측정: 홈 텍스트에 "진단" "처방" "의료기기" 0건
- [X] **diet-home-06**: 인사말 시간대 적응 — "좋은 아침입니다" (5-11시) / "오후예요" (12-17시) / "저녁이네요" (18-23시) / "편안한 밤" (0-4시) → 측정: 시간 조건 분기 함수 존재 + 4가지 인사말

### 정보 위계 일반

- [X] **diet-hier-01**: 한 화면 h1 정확히 1개 → 측정: 각 .screen 내부 h1.length === 1
- [X] **diet-hier-02**: 한 화면 primary CTA ≤ 1개 → 측정: .btn-primary 각 .screen ≤ 1
- [X] **diet-hier-03**: 도움말 텍스트 default 접힘 (ⓘ 탭 시 펼침) → 측정: .help-text default display: none + onclick toggle
- [X] **diet-hier-04**: 한 화면 색상 ≤ 4가지 (배경/텍스트/강조/보조) → 측정: 컴퓨티드 unique colors ≤ 4
- [X] **diet-hier-05**: 옵션 5개 초과 시 검색 또는 그룹화 → 측정: select option > 5면 optgroup 또는 filter input

### 카피 다이어트

- [X] **diet-copy-01**: 문장 평균 길이 ≤ 25자 (한국어) → 측정: 모든 텍스트 노드 길이 평균 계산
- [X] **diet-copy-02**: CTA 동사형 시작 — "시작하기" "기록하세요" "확인" → 측정: button/CTA 텍스트의 80% 이상 동사형
- [X] **diet-copy-03**: 진료/약물/처방 표현 검사 → 측정: "진단" "처방" "약물" 출현 위치 모두 면책 문맥에만
- [X] **diet-copy-04**: 띄어쓰기 일관 — "수면일기" "기상시각" 등 한 형식 → 측정: 한 표현당 한 표기

## Track 4: Apple HIG + Headspace 비주얼 시스템 (22 항목)

### 색 — 순백·순흑 금지 (Headspace 원칙)

- [X] **vis-color-01**: 배경 = `#FAFAF7` (warm off-white), `#FFFFFF` 사용 금지 → 측정: body background 정확값 + grep "#FFFFFF" 결과 0건
- [X] **vis-color-02**: 텍스트 = `#1B2838` (deep navy, 순흑 아님) → 측정: body color 값 + grep "#000000" 결과 0건
- [X] **vis-color-03**: 카드 배경 = `#FFFFFF` (배경과 살짝 대비), 옅은 그림자 `0 1px 3px rgba(27, 40, 56, 0.06)` → 측정: .card { box-shadow: ... } 정확값
- [X] **vis-color-04**: 브랜드 1색 — `--brand: #4A8FB8` (calm slate blue) → 측정: --brand CSS 변수 + 사용 위치 ≥ 5
- [X] **vis-color-05**: 보조 1색 — `--accent: #E8B86F` (warm warm sand) → 측정: --accent 변수
- [X] **vis-color-06**: 위험 색 위기 카드에만 — `--danger: #C04545` → 측정: --danger 사용 위치는 .crisis-card 또는 .alert-error에만
- [X] **vis-color-07**: 다크 모드 자동 — `prefers-color-scheme: dark` 시 배경 `#1B2838`, 텍스트 `#E8D5B7` → 측정: 미디어 룰 존재, 모든 화면 다크 적용
- [X] **vis-color-08**: 그림자 colored — `rgba(74, 143, 184, 0.08)` (gray 아닌 brand tint) → 측정: box-shadow에 rgba(0,0,0,...) 0건

### 타이포그래피 — Apple HIG

- [X] **vis-type-01**: 폰트 스택 — `-apple-system, "SF Pro Text", Pretendard, system-ui, sans-serif` → 측정: font-family 정의에 4개 포함
- [X] **vis-type-02**: 본문 17px (iOS 표준) → 측정: body { font-size: 17px }
- [X] **vis-type-03**: 헤더 위계 — h1 28px / h2 22px / h3 20px → 측정: 세 사이즈 정확
- [X] **vis-type-04**: line-height — 본문 1.5 / 헤더 1.2 → 측정: 정확값
- [X] **vis-type-05**: font-weight ≤ 3종 (400 / 500 / 600) → 측정: 사용 값 unique ≤ 3
- [X] **vis-type-06**: 숫자 tabular-nums (통계 정렬용) → 측정: .stat-number 류 요소에 font-variant-numeric: tabular-nums
- [X] **vis-type-07**: Dynamic Type 지원 — `font-size: clamp(15px, 4vw, 19px)` 본문 → 측정: clamp() 사용 본문 영역에 적용

### 여백·라운드

- [X] **vis-space-01**: spacing scale — 4 / 8 / 12 / 16 / 24 / 32 / 48 (8 base) → 측정: --space-* 변수 7개 정의
- [X] **vis-space-02**: border-radius scale — 8 (작은) / 16 (카드) / 24 (모달) / 999 (칩) → 측정: --radius-* 4개
- [X] **vis-space-03**: 카드 padding 일관 (16px 또는 20px만) → 측정: .card padding unique ≤ 2가지
- [X] **vis-space-04**: 카드 사이 gap 일관 (12 또는 16) → 측정: 컨테이너 gap unique ≤ 2

### 모션 — Headspace 600-800ms 차분한 페이스

- [X] **vis-motion-01**: 화면 전환 슬라이드 — translateX, 500ms cubic-bezier(0.25, 0.1, 0.25, 1) → 측정: .screen transition 정확값
- [X] **vis-motion-02**: 모달 등장 fade + scale — 200ms ease-out, scale 0.95→1 → 측정: .modal CSS 정확값
- [X] **vis-motion-03**: 세션 완료 셀러브레이션 — 800ms scale 0.9→1.02→1 → 측정: .completion-animation keyframes 존재

## Track 5: 핵심 기능 사용성 (15 항목)

### 시각화

- [X] **chart-01**: 리포트 탭에 수면 시간 시계열 (SVG 인라인 라인 차트, 7일/14일/30일 토글) → 측정: SVG path + 3개 range 버튼
- [X] **chart-02**: 수면 효율 progress ring (SVG circle stroke-dasharray) → 측정: SVG circle 요소 + 동적 stroke 계산
- [X] **chart-03**: 척도 점수 변화 미니 sparkline (각 척도 카드에 14일 흐름) → 측정: 각 척도 카드에 SVG 미니 차트
- [X] **chart-04**: 빈 데이터 시 차트 위치에 안내 — "7일 이상 일기 작성 후 차트가 나타납니다" → 측정: empty state 텍스트 + 차트 영역 placeholder
- [X] **chart-05**: 차트 색상 brand 단색 + 옅은 fill (gradient: brand 30% → 0%) → 측정: SVG fill linearGradient 정의

### 입력 단순화

- [X] **input-01**: 시각 입력 input[type="time"] 사용 (iOS time picker 자동 호출) → 측정: 모든 시각 입력 type="time"
- [X] **input-02**: 척도 응답 큰 버튼 가로 5개 (1-5 Likert) — `<div class="scale-options">` 안에 .scale-btn × 5 → 측정: 척도 응답 영역 구조 일관
- [X] **input-03**: 척도 응답 즉시 다음 문항 자동 진행 (300ms delay, 시각 피드백 후) → 측정: onclick handler에 setTimeout(next, 300)
- [X] **input-04**: 척도 진행 표시 — 상단 dot indicator (5/14처럼) → 측정: 척도 화면 상단에 .progress-dots × N
- [X] **input-05**: 일기 작성 입력 최소화 — 시각 4개 (취침/기상/입면/중도각성) + 슬라이더 1개 (수면질 1-5) → 측정: 일기 화면 input 요소 ≤ 6
- [X] **input-06**: 일기 빠른 저장 — 4-탭으로 완료 (1초 이내) → 측정: 모든 일기 필드 default 값 존재 (어제 값 또는 평균)

### 점진적 공개

- [X] **prog-01**: 1주차 사용자에게 인지재구조 탭 잠금 (회색 + 자물쇠 아이콘 + "Week 2부터") → 측정: state.weekNumber < 2 시 .tab-locked 클래스
- [X] **prog-02**: SRT 권고 7일 데이터 후 첫 노출 → 측정: 일기 누적 ≥ 7 조건 검사
- [X] **prog-03**: 자극조절 가이드 1주차부터 — 즉시 적용 가능한 4가지 (졸릴 때만 침대로 / 20분 못 자면 일어나기 / 침대 = 잠만 / 같은 기상시각) → 측정: 1주차 홈에 stimulus-control card
- [X] **prog-04**: 척도 재평가 알림 4주차/8주차만 → 측정: 알림 조건 weekNumber in [4, 8]

## Track 6: Sleep UI — 별개 룰셋 (Headspace 패턴) (8 항목)

야간 사용 시 (또는 사용자가 sleep-mode 선택) 다른 UI:

- [X] **sleep-01**: sleep-mode 토글 — 설정에서 자동 (22-06시) 또는 수동 → 측정: state.sleepMode + CSS class 적용
- [X] **sleep-02**: 배경 deep navy `#1B2838` → 측정: .sleep-mode body background
- [X] **sleep-03**: 텍스트 moon-glow `rgba(232, 213, 183, 0.9)` (저대비) → 측정: 정확값
- [X] **sleep-04**: 터치 영역 80x80px (Headspace 기준, 졸릴 때 부정확한 탭) → 측정: .sleep-mode button { min-width: 80px; min-height: 80px }
- [X] **sleep-05**: 화면 밝기 자동 감소 (CSS filter brightness) → 측정: .sleep-mode { filter: brightness(0.85) }
- [X] **sleep-06**: 별 drift 애니메이션 (120s 1cycle, 거의 인지 안 됨) → 측정: keyframes drift-stars 120s linear infinite
- [X] **sleep-07**: 명상/이완 재생 시 UI 30초 후 자동 페이드 → 측정: .playing 상태 후 30s opacity 0
- [X] **sleep-08**: 위기 카드는 sleep-mode에서도 풀 밝기 유지 → 측정: .crisis-card는 filter 무력화

## Track 7: 호흡·이완 기법 (Headspace 패턴) (6 항목)

이완 화면에 임상 효과 있는 호흡 기법:

- [X] **breath-01**: 4-2-6 호흡 애니메이션 (이완 화면) — 12초 1cycle 원 확장/축소 → 측정: .breathing-circle keyframes 12s
- [X] **breath-02**: 호흡 페이즈별 색 전환 — 들숨 cool blue → 멈춤 → 날숨 warm orange → 측정: keyframes 안 background 전환
- [X] **breath-03**: 호흡 cycle 카운터 (5회 / 10회 / 무제한 선택) → 측정: cycle 선택 UI + 카운트 표시
- [X] **breath-04**: prefers-reduced-motion 시 정적 가이드 텍스트 (애니메이션 없이 "들숨 4초 · 멈춤 2초 · 날숨 6초") → 측정: media rule + 정적 fallback
- [X] **breath-05**: PMR (점진적 근육이완) 가이드 화면 — 16개 근육군, 각 5초 긴장 + 10초 이완 → 측정: PMR 화면에 16-step 가이드
- [X] **breath-06**: 인지 탈융합 1문장 가이드 — "지금 떠오르는 생각을 종이 위 글자처럼 봅니다" 류 5문장 회전 → 측정: 5개 문장 배열 + 회전 로직

## Track 8: 안전·임상 (강제 게이트, 자동 진행 가능) (6 항목)

- [X] **safe-01**: PHQ-9 #9 양성 시 점수 화면 진입 전 위기 카드 강제 노출 — 이미 안전 함수에 있음, 라우팅 검증만 → 측정: PHQ-9 완료 함수에서 #9 ≥1 분기 + 위기 카드 함수 호출 순서 정적 검증
- [X] **safe-02**: 위기 카드 모달 트랩 — Tab 순환 + ESC 비활성 (명시적 행동만 닫힘) → 측정: focus trap 함수 + ESC keydown handler에서 위기 카드 분기 차단
- [X] **safe-03**: 위기 카드 정확 문구 — "지금 너무 힘드시다면 도움을 받을 수 있어요. ☎ 109 생명의전화 · ☎ 1393 자살예방상담전화 · ☎ 119 응급 · 지역 위기지원기관: 검색하기" → 측정: 정확 문자열 매치
- [X] **safe-04**: 위기 카드에서 "검색하기" 탭 시 외부 검색 (Google Maps "위기지원기관 + 현재 위치") → 측정: window.open URL pattern
- [X] **safe-05**: ISI 임상적 불면 (≥15) 시 "임상의 상담을 권장합니다" 부가 안내 → 측정: ISI 결과 화면 조건부 안내
- [X] **safe-06**: ESS 과도한 졸림 (≥16) 시 "주간 졸림이 심합니다. 의료기관 상담을 권장합니다" + 운전 주의 → 측정: ESS 결과 화면 조건부 안내

## Track 9: 접근성 (Apple HIG 강조) (10 항목)

- [X] **a11y-01**: `<html lang="ko">` → 측정: 속성 존재
- [X] **a11y-02**: 모든 button/a aria-label 또는 textContent → 측정: BeautifulSoup 검증
- [X] **a11y-03**: 아이콘 button (text 0)에 aria-label 명시 → 측정: 정적 검증
- [X] **a11y-04**: form 요소 label 연결 → 측정: 정적 검증
- [X] **a11y-05**: 위기 카드 role="dialog" + aria-modal + aria-labelledby → 측정: 정적 검증
- [X] **a11y-06**: :focus-visible CSS — outline 2px solid var(--brand) + outline-offset 2px → 측정: CSS 룰 존재
- [X] **a11y-07**: contrast 자체 계산 (CSS 색상 기준) — 본문 4.5:1, 헤더 3:1 → 측정: Python contrast 라이브러리로 계산
- [X] **a11y-08**: 키보드 탭 순서 — Tab으로 모든 인터랙티브 도달 → 측정: tabindex 음수 0건 (의도된 trap 외)
- [X] **a11y-09**: VoiceOver 친화 — 모든 chart에 aria-label 요약 → 측정: SVG 요소에 aria-label
- [X] **a11y-10**: 위기 카드 알림 — `role="alert"` 또는 aria-live="assertive" → 측정: 위기 카드 노출 시 즉시 스크린리더 발화

## Track 10: PWA & 모바일 (12 항목)

- [X] **pwa-01**: viewport meta `width=device-width, initial-scale=1, viewport-fit=cover` → 측정: 정확 매치
- [X] **pwa-02**: theme-color meta (라이트 / 다크 prefers-color-scheme별) → 측정: 2개 meta 존재
- [X] **pwa-03**: 인라인 manifest (data URL) — name/short_name/start_url/display/background_color/theme_color/icons → 측정: data URL 디코드 후 7개 키
- [X] **pwa-04**: 인라인 SVG favicon + apple-touch-icon → 측정: 2개 link 존재
- [X] **pwa-05**: apple-mobile-web-app-capable + status-bar-style → 측정: 2개 meta
- [X] **pwa-06**: beforeinstallprompt 핸들 + "홈 화면에 추가" 카드 (지원 브라우저만) → 측정: 이벤트 리스너 + 조건부 UI
- [X] **mob-01**: 터치 영역 44px 이상 (Apple HIG) — 모든 인터랙티브 → 측정: CSS min-width/min-height 44px 적용
- [ ] **mob-02**: safe-area-inset-top 적용 — header padding-top max(env(safe-area-inset-top), 12px) → 측정: env() 사용
- [ ] **mob-03**: safe-area-inset-bottom — tab-bar padding-bottom max(env, 8px) → 측정: env() 사용
- [ ] **mob-04**: input/textarea font-size ≥ 16px (자동 zoom 방지) → 측정: CSS 값 확인
- [ ] **mob-05**: body overflow-x hidden (가로 스크롤 방지) → 측정: CSS 룰 존재
- [ ] **mob-06**: -webkit-tap-highlight-color: transparent → 측정: CSS 룰 존재

## Track 11: 에러 처리 (8 항목)

- [ ] **err-01**: localStorage.setItem try/catch + QuotaExceededError 처리 → 측정: AST 검증
- [ ] **err-02**: JSON.parse try/catch (모든 호출) → 측정: AST 검증
- [ ] **err-03**: 빈 state 처리 — empty state UI 각 화면 → 측정: empty state 텍스트 존재
- [ ] **err-04**: schemaVersion 마이그레이션 — 5개 LEGACY_KEY 모두 처리 → 측정: 마이그레이션 함수 + 분기 검증
- [ ] **err-05**: 일기 maxlength 5000 + 카운터 → 측정: textarea[maxlength=5000] + .char-counter
- [ ] **err-06**: 중복 날짜 일기 — 기존 entry 시 "덮어쓰기" 확인 → 측정: confirm 호출
- [ ] **err-07**: 손상된 localStorage — 복구/초기화 UI → 측정: catch 블록 UI 트리거
- [ ] **err-08**: 네트워크 오프라인 — 명시적 "오프라인 사용 가능" 표시 → 측정: navigator.onLine 검사 + UI

## Track 12: i18n & 출처 (8 항목)

- [ ] **i18n-01**: 설정 언어 토글 (한국어 / English) → 측정: 토글 UI 존재
- [ ] **i18n-02**: 영문 fallback — Intended Use / 면책 / 위기 안내 3섹션 → 측정: 영문 텍스트 존재
- [ ] **i18n-03**: 영문 위기 안내 정확 문구 → 측정: 정확 매치
- [ ] **ref-01**: References 섹션 — CBT-I 핵심 문헌 5개 (Morin, Espie, Edinger, Spielman, Perlis) → 측정: References 헤더 + 5개 인용
- [ ] **ref-02**: 척도 출처 — ISI Bastien 2001 / PHQ-9 Spitzer 1999 / ESS Johns 1991 → 측정: 각 척도 화면에 출처
- [ ] **ref-03**: 라이선스 명시 — 설정 > About → 측정: License 섹션
- [ ] **ref-04**: 도구 출처 명시 — "본 도구 제작: 동행 정신건강의학과의원, 김포" → 측정: About에 명시
- [ ] **ref-05**: 면책 정확 문구 — About에 "본 도구는 의료기기가 아니며, 진단 또는 처방을 대체하지 않습니다. 임상적 의사결정은 반드시 의료 전문가와 상의하세요." → 측정: About에 정확 매치

## Track 13: 개발자 위생 (6 항목)

- [ ] **dev-01**: DEV_MODE 가드 외 UI dev 노출 0 → 측정: "debug" "dev" "test" 텍스트 UI 노출 0
- [ ] **dev-02**: console.log 정리 (DEV_MODE 가드 외) → 측정: 정상 사용 시 console clean
- [ ] **dev-03**: 단일 HTML 의존성 0 → 측정: package.json 없음
- [ ] **dev-04**: 파일 크기 ≤ 150KB (현재 61KB, 위 모든 작업 후 한계) → 측정: stat ≤ 153600
- [ ] **dev-05**: HTML W3C validator 통과 → 측정: validator API 결과 clean
- [ ] **dev-06**: 라이트/다크 모드 스크린샷 자동 생성 (CI용, 사용자 확인) → 측정: 별도 generate-screenshots.sh 존재 (자동 진행 대상은 아님)

---

## 시각/행동 검증 필요 (자동 진행 대상 아님)

- [ ] **vis-check-01**: 첫인상 5초 테스트 — 5명에게 보여주고 "무엇 하는 앱?" 정답률 ≥ 4/5 → 사용자 테스트
- [ ] **vis-check-02**: 60초 first value 실측 (실기기) → 원장 또는 환자
- [ ] **vis-check-03**: focus trap 실제 작동 (Tab/Shift+Tab/ESC) → 실기기
- [ ] **vis-check-04**: 다크 모드 가독성 (저녁 사용) → 실기기
- [ ] **vis-check-05**: sleep-mode 80px 터치 영역 졸린 상태 → 실기기
- [ ] **vis-check-06**: 4-2-6 호흡 애니메이션 실제 진정 효과 → 사용자 1주 사용 후 인터뷰
- [ ] **vis-check-07**: 색맹 사용자 — 위기 카드 인지 → 별도 테스트

## 원장 sign-off 필요 (자동 진행 대상 아님)

- [ ] **clin-01**: SRT 권고 수식 변경
- [ ] **clin-02**: ISI 컷오프 변경
- [ ] **clin-03**: PHQ-9 컷오프 변경
- [ ] **clin-04**: 새 척도 추가
- [ ] **clin-05**: 위기 카드 조건 변경
- [ ] **clin-06**: 영문 위기 안내가 한국어와 동등하게 작동하는지 임상 확인

---

## 진행 추적

총 항목:
- Track 0 (메타): 3
- Track 1 (버그): 10
- Track 2 (60초 온보딩): 12
- Track 3 (다이어트): 15
- Track 4 (비주얼 시스템): 22
- Track 5 (사용성): 15
- Track 6 (Sleep UI): 8
- Track 7 (호흡/이완): 6
- Track 8 (안전 게이트): 6
- Track 9 (a11y): 10
- Track 10 (PWA/mob): 12
- Track 11 (err): 8
- Track 12 (i18n/ref): 8
- Track 13 (dev): 6

**자동 진행 가능**: 141개
**시각 검증 필요**: 7개
**원장 sign-off**: 6개
**총합**: 154개

**v3.0 도달 정의**: Track 0-13 자동 항목 141개 모두 [X]

위에서부터 처리. 한 항목 = 한 commit. 안전 영역 만나면 자동 정지.
