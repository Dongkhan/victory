# CBT-I Care v2.1 → v3.0 Roadmap

**작동 방식**: 헤르메스(또는 다른 AI 에이전트)가 위에서부터 미완료 [ ] 항목을 하나씩 처리. 항목 완료 시 [X]로 갱신하고 GitHub에 push.

**완료 정의**: 모든 [ ]이 [X]가 되면 v3.0.

**규칙**:
- 한 항목 = 한 버전 = 한 commit
- 의존 순서대로 위에서부터
- "원장 sign-off" 표시된 항목은 자동 진행 대상 아님 — 만나면 정지 + 사용자 보고
- 각 항목은 한 줄 끝에 측정 기준이 명시되어 있음 (✅ 또는 ❌로 판정 가능)
- `prototype/v{N}.html` → `prototype/v{N+1}.html`로 진행 (R1: 직전 버전 보존)

---

## Phase 1: 접근성 (a11y) — 11 항목

- [X] **a11y-01**: `<html lang="ko">` 속성 추가 → 측정: lang 속성 존재
- [X] **a11y-02**: 모든 `<button>` 요소에 aria-label 또는 비어있지 않은 textContent 보장 → 측정: querySelectorAll('button').every(b => b.textContent.trim() \|\| b.getAttribute('aria-label'))
- [X] **a11y-03**: 모든 `<a>` 요소에 aria-label 또는 비어있지 않은 textContent 보장 → 측정: 위와 동일하게 a 요소
- [X] **a11y-04**: 아이콘 전용 버튼(이모지/SVG만)에 aria-label 명시 → 측정: 텍스트 0 글자인 button에 aria-label 있어야
- [X] **a11y-05**: focus state CSS 추가 (:focus-visible outline 2px solid currentColor) → 측정: CSS 룰 존재 + 키보드 Tab으로 5개 화면 전환 가능
- [X] **a11y-06**: 본문 텍스트 color contrast 4.5:1 이상 (WCAG AA) → 측정: 주요 텍스트 색상 vs 배경 contrast 계산값 ≥ 4.5
- [X] **a11y-07**: 큰 텍스트(18pt+) contrast 3:1 이상 → 측정: 헤더 색상 contrast ≥ 3
- [X] **a11y-08**: form `<input>`/`<textarea>`/`<select>`에 `<label for>` 또는 aria-label → 측정: 모든 입력 요소에 라벨 연결
- [X] **a11y-09**: 활성 화면(`.screen.active`)에 `aria-current="page"` 또는 라우팅 시 focus 이동 → 측정: 화면 전환 시 새 화면 첫 요소로 focus
- [X] **a11y-10**: 위기 카드 모달에 role="dialog" + aria-modal="true" + aria-labelledby → 측정: 위기 카드 표시 시 dialog role 확인
- [X] **a11y-11**: PHQ-9 #9 위기 카드 트랩 (포커스 모달 안에서 순환, ESC로 닫기) → 측정: Tab 키로 모달 밖 요소 도달 불가, ESC 작동

## Phase 2: 카피 일관성 & Intended Use 준수 — 8 항목

- [ ] **copy-01**: "진단" 표현 검사 → 측정: HTML 본문에서 "진단" 단어 검색, "진단 도구가 아닙니다" 면책 문맥 외 0건
- [ ] **copy-02**: "처방" 표현 검사 → 측정: "처방" 단어 0건 또는 면책 문맥에만
- [ ] **copy-03**: "약물" 표현 검사 → 측정: 약물 권고/조정 문맥 0건 (약물 정보 안내는 별도 표시 필요)
- [ ] **copy-04**: 면책 카피 일관성 — "본 도구는 의료기기가 아니며 진단/처방을 대체하지 않습니다" 문구가 홈/일기/플랜/리포트 4개 화면 모두에 노출 → 측정: 각 화면에 면책 표시 1회 이상
- [ ] **copy-05**: 위기 안내 문구 표준화 — "109 (생명의전화) · 1393 (자살예방상담전화) · 119 (응급) · 지역 위기지원기관 안내" 정확히 이 순서·형식 → 측정: 위기 카드 + 설정 화면에 동일 문구
- [ ] **copy-06**: 띄어쓰기 일관성 — "CBT-I" / "Cognitive Behavioral Therapy for Insomnia" 표기 통일 → 측정: 본문 검색으로 변형 0건
- [ ] **copy-07**: 오타 검사 — "수면일기" / "수면 일기", "기상시각" / "기상 시각" 등 변형 통일 → 측정: 한 표현당 한 형식
- [ ] **copy-08**: 8주 프로그램 안내가 홈에서 명확 — "주차/총 8주" 표시 → 측정: 홈 화면에 진행 주차 표시 존재

## Phase 3: PWA 기준 — 9 항목

- [ ] **pwa-01**: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` → 측정: viewport-fit=cover 포함
- [ ] **pwa-02**: `<meta name="theme-color" content="...">` 추가 (다크 모드 대응 시 prefers-color-scheme별로) → 측정: theme-color meta 존재
- [ ] **pwa-03**: `<link rel="manifest" href="data:...">` (인라인 data URL manifest, 외부 파일 없이) → 측정: manifest 링크 존재 + 유효 JSON
- [ ] **pwa-04**: manifest에 name, short_name, start_url, display: "standalone", background_color, theme_color → 측정: manifest JSON 6개 키 존재
- [ ] **pwa-05**: 인라인 SVG favicon (data URL) → 측정: `<link rel="icon" href="data:image/svg+xml...">` 존재
- [ ] **pwa-06**: 인라인 SVG apple-touch-icon (data URL, 180x180) → 측정: apple-touch-icon link 존재
- [ ] **pwa-07**: iOS web app capable meta — `<meta name="apple-mobile-web-app-capable" content="yes">` → 측정: 존재
- [ ] **pwa-08**: iOS status bar style meta — `<meta name="apple-mobile-web-app-status-bar-style" content="default">` → 측정: 존재
- [ ] **pwa-09**: beforeinstallprompt 이벤트 핸들 + "홈 화면에 추가" 버튼 (지원 브라우저만 노출) → 측정: 이벤트 리스너 등록 + UI 조건부 노출

## Phase 4: 모바일 UX 디테일 — 7 항목

- [ ] **mob-01**: 모든 탭/버튼 터치 영역 ≥ 44x44px (Apple HIG) → 측정: querySelectorAll('button, a, [role=button]').every(getBoundingClientRect().width ≥ 44 && height ≥ 44)
- [ ] **mob-02**: safe-area-inset-top 적용 (헤더 padding-top: max(env(safe-area-inset-top), 12px)) → 측정: CSS env() 사용 확인
- [ ] **mob-03**: safe-area-inset-bottom 적용 (탭바/하단 고정 영역) → 측정: 동일
- [ ] **mob-04**: 입력 시 자동 zoom 방지 — input/textarea font-size ≥ 16px → 측정: 모든 input/textarea computed font-size ≥ 16px
- [ ] **mob-05**: 가로 스크롤 방지 — body { overflow-x: hidden; } 또는 모든 컨테이너 max-width: 100% → 측정: scrollWidth ≤ clientWidth
- [ ] **mob-06**: 텍스트 선택 비활성화는 UI 요소에만 (본문 콘텐츠는 선택 가능) → 측정: user-select: none이 .button/.tab에만, p/h2 등엔 없음
- [ ] **mob-07**: tap-highlight-color 투명 또는 brand 색 (-webkit-tap-highlight-color) → 측정: CSS 룰 존재

## Phase 5: 에러 처리 & 데이터 무결성 — 8 항목

- [ ] **err-01**: localStorage.setItem try/catch + quota exceeded 시 사용자 알림 모달 → 측정: setItem 호출 모두 try/catch + QuotaExceededError 처리 분기
- [ ] **err-02**: JSON.parse 모든 호출 try/catch + 실패 시 default state로 복귀 → 측정: JSON.parse 호출 모두 try 안에 있음
- [ ] **err-03**: 빈 state 처리 — 첫 사용 시 빈 일기/플랜/리포트 화면에 "아직 데이터가 없습니다" 안내 → 측정: 각 데이터 화면에 empty state 텍스트 존재
- [ ] **err-04**: schemaVersion 마이그레이션 코드 정의되어 있고 v2.1 데이터 → v{N+1} 무손실 변환 검증 → 측정: 마이그레이션 함수 존재 + 옛 LEGACY_KEY 5개에서 새 키로 정상 이행
- [ ] **err-05**: Date 파싱 실패 시 graceful — invalid date는 null로 → 측정: new Date(input) NaN 체크 후 처리
- [ ] **err-06**: 글자 수 상한 — 일기 텍스트 입력 5000자 제한 + UI 카운터 → 측정: maxlength 속성 + 표시 카운터
- [ ] **err-07**: 동일 키 중복 저장 방지 — 같은 날짜 일기 덮어쓰기 확인 모달 → 측정: 기존 entry 존재 시 확인 prompt
- [ ] **err-08**: localStorage 손상 감지 — JSON 파싱 실패 시 "데이터 복구 또는 초기화" 선택지 제공 → 측정: 손상된 state 시 복구 UI 표시

## Phase 6: i18n & 출처 — 6 항목

- [ ] **i18n-01**: `<html lang="ko">` 기본, 사용자가 영문 전환 옵션 (설정 화면) → 측정: 설정에 언어 토글 존재
- [ ] **i18n-02**: 영문 fallback 카피 — Intended Use, 면책, 위기 안내 3개 핵심 섹션만이라도 영문 → 측정: 영문 토글 시 핵심 3개 섹션 영문 표시
- [ ] **i18n-03**: 위기 안내 영문 — "Crisis hotlines (KR): 109 Life Line · 1393 Suicide Prevention · 119 Emergency · regional crisis centers" → 측정: 영문 위기 카드 존재
- [ ] **ref-01**: 참고 문헌 섹션 추가 — Morin CM, Espie CA, Edinger JD 등 CBT-I 핵심 문헌 5개 이상 인용 → 측정: References 섹션 존재 + ≥ 5 항목
- [ ] **ref-02**: 척도 출처 명시 — ISI (Bastien et al. 2001), PHQ-9 (Spitzer et al. 1999), ESS (Johns 1991) → 측정: 각 척도 사용 화면에 출처 표시
- [ ] **ref-03**: 라이선스 명시 — PHQ-9 등 공개 척도 사용 권리 명시 → 측정: 설정/About 화면에 라이선스 섹션

## Phase 7: 개발자 노출 & 마무리 — 5 항목

- [ ] **dev-01**: DEV_MODE 가드 외 UI에 dev 기능 노출 0건 → 측정: dev/debug 텍스트가 UI에 보이지 않음
- [ ] **dev-02**: console.log 정리 — 정상 사용 시 console.error/warn 0건 → 측정: 5개 화면 전환 + 일기 1개 작성 + 리포트 조회 시 console clean
- [ ] **dev-03**: 빌드 도구 없이 단일 HTML 유지 — npm/build script 의존성 0 → 측정: HTML 파일 외 빌드 결과물 0
- [ ] **dev-04**: 파일 크기 100KB 이하 유지 → 측정: stat -c%s prototype/v{N}.html ≤ 102400
- [ ] **dev-05**: HTML W3C validator 통과 (경고 0, 에러 0) → 측정: validator.w3.org 결과 clean

---

## 원장 Sign-off 필요 항목 (자동 진행 대상 아님)

이 섹션의 항목들은 헤르메스가 만나도 [X]로 채우지 않고 사용자에게 별도 보고:

- [ ] **clin-01**: SRT 권고 수식 변경 — 현 알고리즘 (Spielman 1987 기반) 유지 vs 최신 변형 채택 → **원장 sign-off**
- [ ] **clin-02**: ISI 컷오프 변경 — 현 ≥15 임상적 불면 기준 → **원장 sign-off**
- [ ] **clin-03**: PHQ-9 cutoff 변경 — 현 ≥10 중등도 우울 기준 → **원장 sign-off**
- [ ] **clin-04**: 새 척도 추가 — DBAS-16, GSES, PSAS 등 → **원장 sign-off**
- [ ] **clin-05**: 위기 카드 노출 조건 완화 — 현 PHQ-9 #9 ≥1점 즉시 노출 → **원장 sign-off**

---

## 진행 추적

- 시작: 2026-05-21
- 완료 예상: v3.0 도달 시
- 총 항목: 54개 (자동 49 + sign-off 5)
- 자동 진행 가능: 49개

매 항목 완료 시 이 파일의 [ ]을 [X]로 갱신 + 같은 commit에 포함.
