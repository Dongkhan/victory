import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TodayPatient } from '../../domain/types';
import { createLocalPatientRepository } from '../../data/patientRepository';
import { usePatientBoard } from './usePatientBoard';

const date = '2026-05-23';

const seed: TodayPatient[] = [
  { id: 'p1', date, name: '홍길동', appointmentTime: '09:30', status: 'waiting', sortOrder: 1 },
  { id: 'p2', date, name: '김영희', appointmentTime: '10:00', status: 'waiting', sortOrder: 2 }
];

describe('usePatientBoard', () => {
  it('loads patients from repository and persists added patients', async () => {
    const repo = createLocalPatientRepository(seed);
    const { result } = renderHook(() => usePatientBoard({ date, repository: repo, fallbackPatients: [] }));

    await waitFor(() => expect(result.current.patients).toHaveLength(2));

    await act(async () => {
      await result.current.addPatient('박민수');
    });

    expect(result.current.patients.map((patient) => patient.name)).toEqual(['홍길동', '김영희', '박민수']);
    expect((await repo.listByDate(date)).map((patient) => patient.name)).toEqual(['홍길동', '김영희', '박민수']);
  });

  it('updates, moves, deletes, and resets through repository', async () => {
    const repo = createLocalPatientRepository(seed);
    const { result } = renderHook(() => usePatientBoard({ date, repository: repo, fallbackPatients: [] }));

    await waitFor(() => expect(result.current.patients).toHaveLength(2));

    await act(async () => {
      await result.current.updatePatient('p1', { status: 'in_consult' });
      await result.current.movePatient('p2', 'up');
      await result.current.deletePatient('p1');
    });

    expect(result.current.patients.map((patient) => `${patient.id}:${patient.sortOrder}:${patient.status}`)).toEqual(['p2:1:waiting']);
    expect((await repo.listByDate(date)).map((patient) => patient.id)).toEqual(['p2']);

    await act(async () => {
      await result.current.resetPatients([]);
    });

    expect(await repo.listByDate(date)).toEqual([]);
  });
});
