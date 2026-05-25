# DH-TALK V2 Supabase call_alerts RLS checklist

이 문서는 `messages` / `call_alerts` 실시간 호출 기능의 최소 RLS 검증 기준이다.

## Tables

- `messages`
  - `id uuid primary key`
  - `patient_id text not null`
  - `patient_name_snapshot text not null`
  - `body text not null`
  - `type text not null check (type in ('call','note'))`
  - `created_at timestamptz default now()`
- `call_alerts`
  - `id uuid primary key`
  - `message_id uuid references messages(id)`
  - `recipient_group text not null default 'staff'`
  - `status text not null default 'unread' check (status in ('unread','closed'))`
  - `created_at timestamptz default now()`
  - `acknowledged_at timestamptz`
  - `acknowledged_by uuid`
  - `acknowledged_device text`

## Required RLS posture

1. Enable RLS on both tables.
2. Reception/doctor/staff roles may insert call `messages`.
3. Staff-facing clients may read `call_alerts` for their clinic only.
4. Staff-facing clients may update `call_alerts` only from `status='unread'` to `status='closed'`.
5. Clients must not update `message_id`, `body`, `patient_id`, or `patient_name_snapshot` through the ACK path.
6. Patient identifiers in `messages` should stay snapshot-minimal. Do not store 주민번호, full chart text, diagnosis, medication details, or payment data in call alerts.

## Suggested ACK policy shape

```sql
alter table public.messages enable row level security;
alter table public.call_alerts enable row level security;

create policy "staff can read call alerts"
on public.call_alerts for select
to authenticated
using (auth.jwt() ->> 'role' in ('staff','doctor','admin'));

create policy "staff can close unread call alerts"
on public.call_alerts for update
to authenticated
using ((auth.jwt() ->> 'role' in ('staff','doctor','admin')) and status = 'unread')
with check ((auth.jwt() ->> 'role' in ('staff','doctor','admin')) and status = 'closed');
```

## Staging verification

- Send call from reception/doctor client.
- Confirm a second PC receives realtime event.
- ACK from one PC.
- Confirm another PC sees the alert disappear or show already-closed state.
- Attempt direct update of closed alert; it should not reopen.
- Attempt unauthenticated read; it should fail.
