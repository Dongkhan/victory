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

```bash
npm install
npm run dev      # Vite dev 서버 + Electron 동시 기동
```

권장 런타임은 **Node 20 LTS + Electron 33.4.11 고정**이다. Electron 42 계열은 Node 22.12 이상을 요구해 현재 배포·빌드 환경과 충돌하므로, 클리닉 Windows 배포 안정성을 우선해 Electron을 LTS 안정 버전으로 낮춰 고정한다.

`npm run dev` 실행 시 창이 뜨고, echo 입력창에 메시지를 보내면 main process의
WebSocket 서버가 그대로 되돌려준다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 모드 (Vite + Electron) |
| `npm run build` | renderer 빌드 (`dist/renderer`) |
| `npm run build:win` | Windows 설치본(.exe) 빌드 |
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

비-GUI 로직(DB·파서·메시지 허브·매크로 치환·검색·cleanup·미러링)은 단위
검증을 마쳤다. **남은 검증**: `npm run dev`로 실제 창·펄스 알람 창·핫키
동작 확인, 다PC LAN 환경 메시지 왕복, `npm run build:win` 으로 Windows
설치본 생성 및 데스크 PC 설치 테스트 (`scripts/deploy-checklist.md`).
