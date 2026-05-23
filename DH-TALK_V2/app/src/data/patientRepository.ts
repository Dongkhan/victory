import type { SupabaseClient } from '@supabase/supabase-js';
import type { TodayPatient } from '../domain/types';
import { fromPatientRow, type PatientRow, toPatientInsert } from './patientRowMapper';

export interface PatientRepository {
  listByDate(date: string): Promise<TodayPatient[]>;
  upsert(patient: TodayPatient): Promise<TodayPatient>;
  delete(id: string): Promise<void>;
}

export function createLocalPatientRepository(initial: TodayPatient[] = []): PatientRepository {
  let patients = [...initial];

  return {
    async listByDate(date: string) {
      return patients
        .filter((patient) => patient.date === date)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    async upsert(patient: TodayPatient) {
      const existingIndex = patients.findIndex((item) => item.id === patient.id);
      if (existingIndex >= 0) {
        patients = patients.map((item) => (item.id === patient.id ? patient : item));
      } else {
        patients = [...patients, patient];
      }
      return patient;
    },
    async delete(id: string) {
      patients = patients.filter((patient) => patient.id !== id);
    }
  };
}

export function createSupabasePatientRepository(client: SupabaseClient): PatientRepository {
  return {
    async listByDate(date: string) {
      const { data, error } = await client
        .from('patients_today')
        .select('*')
        .eq('clinic_date', date)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data as PatientRow[]).map(fromPatientRow);
    },
    async upsert(patient: TodayPatient) {
      const row = toPatientInsert(patient);
      const { data, error } = await client
        .from('patients_today')
        .upsert({ id: patient.id, ...row })
        .select('*')
        .single();
      if (error) throw error;
      return fromPatientRow(data as PatientRow);
    },
    async delete(id: string) {
      const { error } = await client.from('patients_today').delete().eq('id', id);
      if (error) throw error;
    }
  };
}
