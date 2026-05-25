import type { SupabaseClient } from '@supabase/supabase-js';

export interface CallAlertRealtimeFilter {
  event: '*';
  schema: 'public';
  table: 'call_alerts';
}

interface RealtimeChannelLike {
  on: (type: 'postgres_changes', filter: CallAlertRealtimeFilter, callback: () => void) => RealtimeChannelLike;
  subscribe: () => unknown;
  unsubscribe: () => unknown;
}

interface RealtimeClientLike {
  channel: (name: string) => RealtimeChannelLike;
}

export function callAlertRealtimeFilter(): CallAlertRealtimeFilter {
  return {
    event: '*',
    schema: 'public',
    table: 'call_alerts'
  };
}

export function subscribeToCallAlertChanges(
  client: SupabaseClient | RealtimeClientLike,
  onChange: () => void
) {
  const channel = client.channel('call_alerts:clinic');
  channel.on('postgres_changes', callAlertRealtimeFilter(), onChange);
  channel.subscribe();

  return () => {
    void channel.unsubscribe();
  };
}
