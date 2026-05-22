# Relax Routine — HTML 코딩 완성 로드맵 (v1.0)

**목표**: 단일 HTML 프로토타입을 "모바일 출시 직전 코딩 완성" 수준으로 끌어올린다. 현재 `prototype/v2.5.html`은 핵심 흐름은 작동하지만 접근성·다크모드·PWA·경량화가 빠져 있어 CBT-I Care(완성 단계)와 격차가 크다.

**연구 기반**:
- Apple HIG 4원칙: Clarity / Deference / Depth / Consistency
- Headspace 디자인 원칙: 순백·순흑 금지, 차분한 모션, prefers-reduced-motion 존중
- 자매 프로젝트 `cbti-care/docs/ROADMAP.md`(141항목 완료)를 동일 기준선으로 삼음

**작동 방식** (헤르메스 goal):
- 위에서부터 미완료 `[ ]` 항목을 순서대로 처리. **한 항목 = 한 버전 = 한 commit**.
- 직전 버전 보존: `prototype/v{N}.html`은 절대 수정 금지. 항상 `cp v{N}.html v{N+1}.html` 후 새 파일만 수정.
- commit 메시지: `feat(rr): ROADMAP <code> (v{N+1})`
- 한 항목 적용 후 `index.html`의 latest 링크·요약 갱신 → 두 파일 한 commit.
- 항목이 요구하는 변경만 적용. 인접 영역·문체·포맷은 건드리지 않는다.

**자동 정지 조건 (안전 영역 — 접촉 시 종료 + 사용자 보고)**:
1. 위기/안전 안내 문구(109·1393·119, 위기 카드)의 본문 변경
2. localStorage 키(`STORAGE_KEY` 류) 이름 변경 — 사용자 데이터 손실 위험
3. 시크릿 패턴 발견(`API_KEY|TOKEN|password|ghp_|sk-`, 주민번호, 휴대폰)
4. 외부 데이터 전송 코드 신규 추가(`fetch(`, `XMLHttpRequest`, `sendBeacon`로 localhost 외 호출)
5. 임상 척도(알렉시티미아 등급 등) 컷오프·계산식 변경

**완료 정의**: Track 0–8의 자동 진행 항목이 모두 `[X]` = Relax Routine 코딩 완성(v3.0 후보).

---

## Track 0: 메타 — 토큰 기반 정비 (3 항목)

- [X] **meta-01**: `<style>` 안에 `:root { --... }` 디자인 토큰 블록 신설 — 색·간격·라운드·모션 변수를 한 곳에 정의 → 측정: `:root` 변수 >= 20개 존재
- [X] **meta-02**: 모션 토큰 정의 — `--transition-fast 200ms` / `--transition-page 500ms` / `--transition-calm 800ms` → 측정: `--transition-*` 변수 3개 존재
- [ ] **meta-03**: 간격·라운드 스케일 토큰화 — `--space-*`(4/8/12/16/24/32), `--radius-*`(8/16/24/999) → 측정: `--space-*` 6개 + `--radius-*` 4개 정의

## Track 1: 명백한 결함 — 즉시 수정 (8 항목)

- [ ] **bug-01**: `<html>`에 `lang="ko"` 속성 추가 (현재 누락) → 측정: `<html lang="ko">` 존재
- [ ] **bug-02**: `100vh` -> `100dvh` 전환 (iOS Safari 주소창 처리) — 현재 2건 잔존 → 측정: `100vh` 검색 결과 0건
- [ ] **bug-03**: `console.log/warn/error` 정리 — 현재 5건. DEV 가드 밖 호출 제거 → 측정: 정상 사용 시 console 출력 0건
- [ ] **bug-04**: 라우트 스택 기반 뒤로가기 — 진입 직전 화면으로 복귀 → 측정: 홈->세션->뒤로 = 홈 / 기록->세션->뒤로 = 기록
- [ ] **bug-05**: 세션·기록 도중 뒤로가기 시 진행 손실 확인 모달 → 측정: dirty 상태 + 뒤로가기 = 확인 모달 노출
- [ ] **bug-06**: 모달 ESC + 배경 탭 = 닫힘 (안전 안내 카드 제외) → 측정: 모든 `.modal`에 ESC listener + backdrop onclick
- [ ] **bug-07**: 새로고침 시 현재 화면 유지 — URL hash 사용 → 측정: 세션 화면에서 F5 후 같은 화면
- [ ] **bug-08**: localStorage 키 prefix 통일 — 모든 키 `relaxroutine:` 시작 → 측정: 저장 키 모두 prefix 시작

## Track 2: 경량화 — 모바일 첫 로딩 (4 항목)

현재 `v2.5.html` 단일 파일 944KB. v2.2에서 중복 manifest 제거로 31MB->1MB 이하로 줄였으나 여전히 무겁다.

- [ ] **size-01**: 인라인 base64 자산(이미지·폰트) 인벤토리 — 각 자산 크기·용도 주석 표로 정리 → 측정: `<!-- ASSET INVENTORY -->` 주석 블록 + 자산별 1행
- [ ] **size-02**: 중복·미사용 base64 블록 제거 → 측정: 파일 크기 직전 버전 대비 감소, 화면 렌더 회귀 없음
- [ ] **size-03**: 미사용 CSS 룰·죽은 코드 제거 → 측정: 파일 크기 추가 감소, 5개 화면 콘솔 에러 0
- [ ] **size-04**: 단일 HTML 크기 <= 400KB 도달 → 측정: `stat` 바이트 <= 409600

## Track 3: 접근성 (a11y) (8 항목)

- [ ] **a11y-01**: 모든 `button`/`a`에 `aria-label` 또는 textContent 보장 → 측정: 빈 인터랙티브 요소 0건
- [ ] **a11y-02**: 아이콘 전용 버튼에 `aria-label` 명시 → 측정: 텍스트 없는 버튼 전부 aria-label 보유
- [ ] **a11y-03**: form 요소(`input`/`select`)에 `label` 연결 → 측정: 모든 입력 요소 label 연결
- [ ] **a11y-04**: `:focus-visible` CSS — `outline 2px solid var(--brand)` + `outline-offset 2px` → 측정: focus-visible 룰 존재
- [ ] **a11y-05**: 화면 전환 시 새 화면 첫 인터랙티브 요소로 focus 이동 → 측정: route change 후 `document.activeElement` 검증
- [ ] **a11y-06**: 안전 안내 카드 `role="dialog"` + `aria-modal` + `aria-labelledby` → 측정: 정적 검증
- [ ] **a11y-07**: 키보드 탭 순서 — 모든 인터랙티브 도달, 의도치 않은 음수 tabindex 0건 → 측정: tabindex 음수 0건(의도된 trap 외)
- [ ] **a11y-08**: 본문 색 대비 >= 4.5:1, 헤더 >= 3:1 (CSS 색상 기준 계산) → 측정: 대비 계산 통과

## Track 4: 비주얼 시스템 + 다크모드 + 모션 (8 항목)

현재 `prefers-color-scheme`·`prefers-reduced-motion` 미디어 룰 0건.

- [ ] **vis-01**: 배경 warm off-white(`#FAFAF7` 류), 순백(`#FFFFFF`) UI 배경 사용 금지 → 측정: body background 정확값
- [ ] **vis-02**: 텍스트 deep navy(`#1B2838` 류), 순흑(`#000000`) 사용 금지 → 측정: `#000000` 검색 0건
- [ ] **vis-03**: 브랜드 1색 + 보조 1색만 — `--brand` / `--accent` 변수 → 측정: 두 변수 정의 + 사용 위치 >= 5
- [ ] **vis-04**: 다크 모드 — `@media (prefers-color-scheme: dark)` 룰 추가, 전 화면 대응 → 측정: 미디어 룰 존재 + 모든 화면 다크 적용
- [ ] **vis-05**: 다크용 `theme-color` meta 추가 (라이트/다크 2개) → 측정: `theme-color` meta 2개
- [ ] **vis-06**: `@media (prefers-reduced-motion: reduce)` — 모든 애니메이션 무력화 → 측정: 미디어 룰 + `transition: none` 적용
- [ ] **vis-07**: 화면 전환 슬라이드 — `translateX`, `var(--transition-page)` cubic-bezier → 측정: `.screen` transition 정확값
- [ ] **vis-08**: 폰트·타이포 위계 정리 — 본문 17px, 헤더 h1/h2/h3, font-weight <= 3종 → 측정: 사이즈·weight 검증

## Track 5: 핵심 기능 신뢰성 (5 항목)

자기모니터링 데이터 신뢰도 — round8 감사에서 지적된 "완료 전 기록" 패턴.

- [ ] **fn-01**: 세션 시작과 완료 기록 분리 — 시작 시 `activeSession`/`lastStarted`만 저장, 완료 카운터는 완료 시점에만 → 측정: 시작 직후 `completedRoutines`/`progress` 불변
- [ ] **fn-02**: `중단하고 나가기`·`뒤로`·`홈`은 완료 기록 남기지 않음 → 측정: 중단 경로에서 완료 카운터 불변
- [ ] **fn-03**: 기록 타임스탬프 구분 — `startedAt`/`completedAt`/`abortedAt` 분리 저장 → 측정: 기록 객체에 3개 필드
- [ ] **fn-04**: 첫 CTA에 세션 길이 명시 — "복식호흡 · 약 1분 · 완료 전에는 기록되지 않음" 류 → 측정: 추천 CTA 하위에 길이·기록 안내 문구
- [ ] **fn-05**: 빈 데이터 시 진도·통계 영역 empty state 안내 → 측정: 기록 0건일 때 placeholder 텍스트 노출

## Track 6: PWA & 모바일 (6 항목)

- [ ] **pwa-01**: viewport meta `width=device-width, initial-scale=1, viewport-fit=cover` 확인 → 측정: 정확 매치
- [ ] **pwa-02**: 인라인 manifest(data URL) — name/short_name/start_url/display/background_color/theme_color/icons → 측정: 7개 키 디코드 확인
- [ ] **pwa-03**: 인라인 SVG favicon + apple-touch-icon → 측정: 2개 link 존재
- [ ] **mob-01**: 모든 인터랙티브 터치 영역 >= 44px (Apple HIG) → 측정: CSS min-width/min-height 44px 적용
- [ ] **mob-02**: `safe-area-inset` 적용 — 헤더 top, 하단 영역 bottom `env()` → 측정: `env(safe-area-inset-*)` 사용
- [ ] **mob-03**: `input/textarea` font-size >= 16px(자동 zoom 방지) + `-webkit-tap-highlight-color: transparent` → 측정: CSS 값 확인

## Track 7: 에러 처리 & 출처 (5 항목)

- [ ] **err-01**: `localStorage.setItem` try/catch + QuotaExceededError 처리 → 측정: AST 검증
- [ ] **err-02**: 모든 `JSON.parse` try/catch → 측정: AST 검증
- [ ] **err-03**: 손상된 localStorage 복구/초기화 UI → 측정: catch 블록 UI 트리거
- [ ] **ref-01**: 사용 척도(알렉시티미아 등) 출처·라이선스 명시 → 측정: 척도 화면에 출처 1줄
- [ ] **ref-02**: About/설정에 면책 문구 + 제작 출처 "동행 정신건강의학과의원, 김포" → 측정: 정확 문구 매치

## Track 8: index.html 정합성 (3 항목)

- [ ] **idx-01**: `relax-routine/index.html` latest 링크가 실제 최신 버전 파일을 가리키는지 검증·수정 → 측정: latest 표시 = 최신 `v{N}.html`
- [ ] **idx-02**: index 설명 문구가 최신 버전 실제 기능과 일치 → 측정: 설명-기능 불일치 0건
- [ ] **idx-03**: 모든 버전 링크가 존재하는 파일을 가리킴(broken link 0) → 측정: 링크 대상 파일 전부 존재

---

## 시각/행동 검증 필요 (자동 진행 대상 아님)

- [ ] **vis-check-01**: 실기기(iOS Safari/Android Chrome) 5분 사용 인상 = "Calm/Headspace 같다"
- [ ] **vis-check-02**: 첫인상 5초 테스트 — "무엇 하는 앱?" 정답률 >= 4/5
- [ ] **vis-check-03**: 다크 모드 저녁 가독성 실기기 확인
- [ ] **vis-check-04**: 호흡 애니메이션 실제 진정 효과 — 1주 사용 후 인터뷰

## 원장 sign-off 필요 (자동 진행 대상 아님)

- [ ] **clin-01**: 알렉시티미아 등급 컷오프·8주 경로 매핑 변경
- [ ] **clin-02**: 안전 안내 문구·위기 연계 변경

---

## 진행 추적

| Track | 항목 수 |
|---|---:|
| 0 메타 | 3 |
| 1 결함 | 8 |
| 2 경량화 | 4 |
| 3 접근성 | 8 |
| 4 비주얼/다크/모션 | 8 |
| 5 기능 신뢰성 | 5 |
| 6 PWA/모바일 | 6 |
| 7 에러/출처 | 5 |
| 8 index 정합성 | 3 |

**자동 진행 가능**: 50개
**시각 검증 필요**: 4개 (자동 X)
**원장 sign-off**: 2개 (자동 X)

**v3.0 도달 정의**: Track 0–8 자동 항목 50개 모두 `[X]`. 위에서부터 처리, 한 항목 = 한 commit, 안전 영역 만나면 자동 정지.
