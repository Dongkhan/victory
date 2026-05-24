# 디지털 패밀리 코치 v1 개발 명세서

## 1. 권장 기술 스택

### 프로토타입/초기 서비스

- Frontend: React 또는 Next.js
- Styling: Tailwind CSS
- Backend: Supabase
- Auth: Supabase Auth
- DB: PostgreSQL
- PDF: react-pdf 또는 서버사이드 PDF 생성
- 배포: Vercel

### 앱 확장

- 모바일 앱: React Native 또는 Flutter
- Android 자체 제어: 별도 네이티브 모듈
- iOS: OS 제약상 코칭/계약/리뷰 중심으로 시작

## 2. 데이터 모델 초안

### users

- id
- email
- role: parent | child | clinician
- created_at

### families

- id
- name
- owner_user_id
- created_at

### children

- id
- family_id
- name
- birth_year
- grade
- profile_notes
- created_at

### assessments

- id
- child_id
- sleep_delay_score
- transition_difficulty_score
- gaming_immersion_score
- shortform_overuse_score
- conflict_score
- hidden_use_score
- anxiety_contact_score
- created_at

### rule_sets

- id
- child_id
- title
- weekday_total_minutes
- weekend_total_minutes
- bedtime_start
- bedtime_end
- always_allowed_apps
- limited_apps
- reward_rule
- recovery_rule
- status: draft | active | archived
- created_at

### contracts

- id
- child_id
- rule_set_id
- contract_text
- parent_signed_at
- child_signed_at
- review_date
- pdf_url
- created_at

### time_requests

- id
- child_id
- requested_minutes
- reason
- parent_decision: pending | approved | approved_with_deduction | moved_to_weekend | denied
- created_at
- decided_at

### weekly_reviews

- id
- child_id
- week_start
- kept_days
- main_failure_time
- parent_overcontrol_note
- child_success_note
- next_week_adjustment
- created_at

## 3. 주요 화면

1. 부모 온보딩
2. 아이 프로필
3. 유형 분석 결과
4. 추천 규칙
5. 가족 계약서
6. 오늘의 약속 홈
7. 추가시간 요청 처리
8. 갈등 상황 스크립트
9. Family Link 설정 가이드
10. 주간 리뷰

## 4. 규칙 생성 로직 v1

초기에는 LLM 없이 규칙 기반으로 시작 가능.

### 예시 규칙

- sleep_delay_score >= 3이면 취침시간 22:00 고정, 침실 내 충전 금지 권고
- transition_difficulty_score >= 3이면 10분 전환 알림, 즉시 종료 금지
- gaming_immersion_score >= 3이면 게임은 숙제 후 사용, 평일 40분 기본
- shortform_overuse_score >= 3이면 숏폼 평일 20분 이하
- hidden_use_score >= 3이면 거실 충전 + 다음 날 기본시간 회복 구조
- conflict_score >= 3이면 규칙 변경은 주간 리뷰에서만 허용
- anxiety_contact_score >= 3이면 연락앱 완전 차단 금지

## 5. AI 기능 후보

- 부모 설문 기반 규칙 문장 생성
- 계약서 문장 생성
- 갈등 상황 대화문 생성
- 주간 리뷰 요약
- 다음 주 규칙 조정안 생성

안전장치:

- 진단명 단정 금지
- 의학적 치료 대체 표현 금지
- 자해/자살/폭력 위험 입력 시 보호자와 전문가 상담 안내
- 과잉감시나 몰래추적 기능 제안 금지

## 6. Android 자체 제어 검토

### 가능 기능

- 앱 사용시간 조회: UsageStatsManager
- 앱 실행 감지: Usage Events
- 알림: Notification/Foreground Service
- 기기 정책 일부: DevicePolicyManager

### 주의 기능

- 앱 차단을 Accessibility Service로 구현하면 심사 리스크가 큼
- VPN 기반 웹필터는 별도 개인정보·배터리·정책 검토 필요
- 메시지 내용 수집은 제품 원칙상 제외

## 7. v1 개발 순서

1. Next.js 프로젝트 생성
2. 온보딩 설문 화면
3. 규칙 생성 함수 작성
4. 계약서 화면/PDF 출력
5. 갈등 스크립트 화면
6. Family Link 설정 가이드 화면
7. Supabase 연동
8. 주간 리뷰 저장
9. 모바일 PWA 배포
10. 진료실 테스트용 QR 생성

## 8. 검증 기준

- 부모가 5분 내 첫 계약서를 만들 수 있어야 한다.
- Family Link 설정값이 구체적으로 출력되어야 한다.
- 아이에게 보여줄 수 있는 문장이 포함되어야 한다.
- 부모가 말싸움 상황에서 바로 읽을 문장이 있어야 한다.
- 진단, 치료, 감시 앱으로 오해되지 않아야 한다.
