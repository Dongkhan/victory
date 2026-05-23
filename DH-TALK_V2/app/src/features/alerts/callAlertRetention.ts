import type { CallAlert } from '../../domain/types';

export const CALL_ALERT_RETENTION_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function pruneCallAlertsForRetention(alerts: CallAlert[], now = new Date()): CallAlert[] {
  const cutoff = now.getTime() - CALL_ALERT_RETENTION_DAYS * MS_PER_DAY;
  return alerts.filter((alert) => {
    const createdAt = Date.parse(alert.createdAt);
    return Number.isFinite(createdAt) && createdAt >= cutoff;
  });
}
