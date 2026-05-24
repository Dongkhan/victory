# Family Link Coach 계획안 및 Kanban 분해안

## 제품 방향

Family Link를 우회하거나 대체하는 해킹 앱이 아니라, Family Link와 병행해 부모-자녀가 디지털 사용 규칙을 능동적으로 계약하고, 셀프 모니터링과 보상, 대체활동, 교육 콘텐츠를 통해 자기조절을 훈련하는 앱.

## 1. 기존 시장 분석

### 대표 앱

- Google Family Link: 무료, Android/Google 생태계 기본 통제, 앱 승인, 사용시간, 취침시간, 위치 확인.
- Apple Screen Time: iOS 기본 사용시간/앱 제한/콘텐츠 제한.
- Microsoft Family Safety: Windows/Xbox/Android 중심 가족 안전.
- Qustodio: 유료 parental control, 웹 필터, 앱 제한, 활동 리포트.
- Bark: 위험 콘텐츠·소셜 모니터링 강조.
- Norton Family, Aura, FamilyTime, MMGuardian, Canopy 등: 위치, 웹필터, 사용시간, 알림, 메시지/콘텐츠 모니터링 일부 제공.

### 공통 문제점

1. 통제 중심이고 자녀의 자율성·능동성이 약하다.
2. 부모-자녀 갈등을 줄이는 대화 구조가 부족하다.
3. ADHD, 수면 지연, 불안, 우울, 게임 몰입 등 아이 특성별 규칙 추천이 약하다.
4. 학습/연락/창작/놀이/숏폼/게임을 구분하지 못하고 총량 통제로 흐르기 쉽다.
5. 부모 교육 수준 차이를 보정하지 못한다.
6. 위반 후 대응이 처벌/압수 중심으로 흐르기 쉽다.
7. 청소년에게는 감시로 느껴져 우회 동기가 커진다.
8. OS, 제조사, 연령, 계정, 앱 권한에 따라 실제 제어력이 달라진다.

### 우회·해킹 가능성 분석 범위

방어적 제품 설계를 위한 취약성 분류만 다룬다. 구체적 우회 절차, exploit, bypass step은 문서화하지 않는다.

우회 위험 범주:

- 설정 우회: 계정 전환, 감독 해제 시도, 새 계정/게스트/보안폴더/앱 복제 등.
- OS 기능 우회: 개발자 옵션, ADB, 제조사별 보안폴더, 접근성/알림 설정 변경.
- 네트워크 우회: VPN, 프록시, 브라우저 내장 우회, DNS 변경.
- 앱 생태계 우회: 웹앱, 인앱 브라우저, 게임 내 채팅, 앱 클론.
- 물리적 우회: 다른 기기 사용, 부모 기기 접근, 비밀번호 유출.
- 심리적 우회: 과잉통제로 인한 숨김·거짓말·갈등 증가.

제품 대응 방향:

- 앱 자체는 우회법을 가르치지 않는다.
- 부모에게는 위험 범주와 예방 체크리스트만 제공한다.
- 아이에게는 통제보다 계약·설명·선택권·회복 구조를 제공해 우회 동기를 낮춘다.

## 2. 이름 후보

### 한국어 중심

- 폰약속
- 디지털 약속
- 우리집 폰계약
- 폰루틴
- 마음폰
- 스크린약속
- 디지털 가족코치
- 폰밸런스
- 자람폰
- 스마트폰 약속장

### 영어/글로벌

- ScreenPeace
- Family Digital Coach
- LinkWise
- ScreenPact
- KidPact
- GrowLink
- ScreenBridge
- HabitLink
- PhonePact
- Digital Compass

### 추천 shortlist

1. ScreenPact
2. 폰약속
3. 디지털 가족코치
4. HabitLink
5. ScreenBridge

## 3. 자녀 능동성 차별화

핵심은 부모가 일방적으로 잠그는 앱이 아니라, 자녀가 규칙을 이해하고 참여하는 구조.

기능:

- 부모-자녀 상호 계약서 작성
- 아이가 직접 목표 선택
- 추가시간 요청 사유 입력
- 규칙 수정 제안
- 주간 리뷰에서 아이 의견 반영
- 자율권 회복 단계
- 아이용 설명: 왜 이 규칙이 필요한지 짧게 제시

계약서 구성:

1. 이번 주 핵심 목표
2. 평일/주말 사용 규칙
3. 항상 허용 앱
4. 사용 전 해야 할 일
5. 추가시간 요청 규칙
6. 위반 후 회복 규칙
7. 보상 규칙
8. 다음 리뷰 날짜
9. 부모/아이 서명

## 4. 보상 시스템

### 셀프 모니터링

- 오늘 내가 지킨 약속 체크
- 사용 전 감정/목적 체크
- 사용 후 기분/후회/만족 체크
- 종료 성공 여부 체크
- 주간 자기평가

### 토큰 이코노미

토큰 획득:

- 종료 알림 후 10분 내 마무리
- 취침시간 전 거실 충전
- 숙제/준비물 완료 후 사용
- 대체활동 완료
- 스스로 추가시간 요청을 포기함

토큰 사용:

- 주말 추가 게임 20~30분
- 가족 놀이 선택권
- 원하는 활동 선택권
- 부모와 특별 시간
- 소액 물질보상은 제한적으로 사용

주의:

- 수면, 식사, 기본 애정, 안전을 보상으로 거래하지 않는다.
- 장기 압수보다 짧은 회복 루프를 우선한다.
- 보상은 연령별로 다르게 설계한다.

## 5. 부모 교육

부모의 정보 수준이 다르므로 3단계 교육 레벨을 둔다.

### 초급

- 스마트폰 사용시간이 수면, 집중, 감정조절에 미치는 영향
- Family Link 기본 설정법
- 갑자기 끊으면 왜 갈등이 커지는지
- 취침 전 사용을 줄여야 하는 이유

### 중급

- ADHD/전환 어려움과 디지털 사용
- 게임 몰입과 보상회로
- 숏폼과 주의 전환
- 부모의 일관성과 예측 가능성
- 처벌보다 회복 구조

### 고급

- 자율성 지지 양육
- 청소년 가치기반 목표 설정
- 문제행동의 기능 분석
- 가족 계약과 주간 리뷰
- 우회 시도에 대한 비처벌적 대응

교육 형식:

- 1분 카드
- 5분 가이드
- 상황별 스크립트
- 진료실/상담실 출력용 PDF
- 부모 유형별 추천 콘텐츠

## 6. 대체활동 기반

디지털 사용을 줄이는 것만으로는 실패한다. 대체활동을 설계해야 한다.

### 소아

- 신체놀이
- 보드게임
- 역할놀이
- 만들기/그림
- 부모와 10분 놀이
- 야외 짧은 미션
- 감각활동

### 청소년

- 가치기반 활동
- 친구관계의 오프라인 대안
- 운동/몸 만들기
- 진로 탐색
- 직업적 포부 기반 프로젝트
- 창작, 코딩, 음악, 영상제작
- 자기계발형 디지털 사용과 소비형 디지털 사용 구분

### 앱 기능

- 연령별 대체활동 추천
- 날씨/시간/에너지 수준별 활동 추천
- 가족이 가능한 활동만 저장
- 활동 완료 시 토큰 지급
- 활동 후 기분 변화 기록

## 7. 부모-자녀 앱 연동 기술

### 기본 구조

- Parent App: 규칙 설정, 승인, 리뷰, 교육 콘텐츠.
- Child App: 오늘 규칙 확인, 셀프체크, 추가시간 요청, 보상 확인.
- Backend: 가족 계정, 자녀 프로필, 규칙, 계약서, 요청/승인, 주간 리뷰 저장.

### MVP 기술 스택

- Frontend: Next.js 또는 React Native
- Backend: Supabase 또는 Firebase
- Auth: 부모 계정 + 자녀 초대코드
- Push: FCM/APNs
- PDF: 계약서 생성
- Storage: 계약서/교육자료

### 연동 플로우

1. 부모가 가족 계정 생성
2. 자녀 프로필 생성
3. 자녀 앱에서 초대코드 입력
4. 부모가 규칙 생성
5. 자녀가 계약서 확인/동의
6. 자녀가 추가시간 요청
7. 부모 앱에 push 알림
8. 부모 결정이 자녀 앱에 반영
9. 주간 리뷰 양쪽에 표시

### Android 제어 확장

- UsageStatsManager: 앱 사용시간 조회
- DevicePolicyManager: 관리형 기기 정책 일부
- Notification/Foreground Service: 전환 알림
- Accessibility Service: Google Play 정책 리스크 크므로 v1 제외 또는 매우 신중 검토

### iOS 제약

- Screen Time API/Family Controls는 Apple 생태계 제약이 크다.
- v1은 코칭, 계약서, 알림, 리뷰 중심.
- 실제 앱 차단은 iOS에서 제한적일 수 있다.

## Kanban 작업 그래프

T1 market-research: 기존 시장과 대표 앱 비교
T2 risk-research: Family Link 및 parental control 우회/취약성 방어적 분석
T3 naming: 이름 후보와 브랜드 포지셔닝
T4 clinical-child-agency: 자녀 능동성/계약서/자율성 구조 설계
T5 reward-system: 셀프 모니터링과 토큰 이코노미 설계
T6 parent-education: 부모 교육 커리큘럼 설계
T7 alternative-activities: 연령별 대체활동 체계 설계
T8 technical-architecture: 부모앱-자녀앱 연동 기술 설계
T9 product-synthesis: 전체 계획안 통합
T10 reviewer: 안전성/정책/임상 표현 리뷰
T11 writer: 최종 문서 작성

## Kanban CLI 명령어 초안

```bash
# 0. 보드/프로젝트 이름은 Family Link Coach로 통일

T1=$(hermes kanban create "research: parental control market and representative apps" \
  --assignee researcher \
  --workspace scratch \
  --body "Family Link, Apple Screen Time, Microsoft Family Safety, Qustodio, Bark, Norton Family, Aura, FamilyTime, MMGuardian, Canopy 등 대표 parental control 앱을 비교하라. 기능, 가격/포지션, 강점, 약점, Family Link 대비 차별점, 부모-자녀 갈등 처리 부재를 표로 정리. 2025-2026 최신 자료 우선. 한국어 최종 산출물. 구체 우회법은 쓰지 말 것." \
  --json | jq -r .task_id)

T2=$(hermes kanban create "research: defensive bypass and tamper-risk analysis" \
  --assignee researcher \
  --workspace scratch \
  --body "Family Link 및 parental control 앱의 우회/해킹 가능성을 방어적 제품 설계 관점에서 분류하라. 범주는 계정/OS/제조사 기능/네트워크/앱 생태계/물리적 접근/심리적 우회로 나눈다. exploit 단계, 우회 절차, bypass how-to는 금지. 각 위험에 대해 부모 교육, 기술적 완화, 계약 기반 완화를 제안. 한국어." \
  --json | jq -r .task_id)

T3=$(hermes kanban create "brand: naming candidates and positioning" \
  --assignee writer \
  --workspace scratch \
  --body "Family Link Coach 앱의 이름 후보를 한국어/영어/혼합형으로 50개 제안하고, 상위 10개를 포지셔닝·장단점·상표 리스크 관점에서 평가하라. 톤은 통제/감시가 아니라 계약/성장/자율성/디지털 습관. 한국어." \
  --json | jq -r .task_id)

T4=$(hermes kanban create "design: child agency and mutual contract model" \
  --assignee pm \
  --workspace scratch \
  --body "자녀의 능동성을 핵심 차별화로 하는 기능 설계. 상호 계약서, 아이의 목표 선택, 추가시간 요청, 규칙 수정 제안, 주간 리뷰, 자율권 회복 단계, 부모-아이 서명 플로우를 화면/데이터/문구 수준으로 설계. 연령대별 차이 포함. 한국어." \
  --json | jq -r .task_id)

T5=$(hermes kanban create "design: self-monitoring and token economy reward system" \
  --assignee analyst \
  --workspace scratch \
  --body "셀프 모니터링과 토큰 이코노미 기반 보상 시스템을 설계하라. 토큰 획득/사용/소멸/회복 규칙, 과잉보상 방지, 수면·식사·애정 등 거래 금지 원칙, ADHD/불안/우울/게임몰입 패턴별 조정안을 포함. 한국어." \
  --json | jq -r .task_id)

T6=$(hermes kanban create "curriculum: parent education levels and content map" \
  --assignee writer \
  --workspace scratch \
  --body "부모 정보 수준 차이를 고려한 교육 커리큘럼을 설계하라. 초급/중급/고급으로 나누고, 디지털 습관이 수면·주의·감정조절·가족갈등·학습에 주는 영향, Family Link 설정법, 대화 스크립트, 1분 카드/5분 가이드/PDF 형식까지 포함. 한국어." \
  --json | jq -r .task_id)

T7=$(hermes kanban create "design: age-based alternative activity system" \
  --assignee pm \
  --workspace scratch \
  --body "대체활동 기반 개입을 설계하라. 소아는 놀이·신체활동·부모와 10분 놀이 중심, 청소년은 가치기반 활동·직업적 포부·창작·운동·진로 프로젝트 중심. 앱 내 추천 로직, 활동 완료 체크, 토큰 연동, 기분 변화 기록 포함. 한국어." \
  --json | jq -r .task_id)

T8=$(hermes kanban create "architecture: parent-child app sync and platform constraints" \
  --assignee backend-eng \
  --workspace scratch \
  --body "부모앱과 자녀앱 연동 기술 구조를 설계하라. 계정/초대코드/가족/자녀 프로필/규칙/계약서/추가시간 요청/push/주간리뷰 데이터 모델, Supabase/Firebase 선택지, Android UsageStatsManager/DevicePolicyManager/Notification, iOS 제약, 개인정보·보안·동의 설계를 포함. 한국어." \
  --json | jq -r .task_id)

T9=$(hermes kanban create "synthesis: integrated Family Link Coach product plan" \
  --assignee analyst \
  --workspace scratch \
  --parent "$T1" --parent "$T2" --parent "$T3" --parent "$T4" --parent "$T5" --parent "$T6" --parent "$T7" --parent "$T8" \
  --body "부모 task 결과 T1-T8을 통합해 Family Link Coach 제품 계획안 1차본을 작성하라. 시장분석, 문제점, 방어적 우회위험, 이름 후보, 자녀 능동성, 보상, 부모교육, 대체활동, 기술구조, MVP 범위, 리스크, 다음 실행계획 포함. 한국어." \
  --json | jq -r .task_id)

T10=$(hermes kanban create "review: safety policy clinical and product risk review" \
  --assignee reviewer \
  --workspace scratch \
  --parent "$T9" \
  --body "T9 계획안을 리뷰하라. 우회/해킹 정보가 공격적으로 쓰였는지, 아동 개인정보/감시 위험, 임상적 과잉표현, 앱스토어 정책 리스크, 부모 과잉통제 유발 가능성을 점검하고 수정 권고를 작성. 한국어." \
  --json | jq -r .task_id)

T11=$(hermes kanban create "write: final Family Link Coach planning document" \
  --assignee writer \
  --workspace scratch \
  --parent "$T9" --parent "$T10" \
  --body "T9와 T10을 반영해 최종 문서를 작성하라. 의사결정자/개발자/임상가가 바로 읽을 수 있게 목차형 Markdown으로 구성. 톤은 직접적이고 실무적. 한국어. 마지막에 MVP 4주 로드맵과 우선순위 백로그 포함." \
  --json | jq -r .task_id)

printf "Created tasks:\nT1=%s\nT2=%s\nT3=%s\nT4=%s\nT5=%s\nT6=%s\nT7=%s\nT8=%s\nT9=%s\nT10=%s\nT11=%s\n" "$T1" "$T2" "$T3" "$T4" "$T5" "$T6" "$T7" "$T8" "$T9" "$T10" "$T11"
```
