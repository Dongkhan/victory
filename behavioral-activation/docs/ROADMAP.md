# Behavioral Activation (ActivaCare) — HTML 코딩 완성 로드맵 (v1.0)

**목표**: 단일 HTML 프로토타입 `prototype/v1.9.html`(64KB)을 모바일 출시 직전 코딩 완성 수준으로 끌어올린다. 핵심 치료 루프(Today / Life Map / Action Lab / Review / Clinic)는 작동하나 접근성·다크모드·PWA·안전 게이트 검증이 미흡하다.

**제품 기준 문서**: `behavioral-activation/README.md` (§8 임상 모델, §9 MVP, §15 안전 설계 참조).

**작동 방식** (헤르메스 goal):
- 위에서부터 미완료 `[ ]` 항목 순서대로. **한 항목 = 한 버전 = 한 commit**.
- 직전 버전 보존: `prototype/v{N}.html`은 절대 수정 금지. 항상 `cp v{N}.html v{N+1}.html` 후 새 파일만 수정.
- commit 메시지: `feat(ba): ROADMAP <code> (v{N+1})`
- 항목이 요구하는 변경만 적용. 인접 영역은 건드리지 않는다.

**자동 정지 조건 (안전 영역 — 접촉 시 종료 + 사용자 보고)**:
1. 위험 신호 분류·안전 체크 로직(README §15.1)의 판정 기준 변경
2. 위기 안내 문구(119·응급실·자살예방상담전화 109·생명존중사업) 본문 변경
3. localStorage 키 이름 변경 — 사용자 기록 손실 위험
4. 시크릿 패턴 발견(`API_KEY|TOKEN|password|ghp_|sk-`, 주민번호, 휴대폰)
5. 외부 데이터 전송 코드 신규 추가(localhost 외 `fetch`/`XMLHttpRequest`/`sendBeacon`)
6. ASRS/PHQ-9 등 측정 도구의 컷오프·해석 추가·변경

**완료 정의**: Track 0–8 자동 항목이 모두 `[X]` = ActivaCare 코딩 완성(v2.0 후보).

---

## Track 0: 메타 — 토큰 기반 정비 (3 항목)

- [X] **meta-01**: `:root` 디자인 토큰 블록 신설 — 색·간격·라운드 변수 한 곳에 정의 → 측정: `:root` 변수 >= 18개
- [ ] **meta-02**: 모션 토큰 정의 — `--transition-fast` / `--transition-page` → 측정: `--transition-*` 변수 2개 이상
- [ ] **meta-03**: 간격·라운드 스케일 토큰화 — `--space-*`, `--radius-*` → 측정: 각 스케일 변수 정의

## Track 1: 명백한 결함 — 즉시 수정 (6 항목)

- [ ] **bug-01**: `100vh` -> `100dvh` 전환 (iOS Safari) — 현재 1건 잔존 → 측정: `100vh` 검색 0건
- [ ] **bug-02**: 라우트 스택 기반 뒤로가기 — 진입 직전 화면으로 복귀 → 측정: Today->Action Lab->뒤로 = Today
- [ ] **bug-03**: 행동 처방·체크 도중 뒤로가기 시 진행 손실 확인 모달 → 측정: dirty 상태 + 뒤로가기 = 확인 모달
- [ ] **bug-04**: 모달 ESC + 배경 탭 = 닫힘 (안전 화면 제외) → 측정: 모든 `.modal`에 ESC + backdrop handler
- [ ] **bug-05**: 새로고침 시 현재 탭 유지 — URL hash 사용 → 측정: F5 후 같은 탭
- [ ] **bug-06**: localStorage 키 prefix 통일 — 모든 키 `activacare:` 시작 → 측정: 저장 키 모두 prefix 시작

## Track 2: 접근성 (a11y) (7 항목)

- [ ] **a11y-01**: 모든 `button`/`a`에 `aria-label` 또는 textContent 보장 → 측정: 빈 인터랙티브 요소 0건
- [ ] **a11y-02**: 아이콘 전용 버튼에 `aria-label` 명시 → 측정: 텍스트 없는 버튼 전부 aria-label
- [ ] **a11y-03**: form 요소에 `label` 연결 → 측정: 모든 입력 요소 label 연결
- [ ] **a11y-04**: `:focus-visible` CSS — outline 2px solid var(--brand) + offset → 측정: focus-visible 룰 존재
- [ ] **a11y-05**: 화면/탭 전환 시 새 화면 첫 인터랙티브 요소로 focus 이동 → 측정: route change 후 activeElement 검증
- [ ] **a11y-06**: 본문 색 대비 >= 4.5:1, 헤더 >= 3:1 → 측정: CSS 색상 기준 대비 계산 통과
- [ ] **a11y-07**: 안전 체크/위기 화면 `role="dialog"` + `aria-modal` + `aria-live` → 측정: 정적 검증

## Track 3: 비주얼 시스템 + 다크모드 + 모션 (7 항목)

현재 `prefers-color-scheme`·`prefers-reduced-motion` 미디어 룰 0건.

- [ ] **vis-01**: 배경 warm off-white, 순백 UI 배경 금지 → 측정: body background 정확값
- [ ] **vis-02**: 텍스트 deep navy, 순흑(`#000000`) 금지 → 측정: `#000000` 검색 0건
- [ ] **vis-03**: 브랜드 1색 + 보조 1색 — `--brand` / `--accent` 변수 → 측정: 두 변수 + 사용 위치 >= 5
- [ ] **vis-04**: 다크 모드 — `@media (prefers-color-scheme: dark)` 룰, 전 화면 대응 → 측정: 미디어 룰 + 모든 탭 다크 적용
- [ ] **vis-05**: 다크용 `theme-color` meta 추가(라이트/다크 2개) → 측정: `theme-color` meta 2개
- [ ] **vis-06**: `@media (prefers-reduced-motion: reduce)` — 애니메이션 무력화 → 측정: 미디어 룰 + transition none
- [ ] **vis-07**: 타이포 위계 정리 — 본문 17px, 헤더 위계, font-weight <= 3종 → 측정: 사이즈·weight 검증

## Track 4: PWA & 모바일 (6 항목)

- [ ] **pwa-01**: viewport meta `width=device-width, initial-scale=1, viewport-fit=cover` 확인 → 측정: 정확 매치
- [ ] **pwa-02**: 인라인 manifest(data URL) — name/short_name/start_url/display/background_color/theme_color/icons → 측정: 7개 키 확인
- [ ] **pwa-03**: 인라인 SVG favicon + apple-touch-icon → 측정: 2개 link 존재
- [ ] **mob-01**: 모든 인터랙티브 터치 영역 >= 44px → 측정: CSS min-width/min-height 44px
- [ ] **mob-02**: `safe-area-inset` 적용 — 헤더 top, 탭바 bottom `env()` → 측정: `env(safe-area-inset-*)` 사용
- [ ] **mob-03**: `input/textarea` font-size >= 16px + `-webkit-tap-highlight-color: transparent` → 측정: CSS 값 확인

## Track 5: 안전 게이트 검증 (6 항목)

round8 감사(v0.8 기준) 지적 사항. 현 v1.9에서 해소됐는지 정적·동작 검증하고 미해소 시 수정.

- [ ] **safe-01**: 안전 체크 기본 선택 = "위험 신호 없음"만 선택 상태, 고위험 항목은 빈 선택지로 표시 → 측정: 초기 렌더 시 고위험 선택지에 체크 표식 0건
- [ ] **safe-02**: "자주 있거나 구체적 계획" 선택 시 행동 처방 UI 중단 + 안전 화면 전환 → 측정: 고위험 선택 -> 안전 화면 라우팅 분기 존재
- [ ] **safe-03**: 안전 화면에 119 · 응급실 · 자살예방상담전화 109 · 보건소 생명존중사업 의뢰 문구 포함 → 측정: 정확 문구 매치
- [ ] **safe-04**: 안전 체크 영역 `aria-live` — 고위험 선택 시 스크린리더 즉시 발화 → 측정: 정적 검증
- [ ] **safe-05**: 위기 화면 모달 트랩 — 명시적 행동으로만 닫힘(ESC·배경 탭 비활성) → 측정: 위기 화면 ESC handler 차단 분기
- [ ] **safe-06**: 위험 신호 분류 로직을 단일 함수로 분리(README §15.1 기준) — 향후 R2 보호 대상 명확화 → 측정: `function` 단위 분리 + 주석 표식

## Track 6: 완료 기록 신뢰성 (5 항목)

round8 공통 리스크 — 타이머 완료 전 완료 저장 가능.

- [ ] **fn-01**: `완료 기록 저장` 버튼은 타이머 완료 후에만 활성화 → 측정: 타이머 진행 중 완료 버튼 disabled
- [ ] **fn-02**: 타이머 진행 중에는 `부분 수행으로 저장`만 허용 → 측정: 진행 중 부분 저장만 활성
- [ ] **fn-03**: 타이머 시작 시 실행 전 체크 모달 완전 종료(DOM·focus 정리) → 측정: 타이머 시작 후 pre-check dialog DOM 부재
- [ ] **fn-04**: 기록 타임스탬프 구분 — `startedAt`/`completedAt`/`abortedAt`/`partial` 분리 저장 → 측정: 기록 객체 4개 필드
- [ ] **fn-05**: 외래 요약(Clinic)에 완료/부분/중단 구분 표시 → 측정: 요약에 3가지 상태 분리 집계

## Track 7: 에러 처리 (3 항목)

- [ ] **err-01**: `localStorage.setItem` try/catch + QuotaExceededError 처리 → 측정: AST 검증
- [ ] **err-02**: 모든 `JSON.parse` try/catch → 측정: AST 검증
- [ ] **err-03**: 빈 state 처리 — 각 탭 empty state UI(기록 0건일 때) → 측정: 각 탭 empty state 텍스트 존재

## Track 8: 문서·index 동기화 (3 항목)

- [ ] **doc-01**: `README.md` §17 "다음 작업"이 v0.2 기준으로 멈춰 있음 — 현 v1.9 구현 상태로 갱신 → 측정: §17 버전 표기 = 현 latest
- [ ] **idx-01**: `behavioral-activation/index.html` latest 링크가 실제 최신 버전 가리킴, broken link 0 → 측정: latest = 최신 파일, 링크 대상 전부 존재
- [ ] **idx-02**: index 설명 문구가 최신 버전 실제 기능과 일치 → 측정: 설명-기능 불일치 0건

---

## 시각/행동 검증 필요 (자동 진행 대상 아님)

- [ ] **vis-check-01**: 실기기 5분 사용 인상 — 치료 루프가 자연스러운가
- [ ] **vis-check-02**: 추천 근거 카피가 환자에게 충분히 단순한가(전문가용 표현 잔존 여부)
- [ ] **vis-check-03**: 다크 모드 저녁 가독성 실기기 확인
- [ ] **vis-check-04**: 안전 체크 흐름 — 고위험 선택 시 안전 화면 전환이 실제로 명확한가

## 원장 sign-off 필요 (자동 진행 대상 아님)

- [ ] **clin-01**: 위험 신호 분류 기준 변경 (README §15.1)
- [ ] **clin-02**: 측정 도구(PHQ-9/GAD-7/ASRS/WSAS) 도입·컷오프 — README §16 Phase 4 범위
- [ ] **clin-03**: 행동 처방·회피 패턴 임상 모델 변경 (README §8)

---

## 진행 추적

| Track | 항목 수 |
|---|---:|
| 0 메타 | 3 |
| 1 결함 | 6 |
| 2 접근성 | 7 |
| 3 비주얼/다크/모션 | 7 |
| 4 PWA/모바일 | 6 |
| 5 안전 게이트 검증 | 6 |
| 6 완료 기록 신뢰성 | 5 |
| 7 에러 처리 | 3 |
| 8 문서/index | 3 |

**자동 진행 가능**: 46개
**시각 검증 필요**: 4개 (자동 X)
**원장 sign-off**: 3개 (자동 X)

**v2.0 도달 정의**: Track 0–8 자동 항목 46개 모두 `[X]`. 위에서부터 처리, 한 항목 = 한 commit, 안전 영역 만나면 자동 정지.
