import type { SupabaseClient } from '@supabase/supabase-js';

export interface PatientRealtimeFilter {
  event: '*';
  schema: 'public';
  table: 'patients_today';
  filter: string;
}

interface RealtimeChannelLike {
  on: (type: 'postgres_changes', filter: PatientRealtimeFilter, callback: () => void) => RealtimeChannelLike;
  subscribe: () => unknown;
  unsubscribe: () => unknown;
}

interface RealtimeClientLike {
  channel: (name: string) => RealtimeChannelLike;
}

export function buildPatientRealtimeChannelName(date: string) {
  return `patients_today:${date}`;
}

export function patientRealtimeFilter(date: string): PatientRealtimeFilter {
  return {
    event: '*',
    schema: 'public',
    table: 'patients_today',
    filter: `clinic_date=eq.${date}`
  };
}

export function subscribeToPatientChanges(
  client: SupabaseClient | RealtimeClientLike,
  date: string,
  onChange: () => void
) {
  const channel = client.channel(buildPatientRealtimeChannelName(date));
  channel.on('postgres_changes', patientRealtimeFilter(date), onChange);
  channel.subscribe();

  return () => {
    void channel.unsubscribe();
  };
}
