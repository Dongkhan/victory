import { describe, expect, it } from 'vitest';
import type { CallAlert } from '../../domain/types';
import { pruneCallAlertsForRetention } from './callAlertRetention';

const baseAlert: Omit<CallAlert, 'id' | 'createdAt'> = {
  body: '홍길동님 들어오세요.',
  patientName: '홍길동',
  sender: '원장실',
  status: 'unread'
};

describe('pruneCallAlertsForRetention', () => {
  it('keeps call alerts created within the 14 day retention window', () => {
    const alerts: CallAlert[] = [
      { ...baseAlert, id: 'recent', createdAt: '2026-05-10T00:00:00.000Z' }
    ];

    expect(pruneCallAlertsForRetention(alerts, new Date('2026-05-23T00:00:00.000Z'))).toEqual(alerts);
  });

  it('removes call alerts older than 14 days', () => {
    const alerts: CallAlert[] = [
      { ...baseAlert, id: 'old', createdAt: '2026-05-08T23:59:59.999Z' },
      { ...baseAlert, id: 'recent', createdAt: '2026-05-09T00:00:00.000Z' }
    ];

    expect(pruneCallAlertsForRetention(alerts, new Date('2026-05-23T00:00:00.000Z'))).toEqual([
      { ...baseAlert, id: 'recent', createdAt: '2026-05-09T00:00:00.000Z' }
    ]);
  });
});
