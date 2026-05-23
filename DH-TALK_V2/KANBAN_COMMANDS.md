# DH-TALK V2 Kanban Commands

이 문서는 DH-TALK V2를 병렬 개발 프로젝트로 시작하기 위한 명령어/프롬프트 모음이다.

현재 Hermes 세션에서 실제 Kanban MCP 도구가 노출되지 않은 경우에는 `delegate_task` 병렬 실행 또는 별도 Hermes 프로필 실행 프롬프트로 대체한다.

## 1. 전체 오케스트레이션 목표

```text
DH-TALK V2를 서버컴 기반 프로그램에서 클라우드 실시간 웹앱으로 전환한다.
핵심은 환자 보드, 환자 선택, {name} 매크로 치환, 닫기 전까지 유지되는 비활성 호출 팝업, 브라우저 파일 전송이다.
```

## 2. 병렬 작업 그래프

```text
T1 pm-spec
  제품 요구사항, 수용 기준, MVP 범위 정리

T2 frontend-ux
  환자 보드/매크로/파일카드/웹팝업 UI 설계

T3 backend-realtime
  Supabase schema, RLS, realtime channel, storage 정책 설계

T4 desktop-popup
  Windows 비활성 always-on-top 팝업 구현 가능성 검증

T5 security-review
  개인정보 최소저장, 파일전송, 접근권한, 로그 정책 검토

T6 implementation-plan
  T1-T5 결과를 통합해 실제 코딩 순서와 PR 단위 작성
  parents: T1, T2, T3, T4, T5
```

## 3. 바로 사용할 병렬 delegate_task 프롬프트

Hermes에서 병렬 작업을 바로 시작할 때 사용한다.

```text
DH-TALK V2 코딩 프로젝트 준비를 병렬로 진행한다.
Repo: /opt/data/victory-cbti-work
Project folder: DH-TALK_V2
문서: README.md, PRODUCT_SPEC.md, ARCHITECTURE.md, TASK_BACKLOG.md, SECURITY_PRIVACY.md, ACCEPTANCE_CRITERIA.md

공통 요구사항:
- 서버컴 기반 구조를 버리고 클라우드 실시간 웹앱으로 전환
- 환자 보드, 환자 클릭 선택, {name} 매크로 치환, 직원별 매크로 수정
- 원장 호출 시 직원 PC에 팝업 표시
- 팝업은 닫기/확인 전까지 유지
- 팝업은 포커스를 빼앗지 않음
- 소리 기본 OFF, 설정에서 ON 가능
- 브라우저 파일 전송 지원
- 파일은 임시 전달 용도, 로그인 사용자만 접근, 실행파일 차단
- EMR/진단/처방/상담내용 저장 금지

병렬 작업:
1. PM/spec worker: 현재 문서를 읽고 MVP scope와 누락 요구사항을 점검하라.
2. Frontend worker: React/Vite 기준 화면 구조, 컴포넌트 트리, 상태관리 설계를 작성하라.
3. Backend worker: Supabase schema, RLS, realtime, storage 설계를 SQL 초안 포함해 작성하라.
4. Desktop worker: Electron/Tauri 중 Windows non-focusable always-on-top popup 구현안을 비교하고 권장안을 작성하라.
5. Security worker: 개인정보/파일전송/권한 리스크를 검토하고 차단 정책을 작성하라.

각 worker는 산출물을 DH-TALK_V2/planning/ 아래 markdown으로 저장할 수 있게 작성하라.
```

## 4. Kanban 보드용 카드 초안

### T1 PM Spec

```text
Title: DH-TALK V2 PM spec review
Assignee: pm
Body:
Read DH-TALK_V2/README.md, PRODUCT_SPEC.md, ACCEPTANCE_CRITERIA.md.
Verify MVP scope, user flows, acceptance criteria, and missing decisions.
Output: DH-TALK_V2/planning/T1_pm_spec_review.md
```

### T2 Frontend UX

```text
Title: DH-TALK V2 frontend UX plan
Assignee: frontend-eng
Body:
Design React/Vite UI for patient board, selected patient panel, macro editor, persistent call popup, and file card.
Include component tree, state shape, routing, and keyboard/mouse flows.
Output: DH-TALK_V2/planning/T2_frontend_ux_plan.md
```

### T3 Backend Realtime

```text
Title: DH-TALK V2 Supabase schema and realtime plan
Assignee: backend-eng
Body:
Design Supabase tables, indexes, RLS policies, realtime subscriptions, and storage bucket policy.
Include SQL migration draft.
Output: DH-TALK_V2/planning/T3_backend_realtime_plan.md
```

### T4 Desktop Popup

```text
Title: DH-TALK V2 Windows popup feasibility
Assignee: frontend-eng
Body:
Compare Electron and Tauri for non-focusable always-on-top popup on Windows.
Popup must stay until closed, not steal focus, default sound off.
Recommend implementation path and proof-of-concept steps.
Output: DH-TALK_V2/planning/T4_desktop_popup_plan.md
```

### T5 Security Review

```text
Title: DH-TALK V2 security and privacy review
Assignee: reviewer
Body:
Review storage minimization, file transfer, auth, RLS, logs, and PHI leakage risks.
Produce concrete blocking rules and test cases.
Output: DH-TALK_V2/planning/T5_security_review.md
```

### T6 Implementation Plan

```text
Title: DH-TALK V2 implementation plan
Assignee: analyst
Parents: T1, T2, T3, T4, T5
Body:
Synthesize T1-T5 outputs into a bite-sized implementation plan.
Include exact files, tasks, test commands, and PR sequence.
Output: DH-TALK_V2/planning/T6_implementation_plan.md
```

## 5. 첫 코딩 PR 권장 범위

첫 PR은 너무 크게 잡지 않는다.

```text
PR-1: project scaffold + static patient board mock
PR-2: Supabase schema + local mock data adapter
PR-3: realtime patient board CRUD
PR-4: macro editor + {name} substitution
PR-5: persistent call popup in web app
PR-6: browser file upload/download
PR-7: Windows notifier proof of concept
```
