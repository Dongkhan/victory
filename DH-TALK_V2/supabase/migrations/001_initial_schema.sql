-- DH-TALK V2 initial Supabase schema
-- Scope: outpatient operational flow only. Do not store resident IDs, diagnoses, chart notes, prescriptions, or other clinical records.

create extension if not exists pgcrypto;

create type public.user_role as enum ('doctor', 'staff', 'admin', 'waiting_room');
create type public.patient_status as enum ('waiting', 'in_consult', 'done', 'hold', 'no_show');
create type public.macro_target as enum ('staff', 'waiting_room', 'all');
create type public.message_type as enum ('text', 'call', 'file');
create type public.call_alert_status as enum ('unread', 'read', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '사용자',
  role public.user_role not null default 'staff',
  sound_enabled boolean not null default false,
  popup_position text not null default 'bottom-right',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients_today (
  id uuid primary key default gen_random_uuid(),
  clinic_date date not null default current_date,
  name text not null check (char_length(name) between 1 and 40),
  appointment_time text check (appointment_time is null or appointment_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  status public.patient_status not null default 'waiting',
  sort_order integer not null default 0,
  operational_note text check (operational_note is null or char_length(operational_note) <= 120),
  last_called_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.macros (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  template text not null check (char_length(template) between 1 and 300),
  color text not null default '#2563eb',
  sort_order integer not null default 0,
  target public.macro_target not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete set null,
  patient_id uuid references public.patients_today(id) on delete set null,
  patient_name_snapshot text not null check (char_length(patient_name_snapshot) <= 40),
  body text not null check (char_length(body) between 1 and 500),
  type public.message_type not null default 'text',
  created_at timestamptz not null default now()
);

create table public.call_alerts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  recipient_group public.user_role,
  status public.call_alert_status not null default 'unread',
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  check (recipient_user_id is not null or recipient_group is not null)
);

create table public.transfer_files (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  storage_path text not null,
  original_filename text not null check (char_length(original_filename) <= 180),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 20971520),
  mime_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

create index patients_today_date_status_order_idx on public.patients_today (clinic_date, status, sort_order);
create index patients_today_date_order_idx on public.patients_today (clinic_date, sort_order);
create index macros_owner_order_idx on public.macros (owner_user_id, sort_order);
create index messages_created_idx on public.messages (created_at desc);
create index call_alerts_recipient_status_idx on public.call_alerts (recipient_user_id, recipient_group, status, created_at desc);
create index transfer_files_expires_idx on public.transfer_files (expires_at);

alter table public.profiles enable row level security;
alter table public.patients_today enable row level security;
alter table public.macros enable row level security;
alter table public.messages enable row level security;
alter table public.call_alerts enable row level security;
alter table public.transfer_files enable row level security;

-- Clinic-internal app MVP policy: any authenticated clinic account can read/write operational data.
-- Tighten by role after account provisioning is finalized.
create policy "profiles readable by authenticated users" on public.profiles for select to authenticated using (true);
create policy "profiles update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "patients authenticated read" on public.patients_today for select to authenticated using (true);
create policy "patients authenticated insert" on public.patients_today for insert to authenticated with check (true);
create policy "patients authenticated update" on public.patients_today for update to authenticated using (true) with check (true);
create policy "patients authenticated delete" on public.patients_today for delete to authenticated using (true);

create policy "macros authenticated read" on public.macros for select to authenticated using (owner_user_id is null or owner_user_id = auth.uid());
create policy "macros authenticated insert" on public.macros for insert to authenticated with check (owner_user_id is null or owner_user_id = auth.uid());
create policy "macros authenticated update" on public.macros for update to authenticated using (owner_user_id is null or owner_user_id = auth.uid()) with check (owner_user_id is null or owner_user_id = auth.uid());
create policy "macros authenticated delete" on public.macros for delete to authenticated using (owner_user_id is null or owner_user_id = auth.uid());

create policy "messages authenticated read" on public.messages for select to authenticated using (true);
create policy "messages authenticated insert" on public.messages for insert to authenticated with check (true);

create policy "call alerts authenticated read" on public.call_alerts for select to authenticated using (recipient_user_id is null or recipient_user_id = auth.uid() or recipient_group is not null);
create policy "call alerts authenticated insert" on public.call_alerts for insert to authenticated with check (true);
create policy "call alerts authenticated update" on public.call_alerts for update to authenticated using (recipient_user_id is null or recipient_user_id = auth.uid() or recipient_group is not null) with check (true);

create policy "files authenticated read" on public.transfer_files for select to authenticated using (true);
create policy "files authenticated insert" on public.transfer_files for insert to authenticated with check (true);
create policy "files authenticated delete" on public.transfer_files for delete to authenticated using (uploaded_by = auth.uid());

alter publication supabase_realtime add table public.patients_today;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.call_alerts;
