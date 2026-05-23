import type { PatientStatus, TodayPatient } from '../domain/types';

export interface PatientRow {
  id: string;
  clinic_date: string;
  name: string;
  appointment_time: string | null;
  status: PatientStatus;
  sort_order: number;
  operational_note: string | null;
  last_called_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatientInsertRow {
  clinic_date: string;
  name: string;
  appointment_time: string | null;
  status: PatientStatus;
  sort_order: number;
  operational_note: string | null;
  last_called_at: string | null;
}

export function fromPatientRow(row: PatientRow): TodayPatient {
  return {
    id: row.id,
    date: row.clinic_date,
    name: row.name,
    appointmentTime: row.appointment_time ?? undefined,
    status: row.status,
    sortOrder: row.sort_order,
    operationalNote: row.operational_note ?? undefined,
    lastCalledAt: row.last_called_at ?? undefined
  };
}

export function toPatientInsert(patient: TodayPatient): PatientInsertRow {
  return {
    clinic_date: patient.date,
    name: patient.name,
    appointment_time: patient.appointmentTime ?? null,
    status: patient.status,
    sort_order: patient.sortOrder,
    operational_note: patient.operationalNote ?? null,
    last_called_at: patient.lastCalledAt ?? null
  };
}
