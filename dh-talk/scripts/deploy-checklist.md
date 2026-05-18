# DH Talk 배포 체크리스트

Day 7(Windows 빌드/설치) 작업 시 채워 나간다.

## 빌드 (Mac)

- [ ] `npm run build:win` 실행, `dist/win/DH Talk-<version>-setup.exe` 생성 확인

## 데스크1 PC (서버 호스트)

- [ ] 설치본 실행, 설치 경로 확인
- [ ] `config/settings.yaml` 의 `server.host` 를 데스크1 LAN IP 로 설정
- [ ] Windows 방화벽에서 WebSocket 포트(기본 8123) 인바운드 허용
- [ ] 첨부 저장 경로 `%USERPROFILE%\Documents\DH Talk\attachments\` 확인

## 데스크2 / 데스크3 / 원장 PC (클라이언트)

- [ ] 설치본 실행
- [ ] `config/users.yaml` 에서 자기 id 확인
- [ ] 데스크1 서버 접속 확인
- [ ] 펄스 알람 표시 확인

## 미러링

- [ ] 설치 폴더의 `resources/` 안에 `.env` 생성, `DHTALK_API_KEY` 설정
      (Hermes VPS 와 동일 값. dev 환경은 프로젝트 루트의 `.env`)
- [ ] `.env`에 `HERMES_URL=https://...` 명시. 환자 정보 보호를 위해 HTTP URL은 거부되고, 미설정 시 미러링은 비활성화된다.
- [ ] Hermes VPS 에 HTTPS `/dhtalk/relay` 엔드포인트 추가됐는지 확인 (CLAUDE.md §12)
- [ ] `mirror_to: ["telegram"]` 매크로 전송 → 텔레그램 알림 수신 확인
