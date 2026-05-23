# DH-TALK V2 App

React + TypeScript + Vite 기반 첫 MVP입니다.

## 실행

```bash
npm install
npm run dev
```

## 검증

```bash
npm test
npm run build
```

## 현재 구현 범위

- 예약표 붙여넣기 파서
- 예약 없는 환자 빠른 추가
- 환자 클릭으로 현재 선택 환자 지정
- 환자 상태 변경, 운영 메모, 삭제, 순서 이동
- `{name}` 매크로 치환
- 개인/공통 매크로 추가, 수정, 삭제
- 호출 메시지 전송 시 사라지지 않는 호출 알림 스택
- 호출음 기본 OFF 토글
- 브라우저 파일 선택 및 확장자/크기 검증

## 아직 로컬 MVP인 부분

- Supabase Auth/Realtime/Storage 연결 준비
- Supabase 미설정 시 Local 저장 모드로 동작
- 환자 보드는 repository 계층을 통해 Local/Supabase 전환 가능
- Supabase 설정 시 `patients_today` Realtime 변경을 수신해 목록 새로고침
- 파일 업로드는 실제 저장소 업로드 전, 카드 표시까지만 구현
- Windows Always-on-top 비활성 팝업은 별도 notifier 단계에서 구현
