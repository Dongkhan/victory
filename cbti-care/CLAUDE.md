# CBT-I Care — AGENTS Guide

이 디렉토리에서 작업하는 AI 에이전트(헤르메스, Claude Code 등)를 위한 작업 규칙.

## 프로젝트 정체

CBT-I Care는 **8주 CBT-I 보조 자가관리 도구**의 HTML 프로토타입입니다.
React/RN으로 이식하기 전 단계로, 단일 HTML 파일에서 임상 완성도와 사용성을 끝까지 끌어올리는 중입니다.

- **현재 베이스라인**: `prototype/v2.1.html` (현 latest)
- **목표**: `docs/IMPROVEMENT-PRD.md`와 `docs/ROADMAP.md`의 체크박스를 모두 [X]로 만드는 것
- **다음 트랙(범위 밖)**: RN/Expo 이식, IRB, 앱스토어 — 이 디렉토리 범위 밖

## 작업 규칙 (어떤 에이전트도 깨지 않음)

### R1. 직전 버전 영구 보존
- `prototype/v{N}.html`은 절대 수정 안 함
- 항상 `cp v{N}.html v{N+1}.html` 후 v{N+1}만 수정
- 회귀 시 직전 버전으로 즉시 복귀

### R2. 자동 정지 조건 (안전 영역, 깨면 종료)

다음을 만지면 **자동 종료** + 사용자에게 보고:

1. **임상 안전 함수 5종 본문 변경**:
   - `safetyHardFlags`, `calculateSrtRecommendation`, `diaryClinicalWarnings`, `validateDiaryEntry`, `normalizeImportedEntry`
   - 이 함수들은 byte-identical로 유지
2. **`schemaVersion` / `STORAGE_KEY` / `LEGACY_KEY` 변경**: 사용자 데이터 손실 위험
3. **시크릿 패턴 발견**: `API_KEY|TOKEN|password|ghp_|sk-`, 주민번호, 휴대폰
4. **외부 데이터 전송 코드 신규 추가**: `fetch(`, `XMLHttpRequest`, `sendBeacon` 로 localhost 외 호출
5. **PHQ-9 #9 자살사고 처리 로직 변경**: 위기 카드가 점수보다 먼저 노출되는 흐름 유지

### R3. 한 버전당 변경 폭
- 동시 변경 영역 ≤ 5개
- 파일 크기 증가 ≤ +30KB
- 안전 함수 변경 없어야 함 (R2.1)

### R4. 데이터 외부 전송 0
- localStorage 외 어떤 저장소도 추가 금지
- PWA SW는 정적 자원만 캐시. user data 절대 안 됨

## 작업 흐름 (모든 체크박스에 공통)

ROADMAP.md의 체크박스 하나 = 한 버전 = 한 commit:

```
1. 다음 미완료 [ ] 항목 선정 (위에서부터 순서대로, 의존 표시 따라)
2. 직전 latest 버전 파일 GitHub raw에서 가져옴
3. cp v{N}.html v{N+1}.html
4. 항목이 요구하는 변경만 v{N+1}.html에 적용
5. R2 자동 정지 조건 검사 (실패 시 v{N+1} 폐기, 사용자에게 보고)
6. headless 브라우저로 페이지 로드 + console 에러 0개 + 5개 화면 전환 확인 (도구 있으면)
7. index.html 갱신 (latest 표시 이동, 한 줄 요약 추가)
8. GitHub Contents API로 두 파일 main에 push
9. ROADMAP.md의 해당 [ ]을 [X]로 갱신 + commit
10. 다음 미완료 항목으로 이동
```

## GitHub 작업

- 레포: `Dongkhan/victory`, 디렉토리: `cbti-care/`
- 인증: `GITHUB_TOKEN` 환경변수 (`repo` scope)
- 모든 push는 `main` 직접 (R2가 위험 변경을 자동 정지하므로 안전)
- 안전 함수 변경이 필요한 항목은 ROADMAP에 명시적으로 "원장 sign-off 필요" 마킹되어 자동 진행 대상에서 제외됨

## 빠른 참고

- `prototype/v2.1.html` 안전 함수 위치:
  - `safetyHardFlags`: 검색 `function safetyHardFlags`
  - `calculateSrtRecommendation`: 검색 `function calculateSrtRecommendation`
  - `diaryClinicalWarnings`: 검색 `function diaryClinicalWarnings`
  - `validateDiaryEntry`: 검색 `function validateDiaryEntry`
  - `normalizeImportedEntry`: 검색 `function normalizeImportedEntry`
- 상태 키: `STORAGE_KEY='cbti-care-v21-state'`, 5개 LEGACY 키 fallback 유지
- 면책 카피 출처: 화면 곳곳에 분산 (`docs/IMPROVEMENT-PRD.md`의 Intended Use 섹션 참조)

## 사용자가 결정해야 할 것 (에이전트가 결정하지 않음)

- 임상 알고리즘 변경 (안전 함수 5종)
- 새 척도 추가 (현재는 ISI/PHQ-9/ESS 안내만)
- Intended Use 범위 확장
- 신규 의료기기 분류 클레임
- 모든 ROADMAP 항목 중 "원장 sign-off" 표시 된 것

이런 항목은 에이전트가 마주치면 [X]로 자동 채우지 말고, 사용자에게 별도 보고 후 대기.
