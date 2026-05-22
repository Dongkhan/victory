# CBT-I Care — ROADMAP-v6 (코딩 완성 마무리)

**선행 상태**: ROADMAP-v4(50항목)·ROADMAP-v5(=`docs/ROADMAP.md`, 141항목) 자동 항목 모두 완료. 현 latest `prototype/v2.271.html`(96KB)는 접근성·다크모드·PWA manifest·온보딩·시각화가 완성 수준이다.

**목표**: 남은 **코딩 단계 결함·정합성·경량화·오프라인**을 마무리해 단일 HTML을 최종 출시 후보(v3.0)로 확정한다. 새 기능 추가가 아니라 **정리·검증·동기화**가 핵심이다.

**작동 방식** (헤르메스 goal):
- 위에서부터 미완료 `[ ]` 항목 순서대로. **한 항목 = 한 버전 = 한 commit**.
- `cbti-care/CLAUDE.md`의 R1~R4 규칙을 그대로 따른다 (직전 버전 보존, 한 버전당 변경 폭 제한).
- commit 메시지: `feat(cbti-care): ROADMAP-v6 <code> (v{N+1})`
- 안전 함수 5종(`safetyHardFlags`, `calculateSrtRecommendation`, `diaryClinicalWarnings`, `validateDiaryEntry`, `normalizeImportedEntry`)은 byte-identical 유지.

**자동 정지 조건**: `cbti-care/CLAUDE.md` R2 그대로 적용 (안전 함수 본문 변경 / schemaVersion·STORAGE_KEY 변경 / 시크릿 / 외부 전송 / PHQ-9 #9 흐름).

**완료 정의**: Track 1–6 자동 항목 모두 `[X]` = CBT-I Care v3.0 확정.

---

## Track 1: index.html 정합성 — 즉시 수정 (4 항목)

`cbti-care/index.html`에서 발견된 실제 결함: 버전 목록의 **모든 링크가 `v2.248.html`을 가리킴**(라벨은 v2.247, v2.103 등으로 표기). 사용자가 이전 버전을 열 수 없다.

- [X] **idx-01**: 버전 목록 각 항목의 `href`를 라벨과 일치하는 실제 파일로 수정 → 측정: 각 `<a href>` = 같은 줄의 버전 라벨, 불일치 0건
- [X] **idx-02**: 라벨 텍스트와 href가 모두 존재하는 파일을 가리킴(broken link 0) → 측정: 모든 링크 대상 파일 존재
- [X] **idx-03**: latest 표시(`<small>latest</small>`)는 최신 1개 항목에만 존재 → 측정: `latest` 표기 정확히 1건
- [X] **idx-04**: 상단 설명 문구의 버전 번호가 실제 latest와 일치 → 측정: "최신 실행 파일은 v{N}" = 실제 최신

## Track 2: 문서 정합성 (4 항목)

- [X] **doc-01**: `docs/ROADMAP-v5.md` 부재 해소 — commit이 "ROADMAP-v5"를 141회 참조하나 파일이 없음. `docs/ROADMAP.md`를 `ROADMAP-v5.md`로 명명하거나, `ROADMAP.md` 상단에 "= ROADMAP-v5" 별칭 주석 추가 → 측정: ROADMAP-v5 식별 가능한 파일/주석 존재
- [X] **doc-02**: `docs/IMPROVEMENT-PRD.md`의 Baseline(`v2.1`)·Target(`v3.0`) 표기를 현재 상태로 갱신 → 측정: Baseline = 현 latest, 진행 현황 반영
- [X] **doc-03**: `cbti-care/CLAUDE.md`의 "현재 베이스라인 `v2.1.html`" 표기를 현 latest로 갱신 → 측정: CLAUDE.md baseline = 현 latest
- [X] **doc-04**: 파일 크기 기준 불일치 해소 — PRD와 ROADMAP은 "120KB 이하". 한 기준으로 통일하고 두 문서 동기화 → 측정: 두 문서 동일 수치

## Track 3: 경량화 (4 항목)

현 96KB. PRD 비-기능 요구는 "120KB 이하". 248회 반복하며 누적된 죽은 코드 정리가 필요.

- [X] **size-01**: 미사용 CSS 룰 식별·제거 → 측정: 파일 크기 감소, 6개 화면 렌더 회귀 0
- [X] **size-02**: 미사용 JS 함수·중복 헬퍼 제거 → 측정: 파일 크기 감소, console 에러 0
- [X] **size-03**: 중복 인라인 SVG·data URL 통합(공통 정의 재사용) → 측정: 동일 SVG 중복 0건
- [X] **size-04**: 단일 HTML <= 120KB 도달 → 측정: `stat` 바이트 <= 122880

## Track 4: PWA 오프라인 (3 항목)

manifest·theme-color는 존재하나 service worker가 없어 진짜 오프라인 동작이 안 된다.

- [ ] **pwa-01**: 인라인 service worker 등록 — 정적 자원(현재 HTML)만 캐시. **user data 절대 캐시 금지** → 측정: `serviceWorker.register` 존재 + 캐시 대상에 localStorage 키 0건
- [ ] **pwa-02**: 오프라인 진입 시 정상 로드 확인 → 측정: 네트워크 차단 후 재방문 시 화면 정상
- [ ] **pwa-03**: SW 버전 업데이트 처리 — 새 버전 배포 시 캐시 무효화 → 측정: SW에 cache-name 버전 + activate 시 구 캐시 삭제

## Track 5: 테스트 동기화 (4 항목)

`tests/` 회귀 테스트가 옛 버전(v1.7)을 latest로 하드코딩 — 현재 2건 실패(`test_ba_cbti_rr_prelaunch_latest.py`, `test_cbti_release_quality.py`).

- [ ] **test-01**: CBT-I 버전 하드코딩 테스트를 현 latest 기준으로 갱신 → 측정: `pytest tests/` 실패 0건
- [ ] **test-02**: latest 버전을 동적으로 탐지하는 헬퍼로 전환(버전 올라가도 안 깨지게) → 측정: 테스트가 `prototype/` 최신 파일 자동 인식
- [ ] **test-03**: index.html broken-link 검증 테스트 추가(Track 1 회귀 방지) → 측정: 링크-라벨 일치 검증 테스트 존재
- [ ] **test-04**: 안전 함수 5종 byte-identical 회귀 테스트 추가 → 측정: 안전 함수 해시 고정 테스트 통과

## Track 6: 최종 코드 위생 (4 항목)

- [ ] **hyg-01**: `placeholder` 잔여 3건 검토 — 실제 입력 placeholder면 유지, 미완성 표식이면 해결 → 측정: 미완성 표식 placeholder 0건
- [ ] **hyg-02**: DEV/QA 기능(`QA 7일 데이터 입력` 등)이 일반 UI에 노출되지 않는지 확인 → 측정: DEV_MODE 가드 밖 QA 버튼 0건
- [ ] **hyg-03**: HTML W3C validator 통과 → 측정: validator 결과 clean
- [ ] **hyg-04**: 앱 내 모든 surface 버전 표기가 latest와 일치(상단 pill 포함) → 측정: 버전 문자열 unique = 1

---

## 시각/행동 검증 필요 (자동 진행 대상 아님)

`docs/ROADMAP.md`의 vis-check-01~07 그대로 유효(첫인상 5초 테스트, 60초 first value 실측, focus trap, 다크모드 가독성, sleep-mode 터치, 호흡 효과, 색맹 위기 카드 인지).

## 원장 sign-off 필요 (자동 진행 대상 아님)

`docs/ROADMAP.md`의 clin-01~06 그대로 유효(SRT 수식, ISI/PHQ-9 컷오프, 척도 추가, 위기 카드 조건, 영문 위기 안내 임상 확인).

---

## 진행 추적

| Track | 항목 수 |
|---|---:|
| 1 index 정합성 | 4 |
| 2 문서 정합성 | 4 |
| 3 경량화 | 4 |
| 4 PWA 오프라인 | 3 |
| 5 테스트 동기화 | 4 |
| 6 코드 위생 | 4 |

**자동 진행 가능**: 23개
**시각 검증·sign-off**: `docs/ROADMAP.md` 잔여 항목 승계 (자동 X)

**v3.0 확정 정의**: Track 1–6 자동 항목 23개 모두 `[X]`. 위에서부터 처리, 한 항목 = 한 commit, R2 안전 영역 만나면 자동 정지.
