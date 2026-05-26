import type { SupabaseClient } from '@supabase/supabase-js';
import type { CallAlert, TodayPatient } from '../domain/types';

export interface SendCallMessageInput {
  body: string;
  patient: TodayPatient;
  senderLabel: string;
  recipientGroup?: 'staff' | 'doctor' | 'admin' | 'waiting_room';
}

export interface CallRepository {
  sendCall(input: SendCallMessageInput): Promise<CallAlert>;
  listOpenAlerts(): Promise<CallAlert[]>;
  closeAlert(id: string): Promise<void>;
}

export class AlertAlreadyAcknowledgedError extends Error {
  constructor(id: string) {
    super(`호출 알림 ${id}은 이미 다른 자리에서 확인되었거나 존재하지 않습니다.`);
    this.name = 'AlertAlreadyAcknowledgedError';
  }
}

interface LocalCallRow extends CallAlert {
  messageId?: string;
}

export function createLocalCallRepository(initial: CallAlert[] = []): CallRepository {
  let alerts: LocalCallRow[] = [...initial];

  return {
    async sendCall(input) {
      const now = new Date().toISOString();
      const alert: LocalCallRow = {
        id: `local-alert-${Date.now()}`,
        messageId: `local-message-${Date.now()}`,
        body: input.body,
        patientName: input.patient.name,
        sender: input.senderLabel,
        createdAt: now,
        status: 'unread',
        syncState: 'local-fallback'
      };
      alerts = [...alerts, alert];
      return alert;
    },
    async listOpenAlerts() {
      return alerts.filter((alert) => alert.status !== 'closed');
    },
    async closeAlert(id) {
      alerts = alerts.map((alert) => (alert.id === id ? { ...alert, status: 'closed' } : alert));
    }
  };
}

export function createSupabaseCallRepository(client: SupabaseClient): CallRepository {
  return {
    async sendCall(input) {
      const { data: message, error: messageError } = await client
        .from('messages')
        .insert({
          patient_id: input.patient.id,
          patient_name_snapshot: input.patient.name,
          body: input.body,
          type: 'call'
        })
        .select('id, body, patient_name_snapshot, created_at')
        .single();

      if (messageError) throw messageError;

      const { data: alert, error: alertError } = await client
        .from('call_alerts')
        .insert({
          message_id: message.id,
          recipient_group: input.recipientGroup ?? 'staff',
          status: 'unread'
        })
        .select('id, status, created_at')
        .single();

      if (alertError) throw alertError;

      return {
        id: alert.id,
        body: message.body,
        patientName: message.patient_name_snapshot,
        sender: input.senderLabel,
        createdAt: alert.created_at ?? message.created_at,
        status: alert.status === 'closed' ? 'closed' : 'unread',
        syncState: 'remote'
      };
    },
    async listOpenAlerts() {
      const { data, error } = await client
        .from('call_alerts')
        .select('id, status, created_at, acknowledged_at, acknowledged_by, acknowledged_device, messages(body, patient_name_snapshot)')
        .neq('status', 'closed')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id: row.id,
        body: row.messages?.body ?? '진료실 호출',
        patientName: row.messages?.patient_name_snapshot ?? '',
        sender: '원장실',
        createdAt: row.created_at,
        status: row.status === 'closed' ? 'closed' : 'unread',
        acknowledgedAt: row.acknowledged_at ?? undefined,
        acknowledgedBy: row.acknowledged_by ?? undefined,
        acknowledgedDevice: row.acknowledged_device ?? undefined,
        syncState: 'remote'
      }));
    },
    async closeAlert(id) {
      const acknowledgedAt = new Date().toISOString();
      const acknowledgedDevice = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : 'server';
      const { data, error } = await client
        .from('call_alerts')
        .update({ status: 'closed', acknowledged_at: acknowledgedAt, acknowledged_device: acknowledgedDevice })
        .eq('id', id)
        .eq('status', 'unread')
        .select('id')
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new AlertAlreadyAcknowledgedError(id);
    }
  };
}
