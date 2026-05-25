import { describe, expect, it, vi } from 'vitest';
import type { TodayPatient } from '../domain/types';
import { createLocalCallRepository, createSupabaseCallRepository } from './callRepository';

const patient: TodayPatient = {
  id: 'p-1',
  date: '2026-05-25',
  name: '홍길동',
  status: 'waiting',
  sortOrder: 1
};

describe('callRepository', () => {
  it('stores local call alerts and closes them by id', async () => {
    const repo = createLocalCallRepository();
    const alert = await repo.sendCall({ body: '홍길동님 들어오세요.', patient, senderLabel: '원장실' });

    expect(alert.patientName).toBe('홍길동');
    expect(alert.status).toBe('unread');
    expect(await repo.listOpenAlerts()).toHaveLength(1);

    await repo.closeAlert(alert.id);
    expect(await repo.listOpenAlerts()).toEqual([]);
  });

  it('writes Supabase messages and call_alerts then acknowledges remotely', async () => {
    const updateStatusEq = vi.fn().mockResolvedValue({ error: null });
    const updateIdEq = vi.fn(() => ({ eq: updateStatusEq }));
    const update = vi.fn(() => ({ eq: updateIdEq }));
    const alertSingle = vi.fn().mockResolvedValue({ data: { id: 'alert-1', status: 'unread', created_at: '2026-05-25T00:00:01.000Z' }, error: null });
    const alertSelect = vi.fn(() => ({ single: alertSingle }));
    const alertInsert = vi.fn(() => ({ select: alertSelect }));
    const messageSingle = vi.fn().mockResolvedValue({ data: { id: 'msg-1', body: '홍길동님 들어오세요.', patient_name_snapshot: '홍길동', created_at: '2026-05-25T00:00:00.000Z' }, error: null });
    const messageSelect = vi.fn(() => ({ single: messageSingle }));
    const messageInsert = vi.fn(() => ({ select: messageSelect }));
    const from = vi.fn((table: string) => {
      if (table === 'messages') return { insert: messageInsert };
      if (table === 'call_alerts') return { insert: alertInsert, update };
      throw new Error(`unexpected table ${table}`);
    });

    const repo = createSupabaseCallRepository({ from } as never);
    const alert = await repo.sendCall({ body: '홍길동님 들어오세요.', patient, senderLabel: '원장실' });
    await repo.closeAlert('alert-1');

    expect(alert.id).toBe('alert-1');
    expect(from).toHaveBeenCalledWith('messages');
    expect(from).toHaveBeenCalledWith('call_alerts');
    expect(messageInsert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: 'p-1', type: 'call' }));
    expect(alertInsert).toHaveBeenCalledWith(expect.objectContaining({ message_id: 'msg-1', recipient_group: 'staff', status: 'unread' }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'closed' }));
    expect(updateIdEq).toHaveBeenCalledWith('id', 'alert-1');
    expect(updateStatusEq).toHaveBeenCalledWith('status', 'unread');
  });
});
