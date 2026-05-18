# DH Talk Windows 첫 설치·실행 가이드

대상: 데스크1, 데스크2, 데스크3, 원장 PC 4대.

## 1. 설치 전 준비

1. 데스크1 PC의 고정 LAN IP를 정한다.
   - 예: `192.168.0.10`
   - 공유기 DHCP 예약 또는 Windows 고정 IP를 권장한다.
2. 데스크1 PC에서 WebSocket 포트 하나를 정한다.
   - 기본값: `8123`
   - 다른 프로그램과 충돌하면 `9123` 등으로 바꿀 수 있다.
3. 4대 PC가 같은 내부망에서 서로 통신 가능한지 확인한다.

## 2. 설치본 생성

개발 PC 또는 빌드 PC에서:

```bash
cd dh-talk
npm install
npm test
npm run build:win
```

생성물은 보통 `dist/win/` 아래에 다음 형태로 만들어진다.

- 설치본: `DH Talk-<version>-setup.exe`
- 압축 없는 실행 폴더: `win-unpacked/`

Linux에서 Windows 설치본을 만들면 NSIS 단계에서 `wine is required`로 멈출 수 있다. 이 경우 코드 빌드와 `win-unpacked` 패키징까지는 진행된 것이고, 최종 `setup.exe` 생성은 Windows 빌드 PC에서 위 명령을 다시 실행하거나 Linux에 Wine을 설치한 뒤 다시 실행한다.

## 3. 데스크1 서버 PC 설정

1. `DH Talk-<version>-setup.exe`를 실행해 설치한다.
2. DH Talk를 한 번 실행한 뒤 종료한다. 이때 사용자 설정 폴더가 생성된다.
3. 설정 파일을 연다.
   - Windows: `%APPDATA%\DH Talk\config\settings.yaml`
4. 다음 값을 설정한다.

```yaml
me: desk1

auth:
  shared_key: "데스크1에서 생성한 긴 키"

server:
  host: "192.168.0.10"
  ws_port: 8123
```

5. shared key 생성 방법:
   - 개발 폴더가 있는 PC에서 실행:

```bash
cd dh-talk
npm --silent run key
```

출력된 긴 문자열을 4대 PC의 `auth.shared_key`에 동일하게 넣는다.

6. Windows 방화벽 인바운드 허용:
   - Windows 보안 → 방화벽 및 네트워크 보호 → 고급 설정
   - 인바운드 규칙 → 새 규칙
   - 포트 → TCP → 특정 로컬 포트 `8123`
   - 연결 허용
   - 개인 네트워크에 적용
   - 이름: `DH Talk WebSocket 8123`

7. DH Talk를 다시 실행한다.
   - 이 PC가 서버 역할이다.
   - 데이터와 첨부파일은 `%USERPROFILE%\Documents\DH Talk\` 아래에 저장된다.

## 4. 데스크2/데스크3/원장 PC 설정

각 PC에서:

1. 설치본 실행.
2. DH Talk를 한 번 실행한 뒤 종료.
3. `%APPDATA%\DH Talk\config\settings.yaml`을 연다.
4. PC별 `me` 값을 다르게 지정한다.

데스크2:

```yaml
me: desk2
```

데스크3:

```yaml
me: desk3
```

원장 PC:

```yaml
me: doctor
```

5. 나머지 값은 4대 모두 동일해야 한다.

```yaml
auth:
  shared_key: "데스크1과 동일한 긴 키"

server:
  host: "192.168.0.10"
  ws_port: 8123
```

6. DH Talk를 다시 실행한다.

## 5. 첫 연결 확인 순서

1. 데스크1 DH Talk 먼저 실행.
2. 데스크2 DH Talk 실행.
3. 데스크2에서 테스트 메시지 전송.
4. 데스크1에서 수신 확인.
5. 원장 PC 실행 후 수신 확인.
6. 데스크1에서 “다음 환자” 매크로 또는 긴급 매크로를 보내 펄스 알림 창이 뜨는지 확인.
7. 알림 창에서 확인 버튼을 눌러 다른 PC의 알림이 정상 종료되는지 확인.

## 6. 연결이 안 될 때 확인

### 상태가 계속 연결 대기인 경우

1. 데스크1 앱이 켜져 있는지 확인.
2. 데스크1 `settings.yaml`의 `me: desk1`인지 확인.
3. 데스크1 `config/users.yaml`에서 `desk1`에 `is_server: true`가 있는지 확인.
4. 클라이언트 PC의 `server.host`가 데스크1 실제 LAN IP인지 확인.
5. 포트가 4대 모두 같은지 확인.
6. 데스크1 Windows 방화벽에서 TCP `8123` 인바운드 허용 확인.

### 인증 실패 또는 메시지 전송 대기 문구가 뜨는 경우

1. 4대 PC의 `auth.shared_key`가 완전히 동일한지 확인.
2. 공백, 따옴표 누락, 줄바꿈이 섞이지 않았는지 확인.
3. `me` 값이 `users.yaml`에 있는 id인지 확인: `desk1`, `desk2`, `desk3`, `doctor`.

### 메시지를 썼는데 사라질까 걱정되는 경우

현재 버전은 서버 인증 완료 전에는 전송을 막고, 실패한 메시지 draft를 지우지 않도록 보강되어 있다. 연결이 열린 뒤 다시 전송하면 된다.

## 7. 설정 파일 위치 요약

| 용도 | 위치 |
|---|---|
| 사용자 설정 | `%APPDATA%\DH Talk\config\settings.yaml` |
| 사용자/역할 목록 | `%APPDATA%\DH Talk\config\users.yaml` |
| 매크로 | `%APPDATA%\DH Talk\config\macros.yaml` |
| 메시지 DB | `%USERPROFILE%\Documents\DH Talk\messages.db` |
| 첨부파일 | `%USERPROFILE%\Documents\DH Talk\attachments\` |

## 8. 운영 원칙

- 데스크1은 서버이므로 진료 시간 중 먼저 켜져 있어야 한다.
- `auth.shared_key`는 외부에 공유하지 않는다.
- 환자 정보가 들어간 파일은 DH Talk 내부 전송을 우선한다.
- Hermes/Telegram 미러링은 HTTPS relay와 별도 API key가 준비된 경우에만 켠다.
