import { describe, expect, it } from 'vitest';
import type { TodayPatient } from '../domain/types';
import { createLocalPatientRepository } from './patientRepository';

const today = '2026-05-23';

const seed: TodayPatient[] = [
  { id: 'p1', date: today, name: '홍길동', appointmentTime: '09:30', status: 'waiting', sortOrder: 1 },
  { id: 'p2', date: today, name: '김영희', appointmentTime: '10:00', status: 'waiting', sortOrder: 2 }
];

describe('localPatientRepository', () => {
  it('lists patients by date in sort order', async () => {
    const repo = createLocalPatientRepository(seed);
    await repo.upsert({ id: 'p3', date: today, name: '박민수', status: 'waiting', sortOrder: 0 });

    const rows = await repo.listByDate(today);
    expect(rows.map((patient) => patient.id)).toEqual(['p3', 'p1', 'p2']);
  });

  it('deletes patients by id', async () => {
    const repo = createLocalPatientRepository(seed);
    await repo.delete('p1');
    expect((await repo.listByDate(today)).map((patient) => patient.id)).toEqual(['p2']);
  });
});
