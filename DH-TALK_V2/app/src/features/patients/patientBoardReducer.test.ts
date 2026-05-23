import { describe, expect, it } from 'vitest';
import type { TodayPatient } from '../../domain/types';
import { patientBoardReducer } from './patientBoardReducer';

const patients: TodayPatient[] = [
  { id: 'p1', date: '2026-05-23', name: 'A', status: 'waiting', sortOrder: 1 },
  { id: 'p2', date: '2026-05-23', name: 'B', status: 'waiting', sortOrder: 2 }
];

describe('patientBoardReducer', () => {
  it('updates status', () => {
    const next = patientBoardReducer(patients, { type: 'update', id: 'p1', patch: { status: 'done' } });
    expect(next[0].status).toBe('done');
  });

  it('moves patient order', () => {
    const next = patientBoardReducer(patients, { type: 'move', id: 'p2', direction: 'up' });
    expect(next[0].id).toBe('p2');
    expect(next[0].sortOrder).toBe(1);
  });
});
