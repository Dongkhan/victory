# DH-TALK V2 Product Spec

## 1. 제품 정의

DH-TALK V2는 정신건강의학과 외래 운영에서 환자 대기 흐름, 진료실 호출, 직원 간 간단한 운영 메시지, 임시 파일 전달을 처리하는 내부 웹앱이다.

핵심은 채팅앱이 아니라 `환자 흐름 보드 + 환자명 자동삽입 매크로 + 비활성 호출 팝업`이다.

## 2. 사용자

### 원장

- 오늘 환자 목록을 본다.
- 현재 부를 환자를 클릭한다.
- “들어오세요” 등 매크로를 누른다.
- 필요 시 직원에게 간단한 운영 메시지를 보낸다.

### 접수/직원

- 예약 환자 리스트를 올린다.
- 실제 내원 순서대로 환자 리스트를 수정한다.
- 예약 없이 온 환자를 추가한다.
- 원장 호출 팝업을 확인하고 닫는다.
- 개인 매크로를 수정한다.
- 필요 시 파일을 업로드/다운로드한다.

### 대기실 화면

- 선택적으로 호출 메시지를 크게 표시한다.
- 대기실용 화면은 별도 모드로 둔다.

## 3. 주요 화면

### 3.1 오늘 환자 보드

필수 UI:

```text
상단
[예약표 붙여넣기] [환자 추가] [오늘 초기화] [설정]

좌측
오늘 환자 보드
- 대기
- 진료중
- 완료
- 보류/노쇼

우측
현재 선택 환자
매크로 버튼
직접 입력창
전송 버튼
파일 첨부 버튼
```

### 3.2 환자 카드

필드:

- 환자명
- 예약 시간
- 상태
- 메모: 민감정보 금지, 운영 메모만 허용
- 마지막 호출 시간

동작:

- 클릭: 현재 선택 환자 지정
- 더블클릭 또는 메뉴: 이름/시간/상태 수정
- 드래그 또는 버튼: 순서 변경
- 상태 버튼: 대기/진료중/완료/보류/노쇼

### 3.3 매크로 패널

매크로는 `{name}` 변수를 지원한다.

예시:

```text
{name}님 들어오세요.
{name}님 잠시만 기다려주세요.
{name}님 검사 먼저 진행해주세요.
{name}님 수납 안내 부탁드립니다.
{name}님 다음 예약 잡아주세요.
```

기능:

- 공통 매크로
- 개인 매크로
- 추가/수정/삭제
- 순서 변경
- 색상 지정
- 미리보기

### 3.4 호출 팝업

원장이 호출 매크로를 전송하면 직원 PC에 팝업이 뜬다.

필수 조건:

- 화면 맨 앞에 표시
- 현재 작업창 포커스를 빼앗지 않음
- 키보드 입력은 기존 작업창에 유지
- 확인/닫기 전까지 자동으로 사라지지 않음
- 소리 기본 OFF
- 직원별로 소리 ON 가능

팝업 내용:

```text
진료실 호출
홍길동님 들어오세요.
보낸 사람: 원장실
시간: 10:32
[확인] [닫기]
```

여러 호출 수신 시:

- 새 팝업을 누적하거나
- 기존 팝업 안에 호출 목록으로 쌓는다.
- 닫지 않은 호출은 사라지면 안 된다.

### 3.5 파일 전송

브라우저 기반 파일 전송을 지원한다.

동작:

1. 파일 첨부 클릭
2. 파일 선택
3. 업로드 진행률 표시
4. 메시지에 파일 카드 표시
5. 다른 사용자는 다운로드
6. 필요 시 삭제

파일 카드:

- 파일명
- 크기
- 업로드자
- 업로드 시간
- 다운로드 버튼
- 삭제 버튼

초기 제한:

- 크기: 20MB 이하
- 허용: PDF, JPG, PNG, DOCX, XLSX, HWP, HWPX
- 차단: EXE, BAT, CMD, MSI, ZIP
- 보관: 기본 7일, 설정 가능
- 외부 공개 링크 금지

## 4. 데이터 모델 초안

### users

- id
- display_name
- role: doctor/staff/admin/waiting_room
- sound_enabled
- popup_position
- created_at

### patients_today

- id
- date
- name
- appointment_time
- status
- sort_order
- operational_note
- created_by
- updated_at

### macros

- id
- owner_user_id: null이면 공통 매크로
- title
- template
- color
- sort_order
- target: staff/waiting_room/all
- created_at
- updated_at

### messages

- id
- sender_id
- patient_id
- patient_name_snapshot
- body
- type: text/call/file
- created_at

### call_alerts

- id
- message_id
- recipient_user_id 또는 recipient_group
- status: unread/read/closed
- created_at
- acknowledged_at

### files

- id
- message_id
- storage_path
- original_filename
- size_bytes
- mime_type
- uploaded_by
- expires_at
- created_at

## 5. 비기능 요구사항

- 병원 PC 여러 대에서 실시간 동기화
- 서버컴 불필요
- 브라우저 접속만으로 기본 기능 사용
- 호출 팝업은 웹앱만으로 제한되면 별도 Windows 알림 도우미 사용
- 개인정보 최소 저장
- 당일 환자 데이터 자동 정리 옵션
- 외부 공개 파일 링크 금지
