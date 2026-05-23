import type { TodayPatient } from '../../domain/types';

export type PatientBoardAction =
  | { type: 'add'; patient: Omit<TodayPatient, 'id' | 'sortOrder'> }
  | { type: 'bulkAdd'; patients: Array<Omit<TodayPatient, 'id' | 'sortOrder'>> }
  | { type: 'update'; id: string; patch: Partial<Omit<TodayPatient, 'id'>> }
  | { type: 'delete'; id: string }
  | { type: 'move'; id: string; direction: 'up' | 'down' }
  | { type: 'reset'; patients: TodayPatient[] };

const createId = () => `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeOrder = (patients: TodayPatient[]) =>
  [...patients]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((patient, index) => ({ ...patient, sortOrder: index + 1 }));

export function patientBoardReducer(patients: TodayPatient[], action: PatientBoardAction): TodayPatient[] {
  switch (action.type) {
    case 'add':
      return normalizeOrder([
        ...patients,
        { ...action.patient, id: createId(), sortOrder: patients.length + 1 }
      ]);
    case 'bulkAdd':
      return normalizeOrder([
        ...patients,
        ...action.patients.map((patient, index) => ({
          ...patient,
          id: createId(),
          sortOrder: patients.length + index + 1
        }))
      ]);
    case 'update':
      return normalizeOrder(
        patients.map((patient) => (patient.id === action.id ? { ...patient, ...action.patch } : patient))
      );
    case 'delete':
      return normalizeOrder(patients.filter((patient) => patient.id !== action.id));
    case 'move': {
      const ordered = normalizeOrder(patients);
      const index = ordered.findIndex((patient) => patient.id === action.id);
      if (index < 0) return ordered;
      const targetIndex = action.direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= ordered.length) return ordered;
      const next = [...ordered];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((patient, orderIndex) => ({ ...patient, sortOrder: orderIndex + 1 }));
    }
    case 'reset':
      return normalizeOrder(action.patients);
    default:
      return patients;
  }
}
