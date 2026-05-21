# CBT-I Care — Product-Grade Roadmap

**목표**: 환자가 처음 열었을 때 "Sleep Reset / Calm / Apple Health 같다"고 느낄 수준의 완성도.

**핵심 원칙** (인기 수면 앱이 공통으로 잘 하는 것):
1. 한 화면 = 한 가지 결정 (정보 과부하 금지)
2. 차분·미니멀 톤 (제품 가치를 인터페이스로 보여줌)
3. 점진적 공개 (모든 기능을 첫날 보여주지 않음)
4. 명확한 다음 행동 (매 화면 "지금 무엇을")
5. 시각화 우선 (숫자보다 그래프·진행률)
6. 라우팅 무결성 (뒤로가기는 직전 화면)

**작동 방식**: 위에서부터 미완료 [ ] 처리. 항목당 한 commit (v{N+1}.html + index.html + 이 ROADMAP).

---

## Track 1: 명백한 결함 — 즉시 수정 (8 항목)

- [X] **bug-01**: 모든 화면에서 뒤로가기 = 진입 직전 화면 (이전 라우트 스택 기반) → 측정: 플랜→ISI→뒤로 = 플랜 / 리포트→PHQ-9→뒤로 = 리포트
- [X] **bug-02**: 뒤로가기 버튼 라벨이 "뒤로" 또는 ← 일관 (현재 탭명 표시 금지) → 측정: 모든 sub-screen 헤더의 뒤로가기 텍스트 동일
- [X] **bug-03**: 척도 시작 화면 진입 시 항상 1번 문항으로 리셋 (이전 응답 잔존 금지) → 측정: ISI/PHQ-9/ESS 진입 시 questionIndex = 0
- [X] **bug-04**: 척도 도중 뒤로가기 → "그만두시겠어요?" 확인 (응답 손실 방지) → 측정: questionIndex > 0 + 뒤로가기 = 확인 모달
- [X] **bug-05**: 일기 작성 도중 뒤로가기 → "임시 저장 또는 폐기" 선택 → 측정: 입력 변경 후 뒤로가기 = 선택 모달
- [X] **bug-06**: 모든 모달 ESC 또는 배경 탭으로 닫힘 → 측정: 위기 카드 제외 (위기 카드는 명시적 행동만)
- [X] **bug-07**: iOS Safari에서 100vh 스크롤 깨짐 수정 (`100dvh` 또는 `-webkit-fill-available`) → 측정: vh 사용 위치 모두 dvh로 교체
- [X] **bug-08**: 새로고침 시 현재 화면 유지 (URL hash 또는 sessionStorage) → 측정: 플랜→ISI 진입 후 F5 = ISI 그대로

## Track 2: 정보 다이어트 (12 항목) — UX 단순화

### 홈 화면 (현재 가장 무거움)

- [X] **diet-home-01**: 홈 화면 첫 진입 시 보이는 요소 ≤ 5개 (헤더 1 + 핵심 카드 1 + 보조 카드 ≤ 3) → 측정: 스크롤 없이 보이는 영역 children.length ≤ 5
- [X] **diet-home-02**: "오늘의 한 가지 행동" 카드 — 가장 시급한 다음 행동 1개만 강조 (예: "어젯밤 수면 일기 작성하기") → 측정: 홈 상단 카드에 동사형 행동 1개 + CTA 버튼 1개
- [X] **diet-home-03**: 주차 진행도 미니멀 표시 — "Week 3 / 8" + 가는 progress bar 한 줄 → 측정: 홈 상단에 진행 표시, 글자 수 ≤ 15
- [X] **diet-home-04**: 통계 숫자 첫 화면 노출 0개 (TST·SE·SOL 등은 리포트 탭에서만) → 측정: 홈에 숫자 0건 (시간/퍼센트 등)
- [X] **diet-home-05**: 하단 면책 문구 → 설정 화면으로 이동, 홈은 정리 → 측정: 홈에 면책 텍스트 0건

### 정보 위계 일반

- [X] **diet-hier-01**: 한 화면 헤더 ≤ 1개 (h1 1개) → 측정: 각 .screen에 h1 정확히 1개
- [X] **diet-hier-02**: 한 화면 primary CTA ≤ 1개 (강조 버튼 1개만) → 측정: .button.primary 또는 .btn-primary 각 화면 ≤ 1개
- [X] **diet-hier-03**: 도움말 텍스트는 접힌 상태 기본값 (ⓘ 아이콘 탭 시 펼침) → 측정: .help-text 류 요소 기본 hidden, 토글 onclick
- [X] **diet-hier-04**: 옵션 5개 초과 시 검색 또는 그룹화 → 측정: select option > 5개면 grouping 또는 input filter
- [X] **diet-hier-05**: 동일 화면 내 색상 ≤ 4가지 (배경·텍스트·강조·보조) → 측정: 컴퓨티드 색상 unique count ≤ 4

### 카피 다이어트

- [X] **diet-copy-01**: 문장 평균 길이 ≤ 25자 (한국어 기준), 카피 톤 차분 → 측정: 모든 텍스트 노드 평균 length ≤ 25
- [X] **diet-copy-02**: 안내 문구 동사형 시작 ("기록하세요", "확인해보세요"), 명사형 나열 금지 → 측정: button/CTA 텍스트 동사형 비율 ≥ 80%

## Track 3: Apple-like 비주얼 톤 (15 항목)

### 색·배경

- [X] **vis-color-01**: 배경 = 매우 옅은 그레이/오프화이트 (#F8F9FA 류), 순백 금지 → 측정: body background 컬러 정확값
- [X] **vis-color-02**: 카드 배경 = 순백 또는 #FFFFFF, 옅은 그림자 → 측정: .card { background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.04) } 존재
- [X] **vis-color-03**: 브랜드 컬러 1개 정의 (예: #3B82F6 calm blue) + 보조 컬러 1개만 → 측정: CSS 변수 --brand 정의 + 사용 위치 통일
- [X] **vis-color-04**: 다크 모드 자동 적용 (`prefers-color-scheme: dark`) → 측정: @media (prefers-color-scheme: dark) 룰 존재 + 6개 화면 모두 다크 대응
- [X] **vis-color-05**: 위험/경고 색은 위기 카드에만 (붉은색 일반 UI 사용 금지) → 측정: 빨강 계열 색상은 .crisis 또는 .alert 컨텍스트에만

### 타이포그래피

- [X] **vis-type-01**: 폰트 패밀리 = SF Pro + Pretendard fallback (iOS 시스템 폰트 우선) → 측정: font-family 정의에 -apple-system 또는 Pretendard
- [X] **vis-type-02**: 본문 17px (iOS 표준), 헤더 위계 22/28/34 → 측정: body, h1, h2, h3 font-size 값 정확
- [X] **vis-type-03**: line-height = 1.5 본문, 1.2 헤더 → 측정: CSS 값 확인
- [X] **vis-type-04**: 글자 굵기 ≤ 3종 (regular 400 / medium 500 / semibold 600) → 측정: font-weight 사용 값 ≤ 3가지
- [X] **vis-type-05**: 숫자는 monospace 변형 (tabular-nums) 정렬 → 측정: 통계 숫자 컨테이너에 font-variant-numeric: tabular-nums

### 여백·라운드

- [X] **vis-space-01**: 카드 사이 간격 일관 (16px 또는 24px 중 하나만) → 측정: 카드 컨테이너 gap 또는 margin 통일
- [X] **vis-space-02**: 카드 안 padding 일관 (16px 또는 20px) → 측정: .card padding 일관
- [X] **vis-space-03**: border-radius 일관 (큰 카드 16px, 작은 버튼 12px, 칩 999px) → 측정: 3가지 라운드 값 만 사용

### 모션

- [X] **vis-motion-01**: 화면 전환 = slide (오른쪽→왼쪽), 200ms ease → 측정: .screen 전환에 transform: translateX, transition 200ms
- [X] **vis-motion-02**: 모달 등장 = fade + scale (150ms), prefers-reduced-motion 시 즉시 → 측정: 모달 CSS에 transition + media rule

## Track 4: 핵심 사용성 (10 항목)

### 온보딩

- [X] **onb-01**: 최초 진입 = 3단계 온보딩 (목적 / 기간 / 첫 일기 시작) → 측정: 첫 방문 (state 없음) 시 .onboarding 화면 표시
- [X] **onb-02**: 온보딩 마지막 화면 = "당신만의 8주 계획이 준비되었어요" + 첫 행동 CTA → 측정: 마지막 단계 텍스트 + CTA 버튼
- [X] **onb-03**: 온보딩 건너뛰기 가능 (작은 텍스트 링크) → 측정: skip 버튼 존재

### 시각화

- [X] **vis-chart-01**: 리포트 탭에 수면 시간 시계열 차트 (간단한 라인, SVG) → 측정: .chart-sleep 요소 + SVG path 렌더
- [ ] **vis-chart-02**: 수면 효율 (SE) 도넛 또는 progress ring → 측정: SVG circle stroke-dasharray
- [ ] **vis-chart-03**: 척도 점수 변화 트렌드 (ISI/PHQ-9/ESS) 미니 스파크라인 → 측정: 각 척도 카드에 SVG path 미니 차트
- [ ] **vis-chart-04**: 빈 데이터 시 차트 자리에 "7일 이상 기록 시 그래프가 나타납니다" 안내 → 측정: empty state 메시지

### 입력 단순화

- [ ] **input-01**: 시각 입력 = 휠/스피너 (텍스트 입력 금지, iOS time picker 사용) → 측정: input[type="time"] 사용
- [ ] **input-02**: 척도 응답 = 큰 버튼 5개 가로 (라디오 버튼 텍스트 금지) → 측정: 척도 응답 영역에 .scale-btn × 5
- [ ] **input-03**: 다음 문항 자동 진행 (응답 즉시 다음 페이지, "다음" 버튼 불필요) → 측정: 응답 onclick 핸들러 = 다음 문항 자동 이동
- [ ] **input-04**: 척도 진행 상황 표시 (5/14 같은 도트 또는 progress bar) → 측정: 척도 상단에 progress 요소

## Track 5: 점진적 공개 (5 항목)

- [ ] **prog-01**: 1주차 사용자에겐 인지재구조 탭 비활성화 (잠금 아이콘 + "Week 2부터") → 측정: state.weekNumber < 2일 때 탭 disabled
- [ ] **prog-02**: 2주차에 SRT 권고 첫 노출 (7일 데이터 기반) → 측정: 누적 일기 ≥ 7일일 때만 SRT 카드
- [ ] **prog-03**: 자극조절 가이드 = 1주차부터 (즉시 적용 가능한 행동) → 측정: 1주차 홈에 stimulus-control 카드
- [ ] **prog-04**: 척도 재평가 알림 = 4주차·8주차 (2주마다 아님) → 측정: 알림 트리거 조건 = weekNumber in [4, 8]
- [ ] **prog-05**: 8주차 완료 시 졸업 화면 (요약 + 다음 단계 안내) → 측정: weekNumber >= 8 + 모든 일기 완료 시 graduation screen

## Track 6: 위생 (자동 진행 가능, 우선순위 낮음) — 기존 ROADMAP 잔여

기존 a11y / PWA / 카피 / err / i18n / dev 항목들을 그대로 가져옴. 위 트랙 모두 완료 후 진행:

- [ ] **hyg-01 ~ hyg-30**: (기존 ROADMAP의 자동 항목 그대로, 우선순위 후순위)
  - 모두 [X] 되어도 위 Track 1-5 미완료 시 "v3.0 도달 아님"

---

## 시각·인지 검증 필요 (자동 진행 대상 아님)

- [ ] **vis-check-01**: 실제 iOS Safari + Android Chrome 5분 사용 인상 = "Sleep Reset 같다" → 원장 또는 환자 5명 인터뷰
- [ ] **vis-check-02**: 색상 contrast 4.5:1 실측 (모든 텍스트) → 시각 검증
- [ ] **vis-check-03**: 터치 영역 44px 실측 → 실기기 확인
- [ ] **vis-check-04**: 첫 인상 5초 테스트 — 5명에게 5초 보여주고 "무엇을 하는 앱?" 정답률 ≥ 4/5 → 사용자 테스트

## 원장 sign-off 필요 (자동 진행 대상 아님)

기존 그대로:
- clin-01 ~ clin-05: SRT 권고 수식, 컷오프, 척도 추가, 위기 카드 조건

---

## 진행 추적

총 항목:
- Track 1 (버그): 8
- Track 2 (다이어트): 12
- Track 3 (비주얼): 15
- Track 4 (사용성): 10
- Track 5 (점진 공개): 5
- Track 6 (위생): 기존 잔여
- 시각 검증: 4 (자동 X)
- sign-off: 5 (자동 X)

**자동 진행 가능 (Track 1-5)**: 50개
**v3.0 도달 정의**: Track 1-5 모두 [X] + Track 6 일정 비율 이상

위에서부터 처리. 한 항목 = 한 commit.
