import { describe, expect, it } from 'vitest';
import type { TodayPatient } from '../domain/types';
import { fromPatientRow, toPatientInsert } from './patientRowMapper';

describe('patientRowMapper', () => {
  it('maps Supabase snake_case patient rows to app patients', () => {
    expect(
      fromPatientRow({
        id: 'p1',
        clinic_date: '2026-05-23',
        name: '홍길동',
        appointment_time: '09:30',
        status: 'waiting',
        sort_order: 2,
        operational_note: '접수 확인',
        last_called_at: '2026-05-23T09:40:00.000Z',
        created_at: '2026-05-23T09:00:00.000Z',
        updated_at: '2026-05-23T09:01:00.000Z'
      })
    ).toEqual({
      id: 'p1',
      date: '2026-05-23',
      name: '홍길동',
      appointmentTime: '09:30',
      status: 'waiting',
      sortOrder: 2,
      operationalNote: '접수 확인',
      lastCalledAt: '2026-05-23T09:40:00.000Z'
    });
  });

  it('maps app patients to safe insert rows without clinical fields', () => {
    const patient: TodayPatient = {
      id: 'local-id',
      date: '2026-05-23',
      name: '김영희',
      appointmentTime: '10:00',
      status: 'hold',
      sortOrder: 3,
      operationalNote: '도착 순서 조정',
      lastCalledAt: '2026-05-23T10:05:00.000Z'
    };

    expect(toPatientInsert(patient)).toEqual({
      clinic_date: '2026-05-23',
      name: '김영희',
      appointment_time: '10:00',
      status: 'hold',
      sort_order: 3,
      operational_note: '도착 순서 조정',
      last_called_at: '2026-05-23T10:05:00.000Z'
    });
  });
});
