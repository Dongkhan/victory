export type PatientStatus = 'waiting' | 'in_consult' | 'done' | 'hold' | 'no_show';

export interface TodayPatient {
  id: string;
  date: string;
  name: string;
  appointmentTime?: string;
  status: PatientStatus;
  sortOrder: number;
  operationalNote?: string;
  lastCalledAt?: string;
}

export interface MacroTemplate {
  id: string;
  title: string;
  template: string;
  color: string;
  sortOrder: number;
  target: 'staff' | 'waiting_room' | 'all';
  scope: 'common' | 'personal';
}

export interface CallAlert {
  id: string;
  body: string;
  patientName: string;
  sender: string;
  createdAt: string;
  status: 'unread' | 'closed';
}

export interface TransferFileCard {
  id: string;
  filename: string;
  sizeBytes: number;
  uploadedAt: string;
  expiresAt: string;
}
