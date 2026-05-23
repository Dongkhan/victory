# DH-TALK V2 Task Backlog

## Phase 0. 결정해야 할 것

- 기존 `dh-talk` 코드베이스를 개조할지, `DH-TALK_V2` 새 앱으로 시작할지 결정
- Supabase와 Firebase 중 선택
- 팝업을 웹 알림으로 시작할지, Windows 도우미를 바로 만들지 결정
- 파일 보관 기간 기본값 결정

권장 결정:

```text
새 앱: DH-TALK_V2/app
Realtime/Storage: Supabase
Popup: 웹앱 내 팝업 먼저 + Windows 도우미 별도 트랙
File retention: 기본 7일
```

## Phase 1. 프로젝트 스캐폴드

- Vite React TypeScript 앱 생성
- ESLint/Prettier 설정
- 기본 라우팅
- Supabase client 설정
- `.env.example` 작성
- 테스트 프레임워크 설정

## Phase 2. 데이터베이스

- Supabase schema 작성
- users/profile 테이블
- patients_today 테이블
- macros 테이블
- messages 테이블
- call_alerts 테이블
- files 테이블
- Row Level Security 정책
- seed 데이터

## Phase 3. 환자 보드

- 오늘 날짜 기준 환자 목록 조회
- 환자 추가
- 환자 수정
- 환자 삭제
- 상태 변경
- 순서 변경
- 예약표 붙여넣기 파서
- 실시간 동기화

## Phase 4. 환자 선택과 매크로

- 현재 선택 환자 state
- 공통 매크로 조회
- 개인 매크로 조회
- 매크로 편집 UI
- `{name}` 치환
- 매크로 전송
- 직접 입력 전송

## Phase 5. 호출 팝업

- call_alerts 생성
- 수신자별 alert 구독
- 웹앱 내 persistent popup 구현
- 닫기/확인 전까지 유지
- 소리 기본 OFF
- 소리 ON 설정
- 여러 호출 누적 처리

## Phase 6. 파일 전송

- 파일 선택 UI
- 파일 타입/크기 validation
- Storage 업로드
- 업로드 진행률
- files metadata 저장
- file message 생성
- 파일 카드 UI
- 다운로드 signed URL 생성
- 삭제
- 만료 cleanup 설계

## Phase 7. Windows 알림 도우미

- Tauri/Electron 선택
- Supabase auth/session 처리
- call_alerts 구독
- always-on-top 팝업
- non-focusable/showInactive 검증
- 닫기 전까지 유지
- 소리 설정
- Windows 설치 패키지

## Phase 8. QA

- 환자 보드 2PC 동기화 테스트
- 매크로 치환 테스트
- 팝업 포커스 비탈취 테스트
- 파일 업로드/다운로드 테스트
- 비로그인 파일 접근 차단 테스트
- 민감정보 입력란 부재 확인
- 브라우저 호환성 확인

## Phase 9. 운영 배포

- Supabase production project
- Vercel/Netlify 배포
- 병원 사용자 계정 생성
- 직원 교육용 1페이지 가이드
- 장애 대응 문서
- 백업/정리 정책 확정
