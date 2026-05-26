import { describe, expect, it, vi } from 'vitest';
import type { TodayPatient } from '../domain/types';
import { AlertAlreadyAcknowledgedError, createSupabaseCallRepository } from './callRepository';

const patient: TodayPatient = {
  id: 'p-1',
  date: '2026-05-25',
  name: '홍길동',
  status: 'waiting',
  sortOrder: 1
};

describe('callRepository closeAlert race handling', () => {
  it('throws a domain error when Supabase updates zero unread alert rows', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: '0 rows' } });
    const select = vi.fn(() => ({ maybeSingle }));
    const updateStatusEq = vi.fn(() => ({ select }));
    const updateIdEq = vi.fn(() => ({ eq: updateStatusEq }));
    const update = vi.fn(() => ({ eq: updateIdEq }));
    const from = vi.fn((table: string) => {
      if (table === 'call_alerts') return { update };
      throw new Error(`unexpected table ${table}`);
    });

    const repo = createSupabaseCallRepository({ from } as never);

    await expect(repo.closeAlert('alert-1')).rejects.toBeInstanceOf(AlertAlreadyAcknowledgedError);
    expect(updateIdEq).toHaveBeenCalledWith('id', 'alert-1');
    expect(updateStatusEq).toHaveBeenCalledWith('status', 'unread');
    expect(select).toHaveBeenCalledWith('id');
  });
});
