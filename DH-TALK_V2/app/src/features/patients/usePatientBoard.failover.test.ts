import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PatientRepository } from '../../data/patientRepository';
import { createLocalPatientRepository } from '../../data/patientRepository';
import type { TodayPatient } from '../../domain/types';
import { usePatientBoard } from './usePatientBoard';

const date = '2026-05-23';
const seed: TodayPatient[] = [
  { id: 'p1', date, name: '홍길동', appointmentTime: '09:30', status: 'waiting', sortOrder: 1 }
];

describe('usePatientBoard failover', () => {
  it('keeps a pending local copy when remote upsert fails', async () => {
    const remote: PatientRepository = {
      listByDate: vi.fn().mockResolvedValue(seed),
      upsert: vi.fn().mockRejectedValue(new Error('network down')),
      delete: vi.fn().mockResolvedValue(undefined)
    };
    const fallback = createLocalPatientRepository(seed);
    const { result } = renderHook(() => usePatientBoard({ date, repository: remote, fallbackRepository: fallback, fallbackPatients: seed }));

    await waitFor(() => expect(result.current.patients).toHaveLength(1));

    await act(async () => {
      await result.current.addPatient('박민수', '11:00');
    });

    expect(result.current.mutationError).toContain('로컬 임시 저장');
    expect(result.current.patients.find((patient) => patient.name === '박민수')?.syncState).toBe('pending');
    expect((await fallback.listByDate(date)).some((patient) => patient.name === '박민수')).toBe(true);
  });
});
