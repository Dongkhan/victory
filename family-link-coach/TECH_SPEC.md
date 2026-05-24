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
- token_daily_cap
- token_weekly_carryover_rate
- digital_reward_daily_limit_minutes
- shortform_reward_enabled
- status: draft | active | archived
- created_at

### token_wallets

- id
- child_id
- balance
- weekly_earned
- weekly_spent
- carryover_balance
- max_balance
- created_at
- updated_at

### token_events

- id
- child_id
- rule_set_id
- event_type: earn | spend | hold | release | expire | adjust
- amount
- reason_code
- reason_text
- source: child_self_check | parent_confirm | weekly_review | system
- related_checkin_id
- related_reward_id
- created_by_user_id
- created_at

### self_checkins

- id
- child_id
- checkin_type: before_use | stop | bedtime | weekly
- intended_use: study | contact | creation | game | shortform | video | idle | other
- start_condition_met
- planned_end_at
- actual_stop_quality: immediate | within_10m | late | not_recorded
- mood_before
- mood_after
- difficulty_tag
- created_at

### rewards

- id
- family_id
- child_id nullable
- title
- category: digital_time | family_activity | hobby | rule_proposal | material_limited
- cost
- frequency_limit
- requires_parent_approval
- sleep_guardrail
- food_guardrail
- affection_guardrail
- active
- created_at

### reward_redemptions

- id
- child_id
- reward_id
- cost
- status: requested | approved | used | denied | expired
- requested_at
- decided_at
- used_at
- parent_note

### recovery_missions

- id
- child_id
- trigger_event_id
- mission_type
- title
- status: suggested | accepted | completed | skipped
- token_on_completion
- created_at
- completed_at

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

### activity_templates

- id
- age_group: child | teen | both
- category
- title
- description
- default_duration_minutes
- required_partner: none | parent | friend
- location: indoor | outdoor | either
- energy_level: low | medium | high
- bedtime_safe
- digital_allowed: none | learning | creative
- token_reward_base
- contraindications
- created_at

### child_activity_preferences

- id
- child_id
- preferred_categories
- disliked_categories
- parent_available_windows
- outdoor_allowed
- notes
- updated_at

### activity_recommendations

- id
- child_id
- template_id
- reason_code
- context
- recommended_at
- accepted_at
- skipped_at

### activity_logs

- id
- child_id
- template_id
- status: completed | partial | skipped | refused | rescheduled
- duration_minutes
- parent_verified
- token_awarded
- started_at
- completed_at

### mood_logs

- id
- child_id
- activity_log_id
- before_mood
- before_intensity
- after_mood
- after_intensity
- craving_before
- craving_after
- agency_after
- sleep_readiness_after
- created_at

### token_transactions

- id
- child_id
- source_type: activity | transition | bedtime | review | adjustment
- source_id
- amount
- reason
- created_at

## 3. 주요 화면

1. 부모 온보딩
2. 아이 프로필
3. 유형 분석 결과
4. 추천 규칙
5. 가족 계약서
6. 대체활동 추천 홈
7. 활동 완료/기분 변화 체크
8. 오늘의 약속 홈
9. 추가시간 요청 처리
10. 갈등 상황 스크립트
11. Family Link 설정 가이드
12. 주간 리뷰

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
5. 대체활동 템플릿/추천 함수/완료 체크/기분 기록 구현
6. 토큰 지급 연동
7. 갈등 스크립트 화면
8. Family Link 설정 가이드 화면
9. Supabase 연동
10. 주간 리뷰 저장
11. 모바일 PWA 배포
12. 진료실 테스트용 QR 생성

## 8. 관련 설계 문서

- `CHILD_AGENCY_CONTRACT_MODEL.md`: 자녀 목표 선택, 상호 계약서, 추가시간 요청, 규칙 수정 제안, 주간 리뷰, 자율권 회복 단계, 부모-아이 서명 플로우의 화면/데이터/문구 상세 설계
- `ALTERNATIVE_ACTIVITY_SYSTEM.md`: 연령별 대체활동 추천 로직, 활동 완료 체크, 토큰 연동, 기분 변화 기록, 데이터 모델, MVP 개발 티켓 상세 설계
- `PARENT_CHILD_APP_ARCHITECTURE_KO.md`: 계정, 초대코드, 가족, 자녀 프로필, 규칙, 계약서, 추가시간 요청, push, 주간리뷰, 플랫폼 제약, 개인정보·보안·동의 상세 설계

## 9. 검증 기준

- 부모가 5분 내 첫 계약서를 만들 수 있어야 한다.
- Family Link 설정값이 구체적으로 출력되어야 한다.
- 아이에게 보여줄 수 있는 문장이 포함되어야 한다.
- 아이가 목표 선택, 추가시간 요청, 규칙 수정 제안, 주간 리뷰 중 최소 2개 이상에 직접 참여할 수 있어야 한다.
- 부모-아이 양쪽의 이해 확인과 서명 상태가 기록되어야 한다.
- 부모가 말싸움 상황에서 바로 읽을 문장이 있어야 한다.
- 진단, 치료, 감시 앱으로 오해되지 않아야 한다.
- 메시지 내용 수집, 몰래 위치추적, 우회 기능으로 오해되지 않아야 한다.
