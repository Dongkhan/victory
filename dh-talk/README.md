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

7일 MVP 로드맵 기준 — **Day 1 완료**: 프로젝트 셋업, Electron + Vite + React 부팅,
WebSocket echo. 이후 Day는 `CLAUDE.md` §15 참조.
