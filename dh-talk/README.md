# DH Talk

동행 정신건강의학과의원(김포)의 **원장 ↔ 데스크 LAN 메신저**.
Electron + React + Node.js + SQLite. Mac에서 개발, Windows ×4에 배포.

기존 사내 메신저의 문제(매크로 불편, 다음 환자 알람이 묻힘, 파일 전송 번거로움,
PHI 외부 유출)를 해결하기 위한 1인 클리닉 전용 도구다. 자세한 배경·아키텍처·로드맵은
[`CLAUDE.md`](./CLAUDE.md) 참조.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 데스크탑 셸 | Electron |
| UI | React + Vite |
| Main process | Node.js (ESM) |
| 통신 | WebSocket (`ws`) over LAN |
| DB | SQLite (`better-sqlite3`) + FTS5 |
| 빌드 | electron-builder (Windows NSIS) |

## 개발

요구 환경: **Node.js 20 이상**. (Electron 35 기준 — `npm install` 시 `better-sqlite3`
가 Electron ABI 로 자동 재빌드된다.)

```bash
npm install
npm run dev      # Vite dev 서버 + Electron 동시 기동
```

## 인증 키 설정 (필수)

WebSocket 통신은 shared secret HMAC 인증을 거친다. `config/settings.yaml` 의
`auth.shared_key` 가 비어 있으면 모든 연결이 거부된다.

```bash
npm run key      # 무작위 키 생성
```

생성된 키를 **4대 PC(데스크1/2/3/원장) 모두**의 `config/settings.yaml`
`auth.shared_key` 에 동일하게 입력한다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 모드 (Vite + Electron) |
| `npm run build` | renderer 빌드 (`dist/renderer`) |
| `npm run build:win` | Windows 설치본(.exe) 빌드 |
| `npm test` | 인증·검증·파서·매크로 순수 로직 테스트 |
| `npm run key` | WebSocket 인증 키 생성 |
| `npm start` | 빌드된 renderer로 Electron 실행 |

## 폴더 구조

```
dh-talk/
├── src/
│   ├── main/        # Electron main process (index.js, server.js, ipc.js, preload.cjs)
│   ├── renderer/    # React UI
│   └── shared/      # main/renderer 공유 상수
├── config/          # 사용자 편집 영역 (macros / settings / users .yaml)
├── scripts/         # dev / build / 배포 체크리스트
└── data/            # 런타임 (gitignore: DB, 첨부파일, 로그)
```

## 진행 상황

7일 MVP 로드맵(`CLAUDE.md` §15) — **Day 1~7 코드 완료**:

| Day | 내용 |
|---|---|
| 1 | 프로젝트 셋업, Electron + Vite + React, WebSocket echo |
| 2 | SQLite + FTS5 스키마, config 로더, MacroGrid |
| 3 | 환자 큐 — 명단 파서, advance 로직, PatientQueue |
| 4 | 메시지 송수신, `{patient}` 치환, ChatPane, 핫키 |
| 5 | 펄스 알람 (별도 BrowserWindow), ack, 에스컬레이션 |
| 6 | 파일 드래그앤드롭/붙여넣기, 검색, 30일 cleanup |
| 7 | Hermes 텔레그램 미러링, Windows 빌드 설정 |

**v0.1.1 보강** (배포 전 보안·운영) — WebSocket HMAC 인증, sender 위장
방지, 메시지 스키마 검증, ack 위조 방지, `retention_days` 실제 반영,
packaged 설정을 userData 로 이동, 큐 비우기 확인창, 운영 진단 패널.

비-GUI 로직(DB·파서·메시지 허브·인증·검증·매크로 치환·검색·cleanup·
미러링)은 단위 검증을 마쳤다. **남은 검증**: `npm run dev`로 실제 창·
펄스 알람 창·핫키 동작 확인, 다PC LAN 환경 메시지 왕복, `npm run
build:win` 으로 Windows 설치본 생성 및 데스크 PC 설치 테스트
(`scripts/deploy-checklist.md`).
