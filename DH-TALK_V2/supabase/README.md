# Supabase Setup

DH-TALK V2는 서버컴 대신 Supabase를 사용해 여러 PC를 동기화한다.

## 1. 프로젝트 생성

1. Supabase에서 새 프로젝트 생성
2. Authentication은 초기에 이메일/비밀번호 방식 사용
3. 직원별 계정 생성
4. SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행

## 2. 환경변수

`DH-TALK_V2/app/.env.local` 생성:

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

비어 있으면 앱은 Local MVP 모드로 동작한다.

## 3. Realtime

마이그레이션은 다음 테이블을 Realtime publication에 추가한다.

- `patients_today`
- `messages`
- `call_alerts`

## 4. 개인정보 원칙

저장 허용:

- 당일 운영용 환자명
- 예약 시간
- 대기 상태
- 운영 메모
- 호출 메시지
- 임시 전달 파일 메타데이터

저장 금지:

- 주민등록번호
- 진단명
- 처방 내용
- 심리검사 원자료
- 차트 기록
- 상담 내용

## 5. 다음 구현 순서

1. 환자 보드 CRUD를 `patients_today`에 연결 완료
2. 환자 보드 Realtime 구독 준비 완료
3. 호출 메시지를 `messages`와 `call_alerts`에 저장
4. 직원 화면에서 `call_alerts` Realtime 수신
5. 파일은 Supabase Storage bucket과 `transfer_files` 메타데이터 연결
