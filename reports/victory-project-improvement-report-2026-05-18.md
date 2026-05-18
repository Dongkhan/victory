# Victory 프로젝트별 개선점 보고서

작성일: 2026-05-18
대상 repo: `/opt/data/victory`

## 요약

이번 확인은 사용자가 의도한 범위인 `victory` repo 내부의 세 프로젝트를 기준으로 했다.

1. Relax Routine
2. CBT-I Care
3. DH Talk

실제 확인한 것:

- repo 최신화: `git pull --ff-only`
- 정적 프로토타입 서버 실행: `python3 -m http.server 8088`
- 브라우저에서 `index.html`, Relax Routine v0.5, CBT-I v0.2 직접 실행
- DH Talk 의존성 설치 후 renderer build 실행
- DH Talk 핵심 순수 로직 일부 Node smoke test 실행
- DH Talk Electron 실행 가능성 확인

이번에 바로 수정한 것:

- `index.html`에 DH Talk 섹션 추가
- `prototype/cbti-v0.2.html` 하단 탭 겹침 예방을 위해 스크롤 하단 여백 확대
- `prototype/cbti-v0.2.html` 날짜/시간 입력칸 폭 확대

수정 파일:

```text
index.html
prototype/cbti-v0.2.html
```

---

## 1. Relax Routine

대상 파일:

```text
prototype/v0.5.html
prototype/v0.4.html
prototype/v0.3.html
prototype/v0.2.html
prototype/v0.1.html
```

최신 버전:

```text
prototype/v0.5.html
```

### 실제 실행 확인

브라우저 실행 URL:

```text
http://127.0.0.1:8088/prototype/v0.5.html
```

확인 결과:

- 초기 화면 정상 표시
- `오늘 시작해 볼까요?` CTA 클릭 정상
- PAQ-S 기반 질문 화면으로 전환 정상
- 선택지 버튼 클릭 정상
- 명확한 하단 버튼 겹침은 보이지 않음
- 모바일 프레임 레이아웃은 전반적으로 안정적

### 현재 개선점

#### A. 온보딩 질문 완료 후 결과 해석을 더 진료실 언어로 바꾸기

현재는 PAQ-S 기반 Track 분기 구조가 잘 잡혀 있다. 다음 단계는 결과 화면을 환자에게 직접 보여줘도 되는 표현으로 더 다듬는 것이다.

권장 방향:

- Track A: 몸감각 우선형
- Track B: 감정명명 훈련형
- Track C: 사고-긴장 분리형

각 Track별로 다음을 명확히 보여주면 좋다.

```text
당신에게 먼저 맞는 방식
오늘 할 1개 루틴
진료실에서 확인할 포인트
주의할 점
```

#### B. 루틴 완료 후 기록 데이터 구조 필요

현재 프로토타입은 체험형 화면 중심이다. 실제 앱으로 가려면 완료 이벤트를 남겨야 한다.

필요 데이터:

```json
{
  "routine_id": "breathing|pmr|bodyscan|autogenic",
  "started_at": "ISO datetime",
  "completed_at": "ISO datetime",
  "pre_tension": 0,
  "post_tension": 0,
  "track": "A|B|C"
}
```

#### C. 하단 여백은 CBT-I처럼 일괄 점검 필요

Relax Routine v0.5는 현재 눈에 띄는 겹침은 없지만, 작은 모바일 화면에서는 CTA 아래 여백이 타이트할 수 있다. CBT-I에서 적용한 방식처럼 화면별 bottom padding을 명시적으로 넉넉히 두는 것이 안전하다.

---

## 2. CBT-I Care

대상 파일:

```text
prototype/cbti-v0.2.html
prototype/cbti-v0.1.html
```

최신 버전:

```text
prototype/cbti-v0.2.html
```

### GitHub에서 새로 반영된 주요 변경

이번 pull로 `cbti-v0.2.html`이 추가됐다.

추가된 핵심 내용:

- Relax Routine v0.5 색상 시스템에 맞춘 CBT-I 화면
- 스플래시 화면
- 초기 평가 소개 화면
- 수면일기 입력
- 카페인/수면질/수면제 상태 입력
- 지식 아티클 상세
- 설정 화면

### 실제 실행 확인

브라우저 실행 URL:

```text
http://127.0.0.1:8088/prototype/cbti-v0.2.html
```

확인한 동작:

- 홈 화면 정상 표시
- `오늘 수면 패턴 확인하기` 클릭 정상
- 평가 소개 → 문항 화면 전환 정상
- 평가 선택지 클릭 정상
- 하단 탭 `일기` 이동 정상
- 수면일기 값 기반 계산 표시 정상
  - 침대에 머문 시간: 7h 35m
  - 총수면시간: 6h 15m
  - 수면효율: 82%
- 비활성 screen은 `visibility:hidden` 처리되어 접근성 트리 오염이 적음

### 이번에 바로 수정한 내용

#### A. 하단 탭 겹침 예방

수정 전:

```css
.screen { padding:14px 20px 44px; }
```

수정 후:

```css
.screen { padding:14px 20px 96px; }
```

이유:

- 수면일기처럼 긴 입력 화면에서 하단 탭바가 마지막 CTA와 시각적으로 가까워질 수 있음
- 내부 스크롤 컨테이너의 하단 여백을 충분히 확보해야 실제 모바일에서 안전함

검증:

- 수면일기 화면을 최하단까지 스크롤
- 마지막 버튼 `오늘 일기 저장` bottom: 403px
- 하단 탭 top: 507px
- 실제 간격 약 104px 확보

#### B. 날짜/시간 입력칸 폭 확대

수정 전:

```css
.field { grid-template-columns:1fr minmax(104px,128px); }
```

수정 후:

```css
.field { grid-template-columns:1fr minmax(132px,168px); }
```

이유:

- 브라우저 native date/time input에서 연도/아이콘 영역이 좁게 보일 수 있음
- `2026-05-18` 같은 날짜가 잘리지 않도록 폭을 확보

검증:

- date input width: 168px

### 다음 개선점

#### A. 임상 안전 분기 추가

CBT-I는 단순 수면 루틴보다 임상 위험 분기가 중요하다. 초기 평가에 아래 항목은 별도 경고 또는 진료실 확인으로 빼는 것이 좋다.

- 조증/경조증 의심
- 자살사고 또는 심한 우울
- 수면무호흡 고위험
- 하지불안증후군 의심
- 알코올 의존 또는 진정제 과사용
- 교대근무/불규칙 근무

권장 UI:

```text
이 경우 앱 단독 진행보다 진료실에서 수면 계획을 먼저 조정해야 합니다.
```

#### B. 수면제 감량 모드는 별도 보호장치 필요

현재 `졸피뎀 감량 2주차`, `수면제 점감 보조 모드`가 보인다. 좋은 방향이지만 실제 앱에서는 다음이 필요하다.

- 감량 스케줄 직접 제안 금지
- 처방의 변경은 진료실 결정으로 명시
- 환자가 임의 감량하지 않도록 문구 삽입
- 복약 변화 기록은 의사용 요약에 표시

#### C. 치료자용 요약 화면 추가

실제 외래에서 가장 유용한 화면은 환자용 화면보다 의사용 요약이다.

권장 항목:

```text
최근 7일 평균 TST
최근 7일 평균 SE
SOL/WASO 변화
수면창 권장안
약물 사용 변화
위험 신호
다음 진료에서 확인할 질문 3개
```

---

## 3. DH Talk

대상 경로:

```text
dh-talk/
```

### 실제 실행 확인

실행한 명령:

```bash
cd /opt/data/victory/dh-talk
npm install
npm run build
```

결과:

```text
vite build 성공
39 modules transformed
renderer build 생성 완료
```

추가 smoke test:

```bash
node - <<'NODE'
import { parseQueueText } from './src/main/queue-parser.js';
import { resolveMacroText, macroTextNeeds } from './src/renderer/lib/macro.js';
import { shouldPulse } from './src/renderer/lib/alert.js';
console.log(parseQueueText('09:00 김철수\n이영희 10:30\n박민수'));
console.log(resolveMacroText('{patient} 님 들어오세요', {patient:'김철수'}));
console.log(shouldPulse({recipient:'doctor', sender:'desk1', alert_level:'next_patient'}, {me:'doctor', role:'doctor'}));
NODE
```

결과:

- 환자 명단 파싱 정상
- `{patient}` 매크로 치환 정상
- doctor 대상 next_patient pulse 판정 정상

Electron 직접 실행은 현재 Linux 환경에서 실패했다.

실패 사유:

```text
libgtk-3.so.0: cannot open shared object file
```

해석:

- 코드 오류라기보다 현재 실행 환경에 Electron GUI 의존 라이브러리가 없음
- Windows 배포 전에는 Windows 또는 GUI 라이브러리가 갖춰진 Linux/macOS에서 `npm run dev` 실제 창 테스트가 필요

### 발견된 개선점

#### A. Electron 버전 보안 업데이트 필요

`npm audit` 결과:

```text
12 vulnerabilities
2 low, 10 high
```

핵심 원인:

- `electron <=39.8.4` 계열 advisory
- `electron-builder 25.x` 계열 transitive advisory
- `tar`, `node-gyp`, `app-builder-lib` 관련 high advisory

권장:

```bash
npm install -D electron@latest electron-builder@latest
npm run build
npm run build:win
```

단, Electron major upgrade는 breaking 가능성이 있으므로 별도 브랜치에서 검증해야 한다.

#### B. 브라우저 단독 preview에서 `window.dhtalk` 없음

Vite renderer를 일반 브라우저로 열면 React App이 Electron preload API인 `window.dhtalk`를 기대해서 에러가 난다.

이건 Electron 앱에서는 정상일 수 있지만, 개발 편의상 아래 중 하나가 좋다.

1. 브라우저 preview에서는 “Electron 환경에서 실행하세요” 안내 화면 표시
2. dev mock `window.dhtalk` 제공
3. Storybook 또는 static preview 별도 제공

권장 우선순위는 1번이다. 원장/데스크 앱은 mock이 실제 동작처럼 보이면 오해가 생길 수 있다.

#### C. 실제 LAN 테스트가 아직 필요

README에도 남은 검증으로 적혀 있다.

필수 실제 테스트:

- 데스크1 서버 역할
- 데스크2/3/원장 PC 클라이언트 연결
- 다음 환자 매크로 전송
- 펄스 알람 표시 및 확인 ack
- 30초 사운드
- 60초 에스컬레이션
- 파일 드래그앤드롭 전송
- FTS 검색
- Telegram 미러링 opt-in 상태 확인

#### D. index에서 DH Talk 접근성이 없었음

이번에 `index.html`에 DH Talk 섹션을 추가했다.

추가 내용:

```html
<h2>DH Talk</h2>
<p>원장↔데스크 LAN 메신저 Electron 프로젝트.</p>
<ul>
  <li><a href="dh-talk/README.md">DH Talk README</a> — 매크로 · 환자 큐 · 펄스 알람 · 파일 전송 · Telegram 미러링 MVP</li>
</ul>
```

---

## 4. 다음 작업 우선순위

### 1순위: CBT-I 임상 안전 분기

CBT-I는 실제 환자에게 쓰려면 위험군 분기가 먼저다.

우선 추가할 항목:

- 조증/경조증
- 자살사고
- 수면무호흡
- 진정제/알코올
- 교대근무

### 2순위: DH Talk 실제 Windows 4대 테스트

코드 build는 성공했지만 Electron GUI 직접 실행은 현재 환경 의존성 때문에 못 했다. 실사용 환경은 Windows이므로 Windows 테스트가 필요하다.

### 3순위: Relax Routine 결과 화면 고도화

Relax Routine은 UI 안정성이 가장 좋다. 이제 결과 화면을 진료실 언어로 바꾸고 완료 기록 구조를 붙이면 된다.

### 4순위: repo 구조 정리

현재 `victory` 안에 여러 제품이 공존한다. 최소한 index에서 프로젝트별 진입점은 계속 유지해야 한다.

권장 구조:

```text
prototype/               # Relax Routine, CBT-I 정적 프로토타입
dh-talk/                 # Electron 앱
reports/                 # 검토 보고서
index.html               # 프로젝트별 런처
```

---

## 5. 이번 검증 명령 기록

```bash
cd /opt/data/victory
git pull --ff-only
python3 -m http.server 8088
```

```text
http://127.0.0.1:8088/index.html
http://127.0.0.1:8088/prototype/v0.5.html
http://127.0.0.1:8088/prototype/cbti-v0.2.html
```

```bash
cd /opt/data/victory/dh-talk
npm install
npm run build
npm audit --audit-level=high --json
```

---

## 6. 현재 git 변경 상태

현재 의도적으로 수정된 파일:

```text
index.html
prototype/cbti-v0.2.html
reports/victory-project-improvement-report-2026-05-18.md
```

`npm install` 과정에서 생긴 `dh-talk/package-lock.json`의 불필요한 변경은 원복했다.
