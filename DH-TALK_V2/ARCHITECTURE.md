# DH-TALK V2 Architecture

## 1. 권장 구조

```text
원장 PC / 직원 PC / 대기실 화면
        ↓ HTTPS / WebSocket
클라우드 웹앱
        ↓
실시간 DB + 파일 스토리지
        ↓
선택적 Windows 알림 도우미
```

## 2. 기본 웹앱

권장 스택:

```text
React + TypeScript + Vite
Supabase Auth
Supabase Postgres
Supabase Realtime
Supabase Storage
```

대안:

```text
Firebase Auth
Firestore
Firebase Storage
Firebase Hosting
```

## 3. 서버컴 제거

서버컴을 쓰지 않는다. 각 PC는 같은 웹 주소에 접속한다.

장점:

- 내부망 연결 문제 제거
- Windows 공유/방화벽 문제 제거
- 서버컴 절전/재부팅 문제 제거
- 업데이트 배포 단순화
- 태블릿/휴대폰 확장 가능

## 4. 실시간 동기화

동기화 대상:

- 오늘 환자 목록
- 환자 상태
- 환자 순서
- 현재 선택 환자
- 메시지
- 호출 팝업 이벤트
- 파일 카드 메타데이터

Supabase 사용 시:

```text
patients_today: realtime update/insert/delete 구독
messages: insert 구독
call_alerts: 수신자 기준 insert/update 구독
macros: 사용자별 fetch + update
files: message와 연결
```

## 5. 호출 팝업 구현 전략

### 5.1 웹앱만 사용할 때

가능:

- 브라우저 내부 팝업
- 브라우저 데스크톱 알림
- 소리 재생
- 대기실 화면 표시

제한:

- 다른 프로그램 위 always-on-top 보장 어려움
- 비활성 non-focusable 팝업 보장 어려움

### 5.2 Windows 알림 도우미

원장의 요구사항을 안정적으로 만족하려면 별도 도우미가 필요하다.

권장:

```text
Tauri 또는 Electron
```

요구 동작:

- call_alerts 실시간 구독
- 새 호출 수신 시 always-on-top 팝업 표시
- focusable false 또는 showInactive 방식
- taskbar 표시 생략
- 확인/닫기 전까지 유지
- 소리 기본 OFF

Electron 개념 예시:

```javascript
const win = new BrowserWindow({
  width: 420,
  height: 180,
  alwaysOnTop: true,
  focusable: false,
  skipTaskbar: true,
  frame: false,
  transparent: true,
});

win.setAlwaysOnTop(true, 'screen-saver');
win.showInactive();
```

Tauri 구현 시 Windows API 또는 window 플러그인을 통해 유사 동작을 검증해야 한다.

## 6. 파일 전송 구조

파일은 DB에 직접 넣지 않는다.

```text
브라우저 파일 선택
→ Storage 업로드
→ files 테이블에 메타데이터 저장
→ messages 테이블에 type=file 메시지 생성
→ 다른 사용자가 파일 카드에서 다운로드
```

보안:

- 인증된 사용자만 접근
- public bucket 금지
- signed URL은 짧은 만료시간
- 파일 보관 기간 만료 시 cleanup job
- 실행파일 차단

## 7. 권한 모델

### admin

- 공통 매크로 관리
- 전체 설정 관리
- 사용자 관리
- 파일 삭제

### doctor

- 환자 선택
- 호출 전송
- 메시지 전송
- 파일 업로드
- 개인 매크로 관리

### staff

- 환자 목록 수정
- 상태 변경
- 호출 수신
- 메시지 전송
- 파일 업로드
- 개인 매크로 관리

### waiting_room

- 대기실 표시만 가능
- 개인정보 노출 최소화
- 조작 권한 없음

## 8. 배포 전략

1. `DH-TALK_V2` 문서 기반 프로젝트 생성
2. `dh-talk-v2` 또는 기존 `dh-talk` 하위에 실제 앱 구현 여부 결정
3. Supabase 프로젝트 생성
4. DB migration 작성
5. Vercel/Netlify 배포
6. Windows 알림 도우미는 별도 패키지로 배포

## 9. MVP 경계

MVP에서 하지 않을 것:

- EMR 직접 연동
- 카카오/SMS 연동
- 환자 진료기록 저장
- 자동 진단/의료 판단
- 영구 파일 보관

MVP에서 반드시 할 것:

- 환자 보드
- 환자 선택
- 매크로 치환
- 호출 팝업 이벤트
- 매크로 수정
- 브라우저 파일 전송 기본형
