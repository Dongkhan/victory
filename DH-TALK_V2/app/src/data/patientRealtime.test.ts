import { describe, expect, it, vi } from 'vitest';
import { buildPatientRealtimeChannelName, patientRealtimeFilter, subscribeToPatientChanges } from './patientRealtime';

describe('patientRealtime', () => {
  it('builds a date-scoped channel and postgres filter', () => {
    expect(buildPatientRealtimeChannelName('2026-05-23')).toBe('patients_today:2026-05-23');
    expect(patientRealtimeFilter('2026-05-23')).toEqual({
      event: '*',
      schema: 'public',
      table: 'patients_today',
      filter: 'clinic_date=eq.2026-05-23'
    });
  });

  it('subscribes and returns an unsubscribe function', () => {
    const unsubscribe = vi.fn();
    const subscribe = vi.fn();
    const on = vi.fn().mockReturnValue({ subscribe });
    const channel = vi.fn().mockReturnValue({ on, subscribe, unsubscribe });
    const client = { channel };
    const onChange = vi.fn();

    const cleanup = subscribeToPatientChanges(client, '2026-05-23', onChange);

    expect(channel).toHaveBeenCalledWith('patients_today:2026-05-23');
    expect(on).toHaveBeenCalledWith('postgres_changes', patientRealtimeFilter('2026-05-23'), onChange);
    cleanup();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
