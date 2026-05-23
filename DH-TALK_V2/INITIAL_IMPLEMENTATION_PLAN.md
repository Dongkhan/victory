# DH-TALK V2 Initial Implementation Plan

> **For Hermes:** Use subagent-driven-development or Kanban-style worker fan-out to implement this plan task-by-task.

**Goal:** Build DH-TALK V2 as a cloud-synchronized outpatient patient-flow board with patient-name macro calls, persistent non-focus-stealing call alerts, and browser-based temporary file transfer.

**Architecture:** Start with a React + TypeScript + Vite web app backed by Supabase for auth, realtime DB, and storage. Implement a web persistent call popup first, then add a Windows notifier proof-of-concept if browser notifications cannot satisfy always-on-top/non-focus requirements.

**Tech Stack:** React, TypeScript, Vite, Supabase Auth/Postgres/Realtime/Storage, Vitest/Playwright, optional Tauri/Electron notifier.

---

## Phase A. Scaffold

### Task A1: Create Vite app shell

**Objective:** Create the first runnable DH-TALK V2 web app shell under `DH-TALK_V2/app`.

**Files:**

- Create: `DH-TALK_V2/app/package.json`
- Create: `DH-TALK_V2/app/src/App.tsx`
- Create: `DH-TALK_V2/app/src/main.tsx`
- Create: `DH-TALK_V2/app/src/styles.css`
- Create: `DH-TALK_V2/app/.env.example`

**Steps:**

1. Initialize React + TypeScript + Vite.
2. Add basic layout: left patient board, right selected patient/macro panel.
3. Run `npm install`.
4. Run `npm run build`.
5. Commit: `feat(dh-talk-v2): scaffold web app`.

### Task A2: Add test harness

**Objective:** Add unit and browser-level testing foundation.

**Files:**

- Modify: `DH-TALK_V2/app/package.json`
- Create: `DH-TALK_V2/app/src/__tests__/macro.test.ts`
- Create: `DH-TALK_V2/app/playwright.config.ts`

**Steps:**

1. Add Vitest.
2. Add Playwright.
3. Add first test for `{name}` substitution.
4. Run tests.
5. Commit: `test(dh-talk-v2): add test harness`.

## Phase B. Patient Board

### Task B1: Define patient model

**Objective:** Create typed domain models for patient board state.

**Files:**

- Create: `DH-TALK_V2/app/src/domain/types.ts`

**Core types:**

```ts
export type PatientStatus = 'waiting' | 'in_consult' | 'done' | 'hold' | 'no_show';

export interface TodayPatient {
  id: string;
  date: string;
  name: string;
  appointmentTime?: string;
  status: PatientStatus;
  sortOrder: number;
  operationalNote?: string;
}
```

### Task B2: Build local patient board CRUD

**Objective:** Implement add/edit/delete/reorder/status-change against local state before Supabase wiring.

**Files:**

- Create: `DH-TALK_V2/app/src/features/patients/PatientBoard.tsx`
- Create: `DH-TALK_V2/app/src/features/patients/patientBoardReducer.ts`
- Test: `DH-TALK_V2/app/src/features/patients/patientBoardReducer.test.ts`

**Acceptance:**

- Add 환자
- Edit 이름/시간
- Delete 환자
- Change status
- Reorder

### Task B3: Add reservation paste parser

**Objective:** Convert pasted appointment text/CSV into patient rows.

**Files:**

- Create: `DH-TALK_V2/app/src/features/import/parseReservationPaste.ts`
- Test: `DH-TALK_V2/app/src/features/import/parseReservationPaste.test.ts`

**Acceptance:**

- `09:30 홍길동` parses to time/name.
- CSV rows parse.
- Empty lines are ignored.

## Phase C. Macro System

### Task C1: Add macro substitution function

**Objective:** Implement safe `{name}` replacement.

**Files:**

- Create: `DH-TALK_V2/app/src/features/macros/renderMacro.ts`
- Test: `DH-TALK_V2/app/src/features/macros/renderMacro.test.ts`

**Acceptance:**

- `{name}님 들어오세요.` + `홍길동` → `홍길동님 들어오세요.`
- No selected patient blocks call send.

### Task C2: Build macro panel

**Objective:** Display common/personal macros and send rendered messages.

**Files:**

- Create: `DH-TALK_V2/app/src/features/macros/MacroPanel.tsx`
- Create: `DH-TALK_V2/app/src/features/macros/MacroEditor.tsx`

**Acceptance:**

- User can add/edit/delete/reorder personal macros.
- Clicking macro previews rendered body.
- Sending creates message/call event locally.

## Phase D. Persistent Call Popup

### Task D1: Web persistent call popup

**Objective:** Show call alerts that remain until manually closed.

**Files:**

- Create: `DH-TALK_V2/app/src/features/alerts/CallAlertStack.tsx`
- Test: `DH-TALK_V2/app/src/features/alerts/CallAlertStack.test.tsx`

**Acceptance:**

- Alert stays until confirm/close.
- Multiple alerts are not lost.
- Sound is off by default.

### Task D2: Sound setting

**Objective:** Add per-user sound toggle with default OFF.

**Files:**

- Create: `DH-TALK_V2/app/src/features/settings/UserSettings.tsx`
- Modify: `DH-TALK_V2/app/src/features/alerts/CallAlertStack.tsx`

**Acceptance:**

- Default false.
- Only plays sound when enabled.

## Phase E. Supabase

### Task E1: Write SQL migration

**Objective:** Define Supabase schema for users, patients, macros, messages, call_alerts, files.

**Files:**

- Create: `DH-TALK_V2/supabase/migrations/001_initial_schema.sql`

**Acceptance:**

- Tables exist.
- Indexes for date/status/sortOrder.
- RLS enabled.

### Task E2: Wire realtime patient board

**Objective:** Replace local adapter with Supabase adapter.

**Files:**

- Create: `DH-TALK_V2/app/src/lib/supabaseClient.ts`
- Create: `DH-TALK_V2/app/src/data/patientRepository.ts`

**Acceptance:**

- Two browser sessions see updates.
- CRUD operations persist.

### Task E3: Wire call alerts

**Objective:** Send and receive call alerts via Supabase realtime.

**Files:**

- Create: `DH-TALK_V2/app/src/data/callAlertRepository.ts`

**Acceptance:**

- Doctor sends call.
- Staff session receives persistent alert.
- Confirm updates status.

## Phase F. File Transfer

### Task F1: File validation

**Objective:** Block unsafe/oversized files before upload.

**Files:**

- Create: `DH-TALK_V2/app/src/features/files/validateFile.ts`
- Test: `DH-TALK_V2/app/src/features/files/validateFile.test.ts`

**Acceptance:**

- Allows PDF/JPG/PNG/DOCX/XLSX/HWP/HWPX.
- Blocks EXE/BAT/CMD/MSI/ZIP.
- Blocks >20MB.

### Task F2: Storage upload/download

**Objective:** Upload to Supabase Storage and render file cards.

**Files:**

- Create: `DH-TALK_V2/app/src/features/files/FileUpload.tsx`
- Create: `DH-TALK_V2/app/src/features/files/FileCard.tsx`
- Create: `DH-TALK_V2/app/src/data/fileRepository.ts`

**Acceptance:**

- Upload progress visible.
- File card displays metadata.
- Download works for logged-in user only.

## Phase G. Windows Notifier Proof of Concept

### Task G1: Electron/Tauri decision spike

**Objective:** Verify best option for non-focus-stealing always-on-top popup.

**Files:**

- Create: `DH-TALK_V2/notifier-spike/README.md`
- Create: `DH-TALK_V2/notifier-spike/electron-poc/` or `tauri-poc/`

**Acceptance:**

- Popup can stay on top.
- Popup does not steal focus.
- Popup remains until closed.
- Report limitations on Windows.

## Phase H. QA and Release Prep

### Task H1: E2E user flows

**Objective:** Test end-to-end workflows.

**Files:**

- Create: `DH-TALK_V2/app/e2e/patient-call-flow.spec.ts`
- Create: `DH-TALK_V2/app/e2e/file-transfer.spec.ts`

**Acceptance:**

- Add patient → select → macro call → alert persists → confirm.
- Upload file → file card → download.

### Task H2: Staff guide

**Objective:** Write one-page clinic usage guide.

**Files:**

- Create: `DH-TALK_V2/docs/staff-guide.md`

**Acceptance:**

- 직원이 예약표 올리기, 환자 추가, 호출 확인, 파일 다운로드를 알 수 있다.
