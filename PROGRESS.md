# 작업 진행 상황 — Relax Routine

> 규칙: 작업 시작 시 이 파일을 먼저 읽고, 완료 시 갱신할 것. 큰 작업은 쪼개서 단계별 커밋.

## 현재 베이스
- 최신 파일: `relax-routine/prototype/v3.10.6.html` (~17,500행, 0.98MB)
- 다음 작업 산출물: v3.10.7.html (버전 올려 생성)

## 작업 큐 (우선순위 순)

### 🔴 1순위 — 안전 (다음 작업)
- [x] (1) 위기 핫라인 버튼에 `tel:` 연결 — 109 / 1577-0199 / 129 (CrisisModal → v3.10.5)
- [ ] (2) 위기 모달 상시 진입점 추가 — Home/하단탭에 "지금 도움이 필요해요" 버튼
- [ ] (3) 안전 고지를 splash/온보딩 첫 화면으로 노출

### 🔴 2순위 — 구조 부채 (무거움, 단독 작업)
- [ ] (4) 20개 IIFE DOM 후처리 패치를 React 컴포넌트로 흡수 (16601행~)
- [ ] (5) setTimeout/setInterval 폴링 깜빡임(FOUC) 제거
- [ ] (6) PMR 이중 구현 충돌 해소 (React PMRExercise vs 오버레이)
- [ ] (7) reduced-motion을 keyframe 자체에 적용

### 🟡 3순위 — 대비/접근성
- [ ] (8) 비활성 탭/mono CTA 대비 상향
- [ ] (9) 보조 텍스트색·소형 폰트 가독성
- [ ] (10) 포커스 표시(:focus-visible) 추가, outline:none 제거
- [ ] (11) 내비게이션 이중 체계(React state vs hash) 동기화
- [ ] (12) 치료 모듈 자동진행·제어 개선 + 시작 전 안전 게이트
- [ ] (13) 터치 타깃 44px 미만 수정
- [ ] (14) 모듈 접근성(role=dialog/aria-live/ESC/포커스트랩)

### 🟢 4순위 — 저우선
- [ ] (15) 다크모드(prefers-color-scheme) 대응
- [ ] (16) 상시 폴링 인터벌 cleanup (CPU/배터리 누수)
- [ ] (17) 버전/스토리지 키 혼재 정리

## 완료 기록
- 2026-06-02 | v3.10.6 | 파일 크기 1.08MB → 0.98MB 감소 (103KB 절약)
  - PNG 로고 base64 중복 제거: boot-loader img에 id="rrLogoB64" 추가, React img를 DOM 참조로 교체 (~59KB)
  - JS 블록 주석(/* */) 제거 (~8KB)
  - JS 인라인 주석(//) 제거 (~2KB)
  - JS 들여쓰기 2칸→1칸 축소 (~30KB)
- 2026-06-02 | v3.10.5 | (1) CrisisModal 핫라인 버튼을 `<a href="tel:...">` 로 교체
  - CRISIS_ROUTES에 `tel` 필드 추가 (109, 1577-0199, 129)
  - `React.createElement("button", ...)` → `React.createElement("a", {href: \`tel:${r.tel}\`, ...})` 로 변경
  - 베이스: 리모트 v3.10.4 (UX/접근성 패치 포함) 위에 적용
  - PROGRESS.md 상 "119"는 오기 — 3번 라우트 실제 번호는 보건복지상담센터 129
