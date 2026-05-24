# 부모앱-자녀앱 연동 기술 구조 설계

대상 제품: Family Link Coach / 디지털 가족코치
목적: 부모의 일방적 감시 앱이 아니라, 부모-자녀 계약, 규칙 실행, 추가시간 요청, 주간 리뷰를 동기화하는 양방향 코칭 앱 구조를 정의한다.

---

## 1. 결론 요약

### 1.1 권장 아키텍처

MVP는 Supabase 기반으로 시작한다.

- 클라이언트: React Native 또는 Flutter
- 부모앱: 규칙 생성, 계약서 승인, 추가시간 승인, 주간 리뷰, 교육 콘텐츠
- 자녀앱: 오늘의 약속 확인, 자기체크, 추가시간 요청, 계약서 확인, 주간 리뷰 입력
- 백엔드: Supabase Auth + PostgreSQL + Row Level Security + Edge Functions + Storage
- Push: FCM + APNs, 서버에서는 Expo Push 또는 Firebase Admin SDK 중 하나로 추상화
- Android 확장: UsageStatsManager 기반 사용량 읽기, Notification 기반 전환 알림, DevicePolicyManager는 제한적으로 검토
- iOS 확장: FamilyControls / DeviceActivity / ManagedSettings는 entitlement 필요. v1은 계약·리뷰·알림 중심, 실제 차단은 제한 기능으로 별도 트랙

### 1.2 핵심 제품 원칙

1. 몰래 감시하지 않는다.
2. 메시지 내용, 키 입력, 화면 캡처, 위치 상시 추적은 수집하지 않는다.
3. 자녀에게 어떤 데이터가 부모에게 보이는지 명확히 표시한다.
4. 부모 승인과 자녀 동의 기록을 분리 저장한다.
5. 사용시간 데이터는 가능한 한 집계값만 저장한다.
6. OS-level 차단보다 계약·예고·회복 구조를 우선한다.

---

## 2. 시스템 구성

### 2.1 구성요소

```text
Parent App
  ├─ Auth / 가족 생성
  ├─ 자녀 프로필 관리
  ├─ 규칙/계약서 생성
  ├─ 추가시간 요청 승인
  ├─ 주간 리뷰
  └─ 교육/대화 스크립트

Child App
  ├─ 초대코드 입력
  ├─ 오늘의 규칙 확인
  ├─ 셀프체크
  ├─ 추가시간 요청
  ├─ 계약서 확인/동의
  ├─ 사용 전후 감정/목적 체크
  └─ Android 사용량 집계 수집 선택 기능

Backend
  ├─ Auth
  ├─ 가족/멤버십/자녀 프로필
  ├─ 규칙/계약서/요청/리뷰 데이터
  ├─ RLS 기반 접근제어
  ├─ Push dispatch
  ├─ PDF/계약서 저장
  └─ 감사로그/동의로그

Platform Services
  ├─ FCM
  ├─ APNs
  ├─ Android UsageStatsManager
  ├─ Android Notification / Foreground Service
  ├─ Android DevicePolicyManager 검토
  └─ iOS Screen Time frameworks 검토
```

### 2.2 동기화 방식

- 일반 데이터: DB pull + realtime subscription
- 승인/요청 이벤트: DB insert 후 push 발송
- 오늘의 규칙: 앱 실행 시 active rule snapshot fetch
- 계약서: immutable version으로 저장
- 주간 리뷰: 부모 입력과 자녀 입력을 별도 row로 저장 후 summary 생성
- 사용량 데이터: 원자료가 아니라 일/앱카테고리 단위 집계 저장

---

## 3. 핵심 플로우

### 3.1 가족 생성과 자녀 초대

1. 부모가 가입한다.
2. 부모가 family를 생성한다.
3. 부모가 child_profile을 만든다.
4. 서버가 invite_code를 생성한다.
5. 자녀앱에서 초대코드를 입력한다.
6. 서버가 코드 유효성, 만료, family_id, child_id를 확인한다.
7. 자녀 계정을 child role로 family_members에 연결한다.
8. 부모앱에 “자녀 연결 완료” push를 보낸다.

설계 원칙:

- 초대코드는 6~8자리 표시용 코드와 서버 저장용 해시를 분리한다.
- 초대코드는 15~60분 만료를 기본으로 한다.
- 5회 이상 실패 시 해당 코드 잠금 또는 재발급을 요구한다.
- 초대코드 입력만으로 부모 권한을 얻을 수 없게 role을 엄격히 분리한다.

### 3.2 규칙 생성과 계약서 확정

1. 부모가 설문 기반 추천 규칙을 생성한다.
2. rule_set은 draft 상태로 저장된다.
3. 자녀앱에 “이번 주 약속 확인” 알림을 보낸다.
4. 자녀가 규칙 설명을 읽고 동의 또는 수정요청을 남긴다.
5. 부모가 수정요청을 반영하거나 설명을 남긴다.
6. 양쪽 동의가 기록되면 contract version이 active가 된다.
7. 기존 active rule_set은 archived 또는 superseded 상태가 된다.

중요:

- active 규칙은 항상 하나만 유지한다.
- 계약서는 수정하지 않고 새 version을 만든다.
- 서명은 법적 전자서명보다 “가족 내 약속 확인” 성격으로 표현한다.

### 3.3 추가시간 요청

1. 자녀가 requested_minutes, reason, category를 입력한다.
2. 서버가 time_extension_request를 pending으로 저장한다.
3. 부모앱으로 push 발송한다.
4. 부모는 approve, approve_with_condition, move_to_weekend, deny 중 선택한다.
5. 결정과 이유가 자녀앱에 push로 전달된다.
6. 승인된 추가시간은 rule_override 또는 granted_minutes ledger에 저장된다.

추가시간 결정 옵션:

- approve: 오늘 추가 허용
- approve_with_condition: 숙제/샤워/정리 후 허용
- trade_with_token: 보유 토큰 사용
- move_to_weekend: 주말로 이월
- deny: 사유와 대체활동 제시

### 3.4 주간 리뷰

1. 주간 종료 시 서버가 review_week를 생성한다.
2. 부모와 자녀에게 각각 리뷰 입력 알림을 보낸다.
3. 부모 입력: 지켜진 날, 갈등 상황, 부모 과잉통제 여부, 다음 주 조정
4. 자녀 입력: 어려웠던 규칙, 성공한 점, 바꾸고 싶은 점, 감정
5. 서버가 다음 주 규칙 조정 후보를 만든다.
6. 부모가 최종 승인하면 다음 주 rule_set draft가 만들어진다.

---

## 4. 데이터 모델

아래는 Supabase/PostgreSQL 기준이다. Firebase를 선택할 경우 family/{familyId}/children/{childId}/... 형태의 document 구조로 변환할 수 있으나, 가족-멤버-자녀-규칙-계약서 관계가 복잡하므로 relational schema가 더 적합하다.

### 4.1 auth.users

Supabase Auth 기본 테이블을 사용한다.

추가 프로필은 public.user_profiles에 둔다.

### 4.2 user_profiles

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK, auth.users.id FK | 사용자 ID |
| display_name | text | 표시명 |
| role_default | text | parent, child, clinician, admin 중 기본 역할 |
| birth_year | int nullable | 자녀 직접 계정인 경우 선택 |
| locale | text | ko-KR 기본 |
| timezone | text | Asia/Seoul 기본 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

주의: 한 사용자가 한 가족에서는 parent, 다른 가족에서는 invited_guardian일 수 있으므로 실제 권한은 family_membership에서 판단한다.

### 4.3 families

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 가족 ID |
| name | text | 가족 표시명 |
| owner_user_id | uuid FK | 최초 생성 부모 |
| country | text | KR 기본 |
| default_timezone | text | Asia/Seoul |
| status | text | active, archived |
| created_at | timestamptz | 생성일 |

### 4.4 family_members

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 멤버십 ID |
| family_id | uuid FK | 가족 ID |
| user_id | uuid FK | 사용자 ID |
| role | text | parent, child, guardian, viewer |
| child_profile_id | uuid nullable | 자녀 계정이면 연결 |
| status | text | invited, active, removed |
| joined_at | timestamptz | 가입일 |

권한 원칙:

- parent: 해당 family의 자녀 프로필, 규칙, 요청, 리뷰 조회/관리
- child: 자기 child_profile과 연결된 규칙/계약/요청/리뷰만 조회/작성
- guardian: 부모와 유사하되 owner 권한 없음
- viewer: 교육자료/계약서 보기만 허용

### 4.5 child_profiles

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 자녀 프로필 ID |
| family_id | uuid FK | 가족 ID |
| display_name | text | 별명 가능 |
| birth_year | int | 출생연도 |
| grade | text nullable | 학년 |
| primary_device_os | text | android, ios, mixed, unknown |
| profile_notes | text | 부모 입력 메모 |
| visible_to_child | boolean | 자녀에게 프로필 설명 표시 여부 |
| status | text | active, archived |
| created_at | timestamptz | 생성일 |

민감정보 최소화:

- 진단명 필드는 기본 제공하지 않는다.
- ADHD, 불안, 우울 등은 diagnosis가 아니라 pattern_flags 또는 questionnaire_results로 분리한다.
- 의료정보가 될 수 있는 자유기술은 암호화 또는 저장 최소화를 권장한다.

### 4.6 child_pattern_assessments

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 평가 ID |
| child_profile_id | uuid FK | 자녀 프로필 |
| respondent_user_id | uuid FK | 응답자 |
| sleep_delay_score | int | 수면 지연 |
| transition_difficulty_score | int | 전환 어려움 |
| gaming_immersion_score | int | 게임 몰입 |
| shortform_overuse_score | int | 숏폼 과사용 |
| conflict_score | int | 갈등 |
| hidden_use_score | int | 몰래 사용 |
| anxiety_contact_score | int | 연락 의존/불안 |
| mood_low_energy_score | int | 무기력/우울 위험 패턴 |
| created_at | timestamptz | 생성일 |

표현 원칙:

- “진단”이 아니라 “규칙 설계를 위한 생활패턴 설문”으로 표시한다.
- 자해, 폭력, 심각한 우울 위험 응답이 있으면 앱 내 코칭만으로 다루지 않고 보호자 상담/전문가 평가 안내를 표시한다.

### 4.7 rule_sets

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 규칙 세트 ID |
| child_profile_id | uuid FK | 대상 자녀 |
| version | int | 자녀별 규칙 버전 |
| status | text | draft, active, superseded, archived |
| title | text | 예: 2026년 5월 4주 약속 |
| weekday_total_minutes | int | 평일 총량 |
| weekend_total_minutes | int | 주말 총량 |
| bedtime_start | time | 취침 제한 시작 |
| bedtime_end | time | 제한 종료 |
| transition_warning_minutes | int | 종료 예고 |
| recovery_policy | jsonb | 위반 후 회복 규칙 |
| reward_policy | jsonb | 토큰/보상 규칙 |
| extra_time_policy | jsonb | 추가시간 요청 기준 |
| generated_from_assessment_id | uuid nullable | 근거 설문 |
| created_by | uuid FK | 생성자 |
| active_from | date nullable | 적용 시작 |
| active_until | date nullable | 적용 종료 |
| created_at | timestamptz | 생성일 |

### 4.8 rule_app_categories

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 항목 ID |
| rule_set_id | uuid FK | 규칙 세트 |
| category | text | game, shortform, study, messaging, creative, music, browser 등 |
| limit_minutes_weekday | int nullable | 평일 제한 |
| limit_minutes_weekend | int nullable | 주말 제한 |
| allowed_window | jsonb | 사용 가능 시간대 |
| always_allowed | boolean | 항상 허용 여부 |
| rationale_for_child | text | 자녀에게 보여줄 이유 |

### 4.9 app_catalog_child_overrides

실제 앱 패키지와 제품 내 카테고리 매핑.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 항목 ID |
| child_profile_id | uuid FK | 대상 자녀 |
| platform | text | android, ios |
| app_identifier | text | Android packageName 또는 iOS opaque token/수동 이름 |
| display_name | text | 앱 이름 |
| category | text | 제품 카테고리 |
| is_always_allowed | boolean | 항상 허용 |
| is_user_declared | boolean | 자녀/부모 수동 입력 여부 |

Android에서는 packageName 기반 저장이 가능하나, iOS Screen Time API는 개인정보 보호상 앱 선택이 tokenized/opaque하게 다뤄질 수 있으므로 설계를 분리한다.

### 4.10 contracts

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 계약서 ID |
| child_profile_id | uuid FK | 대상 자녀 |
| rule_set_id | uuid FK | 연결 규칙 |
| version | int | 계약서 버전 |
| status | text | draft, pending_child, pending_parent, active, superseded |
| contract_text | text | 표시 문구 |
| child_visible_summary | text | 자녀용 요약 |
| pdf_storage_path | text nullable | PDF 경로 |
| review_date | date | 다음 리뷰일 |
| created_at | timestamptz | 생성일 |

### 4.11 contract_acceptances

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 동의 ID |
| contract_id | uuid FK | 계약서 |
| user_id | uuid FK | 동의 사용자 |
| role_at_acceptance | text | parent 또는 child |
| accepted_at | timestamptz | 동의 시각 |
| acceptance_method | text | tap, typed_name, pin, guardian_confirmed |
| displayed_text_hash | text | 동의 당시 문구 hash |
| device_id | uuid nullable | 사용 기기 |

계약서 문구가 바뀌면 새 contract를 만들고 동의도 다시 받는다.

### 4.12 time_extension_requests

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 요청 ID |
| child_profile_id | uuid FK | 대상 자녀 |
| requested_by_user_id | uuid FK | 요청자 |
| requested_minutes | int | 요청 시간 |
| category | text | game, messaging, study 등 |
| reason | text | 자녀 입력 사유 |
| status | text | pending, approved, approved_with_condition, moved_to_weekend, denied, expired, cancelled |
| parent_decision_by | uuid nullable | 결정 부모 |
| parent_decision_reason | text nullable | 결정 사유 |
| condition_text | text nullable | 조건부 승인 내용 |
| expires_at | timestamptz | 요청 만료 |
| decided_at | timestamptz nullable | 결정 시각 |
| created_at | timestamptz | 생성일 |

### 4.13 granted_time_ledger

추가시간은 단순 상태 변경이 아니라 ledger로 기록한다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | ledger ID |
| child_profile_id | uuid FK | 대상 자녀 |
| source_type | text | extension_request, reward_token, manual_adjustment |
| source_id | uuid nullable | 원천 ID |
| minutes | int | 추가 또는 차감 시간 |
| category | text nullable | 적용 카테고리 |
| valid_on | date | 적용일 |
| used_minutes | int | 사용 처리된 시간 |
| created_at | timestamptz | 생성일 |

### 4.14 weekly_reviews

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 리뷰 ID |
| child_profile_id | uuid FK | 대상 자녀 |
| week_start | date | 주 시작일 |
| week_end | date | 주 종료일 |
| status | text | open, parent_submitted, child_submitted, completed |
| kept_days | int nullable | 약속 지킨 날 수 |
| conflict_count | int nullable | 갈등 횟수 |
| main_failure_time | text nullable | 주된 실패 시점 |
| next_week_adjustment | jsonb nullable | 다음 주 조정안 |
| created_at | timestamptz | 생성일 |

### 4.15 weekly_review_entries

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 입력 ID |
| weekly_review_id | uuid FK | 리뷰 |
| author_user_id | uuid FK | 작성자 |
| author_role | text | parent, child |
| successes | text | 잘된 점 |
| difficulties | text | 어려웠던 점 |
| requested_changes | text | 바꾸고 싶은 점 |
| parent_overcontrol_note | text nullable | 부모 과잉통제 자각 |
| mood_note | text nullable | 감정 메모 |
| submitted_at | timestamptz | 제출일 |

### 4.16 device_registrations

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 기기 ID |
| user_id | uuid FK | 사용자 |
| child_profile_id | uuid nullable | 자녀 기기 연결 |
| family_id | uuid FK | 가족 |
| platform | text | android, ios, web |
| app_version | text | 앱 버전 |
| push_token | text encrypted | FCM/APNs/Expo token |
| notification_permission_status | text | granted, denied, provisional, unknown |
| last_seen_at | timestamptz | 마지막 접속 |
| revoked_at | timestamptz nullable | 폐기일 |

### 4.17 child_usage_daily_summaries

Android UsageStatsManager 또는 자녀 자기기록을 통해 생성되는 집계 데이터.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 집계 ID |
| child_profile_id | uuid FK | 대상 자녀 |
| date | date | 날짜 |
| source | text | android_usage_stats, child_self_report, manual_parent |
| category | text | game, shortform, study 등 |
| total_minutes | int | 총 사용 분 |
| session_count | int nullable | 세션 수 |
| first_use_at | time nullable | 최초 사용 |
| last_use_at | time nullable | 마지막 사용 |
| created_at | timestamptz | 생성일 |

저장 금지 또는 기본 제외:

- 앱 내부 메시지 내용
- 브라우저 방문 URL 전체 로그
- 알림 내용 원문
- 키 입력
- 화면 녹화/스크린샷
- 정확한 위치 상시 기록

### 4.18 notification_events

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 알림 이벤트 ID |
| family_id | uuid FK | 가족 |
| recipient_user_id | uuid FK | 수신자 |
| child_profile_id | uuid nullable | 관련 자녀 |
| type | text | invite_joined, contract_pending, extra_time_requested, decision_made, weekly_review_due 등 |
| payload | jsonb | 최소 payload |
| status | text | queued, sent, failed, opened |
| sent_at | timestamptz nullable | 발송 시각 |
| created_at | timestamptz | 생성일 |

### 4.19 consent_records

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 동의 기록 ID |
| family_id | uuid FK | 가족 |
| user_id | uuid nullable | 사용자 |
| child_profile_id | uuid nullable | 자녀 |
| consent_type | text | terms, privacy, child_assent, guardian_consent, usage_stats_permission, push_permission |
| version | text | 약관/설명 버전 |
| status | text | granted, revoked |
| granted_at | timestamptz nullable | 동의 시각 |
| revoked_at | timestamptz nullable | 철회 시각 |
| evidence_hash | text | 표시 문구 hash |

### 4.20 audit_logs

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | 로그 ID |
| actor_user_id | uuid nullable | 행위자 |
| family_id | uuid nullable | 가족 |
| child_profile_id | uuid nullable | 자녀 |
| action | text | rule_created, contract_accepted, request_decided 등 |
| target_table | text | 대상 테이블 |
| target_id | uuid | 대상 ID |
| metadata | jsonb | 비민감 메타데이터 |
| created_at | timestamptz | 생성일 |

---

## 5. 접근제어와 RLS 설계

### 5.1 기본 정책

Supabase에서는 모든 핵심 테이블에 RLS를 켠다.

공통 조건:

- 사용자는 자신이 active member인 family 데이터만 읽을 수 있다.
- parent/guardian은 해당 family의 child_profile 데이터를 관리할 수 있다.
- child는 본인 child_profile_id에 연결된 데이터만 읽고 제한적으로 쓸 수 있다.
- 계약서, 동의, audit log는 수정 대신 append-only를 기본으로 한다.

### 5.2 권한 예시

```sql
-- 사용자가 특정 family의 active member인지 확인하는 helper function
create or replace function is_family_member(p_family_id uuid)
returns boolean as $$
  select exists (
    select 1 from family_members
    where family_id = p_family_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$ language sql security definer;

-- 사용자가 특정 family의 parent/guardian인지 확인
create or replace function is_family_guardian(p_family_id uuid)
returns boolean as $$
  select exists (
    select 1 from family_members
    where family_id = p_family_id
      and user_id = auth.uid()
      and role in ('parent', 'guardian')
      and status = 'active'
  );
$$ language sql security definer;
```

정책 방향:

- child_profiles select: family member 가능
- child_profiles insert/update: parent/guardian만 가능
- rule_sets select: 연결 family member 가능
- rule_sets insert/update: parent/guardian만 가능. 단 child는 requested_changes 별도 테이블에 작성
- time_extension_requests insert: 연결 child 가능
- time_extension_requests decision update: parent/guardian만 가능
- weekly_review_entries insert: parent 또는 child 모두 가능하되 author_role 검증
- consent_records insert: 본인 동의 또는 보호자 동의 context만 허용

### 5.3 서버 전용 작업

Edge Function 또는 서버 API로만 처리할 작업:

- 초대코드 생성/검증
- 계약서 PDF 생성
- push 발송
- weekly review 자동 생성
- rule_set active 전환
- usage summary 집계 정규화
- LLM 기반 문구 생성

클라이언트가 직접 해서는 안 되는 작업:

- 다른 사용자의 role 변경
- active contract 강제 변경
- push token 대량 조회
- audit log 수정
- 동의 기록 삭제

---

## 6. Supabase vs Firebase 선택

### 6.1 Supabase 장점

- PostgreSQL 기반이라 가족-멤버-자녀-규칙-계약서-리뷰 관계 모델링이 자연스럽다.
- RLS를 SQL로 정의할 수 있어 가족별 접근제어가 명확하다.
- 계약서, 동의, 감사로그처럼 append-only/transaction이 필요한 데이터에 적합하다.
- 복잡한 쿼리와 리포트, 주간 리뷰 집계, 향후 병원/상담센터 라이선스 관리에 유리하다.
- 오픈소스/자체호스팅 선택지가 있어 장기적으로 데이터 주권 설명이 쉽다.

### 6.2 Supabase 단점

- 모바일 offline-first 경험은 Firebase보다 직접 구현할 부분이 많다.
- 대규모 realtime fan-out은 설계와 비용 관찰이 필요하다.
- RLS 설계를 잘못하면 디버깅이 어렵다.
- push는 Supabase 자체 핵심 기능이 아니므로 FCM/APNs/Expo Push를 별도로 붙여야 한다.

### 6.3 Firebase 장점

- Firebase Auth, Firestore, FCM, Cloud Functions의 모바일 통합 경험이 좋다.
- FCM이 기본 축이므로 push 구현이 자연스럽다.
- 오프라인 캐시, 재연결, 단순 realtime sync가 강하다.
- 초기 모바일 개발자가 빠르게 붙기 쉽다.

### 6.4 Firebase 단점

- Firestore NoSQL 구조에서 가족-자녀-계약서-version-동의-리뷰 관계가 복잡해질 수 있다.
- Security Rules가 서비스별로 분리되어 권한 논리가 흩어질 수 있다.
- 계약서 versioning, 감사로그, 리포트성 쿼리에는 relational DB가 더 단순하다.
- 비용 예측이 읽기/쓰기 패턴에 따라 민감하다.

### 6.5 선택안

권장: Supabase + FCM/APNs

이유:

1. 제품의 핵심 데이터는 채팅형 realtime보다 관계형 계약/규칙/리뷰 데이터다.
2. 부모/자녀/가족/보호자 권한이 복잡해 RLS가 적합하다.
3. 향후 진료실/상담센터용 리포트, 익명 통계, 기관 라이선스 확장이 쉽다.
4. 개인정보/동의/감사로그를 SQL transaction으로 다루는 편이 안전하다.

예외적으로 Firebase가 더 나은 경우:

- 개발팀이 Firebase 중심이고 4주 내 모바일 앱 출시가 절대 우선인 경우
- offline-first 동작이 핵심인 경우
- FCM, Remote Config, Analytics 중심의 모바일 성장 실험을 빠르게 돌릴 경우

현실적 절충:

- DB/Auth는 Supabase
- Push dispatch는 Firebase Admin SDK 또는 Expo Push
- Analytics는 개인정보 최소화 전제로 PostHog/Supabase event table 또는 Firebase Analytics 중 검토

---

## 7. Android 플랫폼 설계

### 7.1 UsageStatsManager

공식 Android API상 UsageStatsManager는 기기 사용 이력과 통계에 접근하는 클래스다. 일/주/월/년 단위 등 시간 구간별 사용 통계 조회에 쓸 수 있다.

사용 가능 기능:

- 앱별 foreground 사용시간 집계
- 일별/주별 사용량 요약
- 특정 시간대 사용 여부 추정
- 앱 카테고리별 총량 계산
- 주간 리뷰의 객관적 보조자료

제약:

- 사용자가 Usage Access 권한을 명시적으로 부여해야 한다.
- 실시간 차단 API가 아니라 조회/집계 API다.
- 제조사/OS 버전에 따라 이벤트 정확도와 배터리 정책 영향이 다를 수 있다.
- 과도하게 세밀한 앱 사용 기록은 사생활 침해로 느껴질 수 있다.

권장 구현:

- v1.5 이후 선택 기능으로 둔다.
- 권한 요청 화면에서 부모와 자녀 모두에게 표시되는 설명을 제공한다.
- 서버에는 앱별 raw event를 올리지 않고 category/date 단위 summary만 저장한다.
- 자녀앱에서 “오늘 게임 42분, 숏폼 18분”처럼 본인에게 먼저 보여주고 부모 공유 범위를 명확히 한다.

### 7.2 DevicePolicyManager

DevicePolicyManager는 Android의 device admin / device owner / profile owner 정책 API다.

가능성:

- 일부 기기 정책 설정
- 잠금/비밀번호/제한 정책
- 관리형 기기 또는 프로필 환경에서 더 강한 제어

제약:

- 일반 소비자용 부모-자녀 앱이 기기 전체의 device owner가 되기는 어렵다.
- 이미 사용 중인 개인 기기에 후설치하여 강력한 정책을 적용하는 흐름은 제한이 크다.
- 과도한 기기관리 권한은 사용자 신뢰와 심사 리스크가 높다.
- Family Link를 대체하는 MDM처럼 보이면 제품 포지션과 맞지 않는다.

권장:

- MVP에서는 DevicePolicyManager 기반 강제 차단을 제외한다.
- B2B/기관 지급기기, 상담센터 대여기기, 특수 관리형 기기 모델에서만 별도 검토한다.
- 일반 B2C는 Family Link 설정 가이드와 계약 기반 실행을 우선한다.

### 7.3 Notification / Foreground Service

Android 알림은 앱이 명시적으로 사용 중이지 않을 때도 사용자에게 시의성 있는 정보와 리마인더를 제공할 수 있다.

사용처:

- 종료 10분 전 전환 알림
- 취침시간 전 거실 충전 알림
- 추가시간 요청 도착
- 부모 결정 도착
- 주간 리뷰 알림
- 계약서 확인 요청

주의:

- Android 13 이상에서는 알림 권한을 사용자에게 요청해야 한다.
- Foreground Service는 실제 지속 작업이 있을 때만 사용하고, 단순 알림 남발에는 쓰지 않는다.
- “감시 중” 느낌을 줄 수 있는 상시 알림은 지양한다.
- 자녀에게도 알림의 목적과 내용을 설명한다.

### 7.4 Android 차단 기능의 현실적 단계

단계 0: 코칭형 MVP
- 사용량 수동 입력
- 규칙/계약/알림/리뷰
- Family Link 설정 가이드

단계 1: 사용량 보조 측정
- UsageStatsManager 권한 선택
- 일별 집계 표시
- 부모 공유 범위 설정

단계 2: 전환 보조
- 종료 예고 알림
- 화면 내 countdown
- 대체활동 제안

단계 3: 제한적 차단 검토
- Accessibility Service 기반 앱 차단은 정책 리스크가 커서 기본 제외
- VPN 기반 웹필터는 개인정보/배터리/정책 리스크가 커서 별도 제품으로 분리 검토
- DevicePolicyManager는 관리형 기기에서만 검토

---

## 8. iOS 플랫폼 제약과 설계

### 8.1 가능한 공식 프레임워크

Apple Screen Time 기술 프레임워크:

- FamilyControls: parental control 기능 권한과 앱/카테고리 선택
- DeviceActivity: 사용 활동 모니터링, schedule/event 기반 extension 실행
- ManagedSettings: 앱/웹/미디어 등의 제한 설정
- ManagedSettingsUI: 제한 화면 UI 구성

Apple 문서상 Family Sharing 기반 guardian approval과 privacy-preserving 구조가 전제다.

### 8.2 핵심 제약

- FamilyControls entitlement가 필요하다.
- Apple 심사와 entitlement 승인 여부가 제품 일정의 리스크다.
- 앱 선택 정보가 개인정보 보호를 위해 opaque token 형태로 다뤄질 수 있다.
- Android처럼 앱 패키지 단위 raw 사용 데이터를 자유롭게 수집하는 모델이 아니다.
- iOS 차단/제한은 Apple이 허용한 Screen Time framework 범위 안에서만 가능하다.
- 부모앱과 자녀앱이 Family Sharing/guardian 관계를 어떻게 구성할지 별도 검증이 필요하다.

### 8.3 권장 iOS 전략

MVP:

- 계약서/규칙/추가시간 요청/주간리뷰/알림 중심
- Apple Screen Time 설정 수동 가이드 제공
- iOS 사용량은 자녀 자기기록 또는 부모 확인 기반으로 시작

v1.5:

- FamilyControls entitlement 신청
- DeviceActivity report 가능 범위 PoC
- ManagedSettings shield UX PoC

v2:

- 승인된 entitlement 범위 내에서 제한 기능 제공
- 기능명은 “강제 감시”가 아니라 “약속 실행 보조”로 유지

### 8.4 iOS에서 피해야 할 표현

- “모든 앱 사용을 감시합니다”
- “자녀가 모르게 확인합니다”
- “Screen Time을 우회합니다”
- “Family Link/Apple 제한을 뚫습니다”
- “메시지/브라우저 내용을 확인합니다”

권장 표현:

- “가족이 합의한 규칙을 확인합니다”
- “자녀에게 보이는 방식으로 사용습관을 기록합니다”
- “Apple이 제공하는 Screen Time 기능 범위 안에서 동작합니다”
- “부모와 자녀가 함께 주간 리뷰를 합니다”

---

## 9. Push 설계

### 9.1 이벤트 종류

| 이벤트 | 수신자 | 내용 |
|---|---|---|
| invite_joined | 부모 | 자녀앱 연결 완료 |
| contract_pending_child | 자녀 | 이번 주 약속 확인 요청 |
| contract_pending_parent | 부모 | 자녀가 수정요청 또는 동의함 |
| extra_time_requested | 부모 | 추가시간 요청 |
| extra_time_decided | 자녀 | 부모 결정 도착 |
| transition_warning | 자녀 | 종료 예고 |
| bedtime_charge_reminder | 자녀/부모 | 취침 전 충전 위치 리마인더 |
| weekly_review_due | 부모/자녀 | 주간 리뷰 입력 |
| rule_changed | 자녀 | 다음 주 규칙 변경 |

### 9.2 Push payload 원칙

- payload에 민감한 자유기술 사유를 넣지 않는다.
- notification body는 짧고 중립적으로 쓴다.
- 상세 내용은 앱을 열어 인증 후 조회한다.

예:

```json
{
  "type": "extra_time_requested",
  "family_id": "...",
  "child_profile_id": "...",
  "request_id": "..."
}
```

알림 문구:

- 부모: “추가시간 요청이 도착했습니다.”
- 자녀: “추가시간 요청에 대한 답변이 도착했습니다.”
- 피할 문구: “아이가 또 게임 시간을 요구했습니다.”

### 9.3 발송 구조

1. DB insert 또는 Edge Function 호출
2. notification_events row 생성
3. push dispatcher function 실행
4. device_registrations에서 유효 token 조회
5. FCM/APNs/Expo로 발송
6. sent/failed 상태 업데이트
7. 실패 token은 invalid 처리

---

## 10. 개인정보·보안·동의 설계

### 10.1 수집 데이터 분류

필수:

- 부모 계정 email 또는 OAuth 식별자
- 가족 ID
- 자녀 표시명 또는 별명
- 자녀 연령대/학년
- 규칙, 계약서, 추가시간 요청, 주간 리뷰

선택:

- Android 사용량 집계
- 앱 카테고리 매핑
- 감정/목적 체크
- 교육 콘텐츠 진행 상태

수집하지 않음:

- 메시지 본문
- 통화 내용
- 키 입력
- 화면 녹화
- 정확한 위치 상시 추적
- 브라우저 URL 전체 목록
- 사진첩/연락처 원문

### 10.2 동의 구조

부모 동의:

- 서비스 이용약관
- 개인정보 처리방침
- 자녀 프로필 생성 및 관리 동의
- push 알림 동의
- Android usage access 안내 확인

자녀 assent:

- 내가 볼 수 있는 규칙
- 부모에게 공유되는 정보
- 추가시간 요청/리뷰 기록 방식
- 사용량 집계 공유 여부
- 동의 철회 또는 부모와 상의 버튼

권장 UX:

- 자녀용 설명은 초등/중등/고등 수준별로 다르게 쓴다.
- “부모님이 몰래 보는 앱”이 아니라 “우리 가족 약속장”으로 설명한다.
- 데이터 공유 범위를 아이 화면에서도 항상 확인할 수 있게 한다.

### 10.3 보안 기본값

- 모든 테이블 RLS 활성화
- service role key는 서버 환경변수에만 저장
- push token 암호화 저장
- invite code는 평문 저장 금지, hash 저장
- 계약서/동의 문구는 hash 기록
- audit log append-only
- 관리자 조회는 최소화하고 관리자 행동도 audit
- 백업/로그에서 민감 자유기술 제외 또는 마스킹

### 10.4 데이터 보존

권장 기본값:

- 계정 삭제 시 family 데이터 export 후 삭제 옵션 제공
- usage daily summaries: 12개월 후 익명 집계 또는 삭제
- push token: 로그아웃/비활성 90일 후 폐기
- invite code: 만료 즉시 사용 불가, 30일 후 삭제
- audit/consent: 법적 필요 기간 검토 후 최소 보존
- 계약서: 가족이 삭제 요청 시 삭제 또는 PDF export 후 폐기

### 10.5 아동 개인정보 리스크

위험:

- 부모 권한을 명분으로 자녀 사생활을 과도하게 수집할 수 있음
- 갈등 가정에서 앱 기록이 처벌 도구가 될 수 있음
- 정신건강 관련 자유기술이 민감정보가 될 수 있음

완화:

- 부모에게 보이는 dashboard를 “위반 적발”이 아니라 “주간 조정” 중심으로 구성
- raw event 대신 집계값 표시
- 위험 문구 감지 시 전문가 상담 안내
- 자녀에게도 데이터 공유 범위와 기록 삭제/숨김 불가 항목을 설명
- “몰래 설치” 방지: 자녀앱 첫 화면에서 목적과 공유 데이터 표시

---

## 11. API/Edge Function 초안

### 11.1 초대

- POST /functions/v1/invites/create
  - parent only
  - input: family_id, child_profile_id
  - output: display_code, expires_at

- POST /functions/v1/invites/redeem
  - authenticated child user
  - input: display_code
  - output: family_id, child_profile_id, membership_id

### 11.2 계약서

- POST /functions/v1/contracts/generate
  - parent only
  - input: child_profile_id, rule_set_id
  - output: contract_id, draft_text

- POST /functions/v1/contracts/accept
  - parent or linked child
  - input: contract_id, acceptance_method
  - output: status

- POST /functions/v1/contracts/render-pdf
  - parent only or completed contract
  - input: contract_id
  - output: storage_path

### 11.3 추가시간

- POST /functions/v1/time-requests/create
  - child only
  - input: child_profile_id, requested_minutes, category, reason
  - output: request_id

- POST /functions/v1/time-requests/decide
  - parent/guardian only
  - input: request_id, decision, reason, condition_text
  - output: decision status, ledger entry if approved

### 11.4 주간 리뷰

- POST /functions/v1/weekly-reviews/open
  - scheduled function
  - input: week_start
  - output: created review count

- POST /functions/v1/weekly-reviews/submit-entry
  - parent or child
  - input: weekly_review_id, role-specific fields
  - output: review status

- POST /functions/v1/weekly-reviews/suggest-next-rule
  - parent only
  - input: weekly_review_id
  - output: draft rule_set

---

## 12. MVP 단계별 구현 계획

### 12.1 0단계: 웹/PWA 검증

목표: 기술 제어 없이도 부모-자녀 계약 구조가 작동하는지 검증

기능:

- 부모 가입
- 가족/자녀 프로필
- 규칙 생성
- 계약서 문구
- 추가시간 요청 web flow
- 주간 리뷰
- 수동 Family Link 설정 가이드

스택:

- Next.js 또는 React Native Web
- Supabase Auth/DB/Storage
- 이메일 magic link 또는 OAuth

### 12.2 1단계: 모바일 앱

기능:

- 부모앱/자녀앱 role 분기
- push token 등록
- 추가시간 요청 push
- 주간 리뷰 push
- 계약서 PDF 저장

스택:

- React Native Expo 권장
- Supabase SDK
- Expo Notifications 또는 FCM/APNs 직접 연동

### 12.3 2단계: Android 사용량 보조 측정

기능:

- Usage Access 권한 안내
- 앱 사용량 집계
- 카테고리 매핑
- 일별 summary 저장
- 주간 리뷰에 사용량 참고 표시

주의:

- 권한 거부 시에도 핵심 기능이 작동해야 한다.
- raw event 업로드 금지.

### 12.4 3단계: iOS Screen Time PoC

기능:

- Apple FamilyControls entitlement 신청
- DeviceActivity report PoC
- ManagedSettings shield PoC
- App Store 심사 리스크 검토

Go/No-Go 기준:

- entitlement 승인 여부
- 가족공유 기반 보호자 승인 UX 가능 여부
- 제품의 계약/코칭 포지션과 충돌하지 않는지

---

## 13. 정책·심사 리스크

### 13.1 Google Play 리스크

- Accessibility Service를 앱 차단 목적으로 쓰는 구현
- VPN 기반 전체 트래픽 필터링
- 메시지/알림 내용 수집
- 백그라운드에서 과도한 데이터 수집
- 자녀 몰래 설치/감시로 보이는 UX
- device admin 권한 남용

완화:

- 공식 API와 사용자 명시 권한 중심
- 앱 설명에 수집 데이터와 목적을 명확히 표시
- 자녀용 투명성 화면 제공
- 차단보다 코칭/계약/알림 중심 포지션 유지

### 13.2 Apple App Store 리스크

- Screen Time entitlement 미승인
- FamilyControls 사용 목적 불명확
- 자녀 개인정보 수집 과다
- 부모가 자녀를 몰래 감시하는 UX
- Apple 기본 Screen Time을 우회하거나 대체한다고 오해되는 표현

완화:

- Apple 제공 framework 범위 안에서만 구현
- iOS MVP는 coaching app으로 제출
- 제한 기능은 entitlement 승인 후 별도 release
- 개인정보 보호 설명과 자녀 표시 UX 강화

---

## 14. 제품 UX 원칙

### 14.1 부모 화면

부모에게 강조할 것:

- 이번 주 규칙이 명확한가
- 아이가 이해했는가
- 종료 전환이 예고되었는가
- 위반 후 회복 루프가 있는가
- 부모가 과잉통제하지 않았는가

부모에게 과도하게 강조하지 말 것:

- 위반 순위
- 앱별 세밀한 감시
- 몰래 사용 적발
- 처벌 추천

### 14.2 자녀 화면

자녀에게 보여줄 것:

- 오늘의 약속
- 왜 이 규칙이 있는지
- 남은 시간 또는 오늘의 목표
- 추가시간 요청 버튼
- 회복 방법
- 내가 잘한 점

자녀에게 숨기지 말 것:

- 부모에게 공유되는 정보
- 계약서 버전
- 리뷰 입력 내용 중 부모가 볼 항목
- 사용량 집계 공유 여부

---

## 15. 위험 상황 처리

앱이 임상·상담 도구로 오해되지 않도록 하되, 위험 신호에는 안전 안내가 필요하다.

트리거 예:

- 자해/자살 언급
- 폭력 위협
- 심각한 우울/무기력
- 수면 박탈이 심한 상태
- 가족 내 폭력/학대 암시
- 게임/인터넷 사용 중단 시 심한 공격성

처리:

- 앱 내 자동 규칙 조정만으로 해결하려 하지 않는다.
- 보호자에게 전문가 상담 또는 지역 응급/상담 자원 안내를 표시한다.
- 즉각 위험 표현은 “지금 안전 확보와 긴급 도움” 안내를 우선한다.
- 해당 문구는 push payload에 넣지 않고 앱 내 인증 후 표시한다.

---

## 16. 개발 우선순위

### Must

1. Supabase schema + RLS
2. 부모/자녀 role 분기
3. 초대코드 연결
4. 자녀 프로필
5. 규칙 세트 versioning
6. 계약서 동의 기록
7. 추가시간 요청/승인
8. push token 등록과 event dispatch
9. 주간 리뷰
10. 개인정보/동의 기록

### Should

1. 계약서 PDF 생성
2. Family Link/Screen Time 수동 설정 가이드
3. Android UsageStatsManager 집계
4. 자녀용 데이터 공유 범위 화면
5. audit log dashboard

### Later

1. iOS FamilyControls entitlement 기반 제한
2. Android 관리형 기기 DevicePolicyManager
3. 기관/상담센터 계정
4. 익명 통계 리포트
5. LLM 기반 주간 리뷰 요약

---

## 17. 구현상 결정사항

1. Supabase를 기본 백엔드로 채택한다.
2. Firebase는 push 발송 인프라로만 부분 사용 가능하다.
3. 부모-자녀 연결은 초대코드 기반으로 한다.
4. 계약서는 immutable version으로 관리한다.
5. 추가시간은 request status와 granted_time_ledger를 분리한다.
6. Android 사용량은 선택 권한 기반 집계만 저장한다.
7. iOS 차단 기능은 entitlement 승인 전에는 핵심 일정에 넣지 않는다.
8. DevicePolicyManager는 일반 소비자 MVP에서 제외한다.
9. Accessibility Service 기반 앱 차단은 기본 제외한다.
10. 개인정보 설계는 자녀 투명성과 부모 동의 모두를 필요조건으로 둔다.

---

## 18. 다음 작업 입력값

후속 구현자가 바로 시작하려면 다음 산출물이 필요하다.

1. Supabase SQL migration
2. RLS policy test cases
3. React Native navigation map
4. 부모/자녀 온보딩 wireframe
5. push event enum 정의
6. 계약서 문구 template
7. 자녀용 동의/설명 문구
8. Android UsageStatsManager PoC
9. iOS entitlement 신청용 기능 설명서
10. 개인정보 처리방침 초안

---

## 참고한 공식/공개 자료

- Android Developers: UsageStatsManager는 device usage history and statistics 접근 API로 설명됨.
- Android Developers: Notifications는 앱이 명시적으로 사용 중이지 않을 때도 시의성 있는 정보와 reminder를 제공하는 시스템 API로 설명됨.
- Apple Developer: Screen Time Technology Frameworks는 FamilyControls, DeviceActivity, ManagedSettings, ManagedSettingsUI를 포함하며 Family Sharing 기반 guardian approval과 privacy-preserving 구조를 전제함.
- Supabase: Postgres, REST/GraphQL API, Realtime, Storage, Row Level Security 기반 오픈소스 백엔드.
- Firebase 비교 공개자료: Firebase는 모바일 realtime/offline/push 통합이 강하고, Supabase는 relational schema, SQL/RLS, 복잡한 권한 모델에 강점이 있음.
