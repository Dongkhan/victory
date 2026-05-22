# DH Talk — 코딩 완성 로드맵 (v1.0)

**대상**: 동행 정신건강의학과의원 원장<->데스크 LAN 메신저. Electron + React + Node + SQLite. 현재 `package.json` v0.1.0, 7일 MVP(Day 1~7) 코드 완료.

**목표**: GUI·다PC 실측을 제외한 **코딩 단계 완성** — 비-GUI 로직 테스트 커버리지, 보안 하드닝, 에러 견고성, 빌드 재현성을 마무리해 LAN 파일럿 후보로 확정한다.

**현 상태 요약** (감사·점검 기반):
- P0 fail-open 인증은 해소됨 — `server.js`의 `startServer`가 사용 불가 shared_key면 throw.
- 단위 테스트는 `test/hermes-mirror.test.mjs` 1개뿐. `queue-parser`·`config`·`cleanup`·`server` 인증·`macro` 치환·`db`·`env`는 미검증.
- production dependency audit는 clean, full audit는 Electron 33 계열 high advisory 다수.
- `scripts/deploy-checklist.md`는 전 항목 미체크(Day 7 현장 배포 미수행).

**작동 방식** (헤르메스 goal):
- 위에서부터 미완료 `[ ]` 항목 순서대로. **한 항목 = 한 commit**.
- commit 메시지: `feat(dh-talk): ROADMAP <code>`
- 항목이 요구하는 변경만 적용. `dh-talk/CLAUDE.md`의 작업 규칙을 따른다.
- 각 항목 후 `npm test` + `npm run build` 통과 확인.

**자동 정지 조건 (안전 영역 — 접촉 시 종료 + 사용자 보고)**:
1. LAN 인증을 약화시키는 변경(fail-open 재도입, shared_key 검증 우회)
2. `.env`·`*.env`(템플릿 제외)·키·DB·토큰을 repo에 커밋
3. 메시지 `sender`를 인증 소켓 사용자가 아닌 클라이언트 입력으로 신뢰하는 변경
4. PHI(환자명·호출·메모) 보존 정책(`retention_days`) 또는 cleanup 로직을 약화
5. Hermes 미러링을 https 강제에서 평문 http 무조건 허용으로 변경
6. 외부 네트워크 egress를 LAN/Hermes relay 외로 신규 추가

**완료 정의**: Track 1–5 자동 항목이 모두 `[X]` = DH Talk 코딩 완성. 다PC LAN 실측·Windows 설치는 별도(자동 X).

---

## Track 1: 단위 테스트 커버리지 (8 항목)

비-GUI 로직은 헤드리스로 검증 가능. `node --test` 기반.

- [ ] **test-01**: `queue-parser` 테스트 — 환자 명단 파싱·advance 로직·엣지 케이스(빈 줄, 중복) → 측정: `test/queue-parser.test.mjs` 통과
- [ ] **test-02**: `config` 로더 테스트 — macros/settings/users YAML 파싱·기본값·누락 처리 → 측정: `test/config.test.mjs` 통과
- [ ] **test-03**: `server` 인증 테스트 — shared_key 누락·`CHANGE_ME_BEFORE_USE`·20자 미만 시 `startServer` 거부 → 측정: 3개 케이스 모두 throw 검증
- [ ] **test-04**: `server` hello 핸드셰이크 테스트 — 미등록 사용자·키 불일치·hello 타임아웃 reject → 측정: 3개 reject 경로 검증
- [ ] **test-05**: `server` sender 보정 테스트 — 클라이언트가 위조한 `sender`를 서버가 인증 소켓 사용자로 덮어쓰는지 → 측정: 위조 sender 입력 시 실제 userId로 치환
- [ ] **test-06**: macro 치환 테스트 — `{patient}` 등 토큰 치환·미정의 토큰 처리 → 측정: `test/macro.test.mjs` 통과
- [ ] **test-07**: `cleanup` 테스트 — 30일 경과 메시지·첨부 정리, 보존 기간 내 데이터 미삭제 → 측정: 경계값(29일/30일/31일) 검증
- [ ] **test-08**: `db` 스키마·FTS5 검색 테스트 — insert/search/30일 cleanup 연동 → 측정: in-memory SQLite로 CRUD+검색 통과

## Track 2: 보안 하드닝 (5 항목)

- [ ] **sec-01**: `npm audit` full 결과를 `docs/`에 스냅샷 기록 + high 항목별 영향 범위(dev-only 여부) 분류 → 측정: `docs/security-audit.md` 존재 + 항목별 분류
- [ ] **sec-02**: dev/build 체인 high 취약점 중 breaking 없이 올릴 수 있는 것 패치 → 측정: `npm audit` high 개수 감소, `npm run build` 통과
- [ ] **sec-03**: Electron 버전 정책 문서화 — 33 LTS 고정 사유와 상위 major 이전 조건 명시 → 측정: `docs/`에 Electron 버전 정책 1절
- [ ] **sec-04**: `config/settings.yaml` 기본 `shared_key: CHANGE_ME_BEFORE_USE` 사용 시 renderer가 소켓 연결 자체를 열지 않도록 확인·보강 → 측정: 기본키 상태에서 connect 차단 + 안내 UI
- [ ] **sec-05**: Electron 보안 기본값 회귀 테스트 — `contextIsolation:true`·`nodeIntegration:false`·`sandbox:true` 정적 검증 → 측정: 구조 테스트에 3개 assert 추가

## Track 3: 견고성 & 에러 처리 (5 항목)

- [ ] **rob-01**: WebSocket 연결 끊김 시 자동 재연결(지수 백오프) + renderer 상태 표시 → 측정: 연결 끊김 -> 재연결 로직 + UI 상태
- [ ] **rob-02**: 서버 미기동·방화벽 차단 시 renderer에 명확한 진단 안내 → 측정: 연결 실패 시 원인별 안내 문구
- [ ] **rob-03**: `db` 오류(파일 잠금·손상) try/catch + 복구/재생성 경로 → 측정: db 초기화 실패 시 graceful 처리
- [ ] **rob-04**: 첨부 파일 처리 — 크기 상한·허용 확장자·저장 경로 부재 시 처리 → 측정: 초과·미허용·경로없음 3케이스 처리
- [ ] **rob-05**: 펄스 알람 ack·에스컬레이션이 특정 메시지 id에 정확히 바인딩되는지 단위 검증 → 측정: ack/escalation 테스트 통과

## Track 4: 빌드 재현성 (4 항목)

- [ ] **build-01**: `npm run build` 클린 환경 재현성 확인 — `node_modules` 삭제 후 install->build 통과 → 측정: 클린 빌드 성공 로그
- [ ] **build-02**: `.nvmrc`·`package.json` engines로 Node 20 LTS 고정 명시 → 측정: `engines.node` 필드 존재 + `.nvmrc` 일치
- [ ] **build-03**: `electron-builder.yml` Windows NSIS 설정 정적 검증(appId·아티팩트명·아이콘 경로) → 측정: 필수 필드 존재
- [ ] **build-04**: `scripts/build-windows.sh` 가 빌드 산출물 경로를 검증하고 실패 시 명확히 종료 → 측정: 산출물 부재 시 non-zero exit

## Track 5: 문서·정합성 (4 항목)

- [ ] **doc-01**: `README.md` 진행 상황 표가 현재 코드 상태와 일치(테스트 커버리지 반영) → 측정: README 진행 표 갱신
- [ ] **doc-02**: `dh-talk/CLAUDE.md`의 로드맵·아키텍처 절을 현 상태로 동기화 → 측정: CLAUDE.md 상태 표기 갱신
- [ ] **doc-03**: `.env.example`이 실제 사용 환경변수(`DHTALK_SHARED_KEY`·`DHTALK_API_KEY` 등)를 모두 키 이름만으로 포함 → 측정: 코드에서 참조하는 env 키 전부 example에 존재
- [ ] **doc-04**: `package.json` 버전을 코딩 완성 시점 기준으로 갱신(v0.1.0 -> v0.2.0) → 측정: version 필드 갱신

---

## 현장 검증 필요 (자동 진행 대상 아님 — 실제 하드웨어 필요)

- [ ] **field-01**: `npm run dev`로 실제 창·펄스 알람 창·핫키 동작 확인
- [ ] **field-02**: desk1 서버 PC + 클라이언트 PC 2대 이상 실제 LAN 메시지 왕복
- [ ] **field-03**: shared_key 불일치·누락·짧은 키 시 연결 차단 현장 확인
- [ ] **field-04**: 방화벽 차단 시 진단 안내 정확도 확인
- [ ] **field-05**: `npm run build:win`으로 Windows 설치본 생성 + 데스크 PC 설치 테스트(`scripts/deploy-checklist.md`)
- [ ] **field-06**: Hermes VPS `/dhtalk/relay` 연동 + 텔레그램 미러링 수신 확인

## 원장 결정 필요 (자동 진행 대상 아님)

- [ ] **dec-01**: `ws://` 평문 LAN 유지 vs `wss`/Tailscale 등 암호화 overlay 도입
- [ ] **dec-02**: PHI 보존 기간(`retention_days: 30`) 정책 확정

---

## 진행 추적

| Track | 항목 수 |
|---|---:|
| 1 단위 테스트 커버리지 | 8 |
| 2 보안 하드닝 | 5 |
| 3 견고성/에러 처리 | 5 |
| 4 빌드 재현성 | 4 |
| 5 문서/정합성 | 4 |

**자동 진행 가능**: 26개
**현장 검증 필요**: 6개 (자동 X)
**원장 결정 필요**: 2개 (자동 X)

**코딩 완성 정의**: Track 1–5 자동 항목 26개 모두 `[X]` + `npm test`·`npm run build` 통과. 위에서부터 처리, 한 항목 = 한 commit, 안전 영역 만나면 자동 정지.
