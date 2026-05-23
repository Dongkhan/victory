import type { TodayPatient } from '../../domain/types';

export interface ParsedReservation {
  name: string;
  appointmentTime?: string;
}

const timePattern = /^(?<time>(?:[01]?\d|2[0-3])[:시][0-5]\d?)\s*(?<name>.+)$/;

export function parseReservationPaste(text: string): ParsedReservation[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const csvParts = line.split(',').map((part) => part.trim()).filter(Boolean);
      if (csvParts.length >= 2 && /^\d{1,2}:?\d{0,2}$/.test(csvParts[0])) {
        return { appointmentTime: normalizeTime(csvParts[0]), name: csvParts[1] };
      }
      const match = line.match(timePattern);
      if (match?.groups?.time && match.groups.name) {
        return { appointmentTime: normalizeTime(match.groups.time), name: match.groups.name.trim() };
      }
      return { name: line };
    })
    .filter((row) => row.name.length > 0);
}

export function toTodayPatients(rows: ParsedReservation[], date: string): Array<Omit<TodayPatient, 'id' | 'sortOrder'>> {
  return rows.map((row) => ({
    date,
    name: row.name,
    appointmentTime: row.appointmentTime,
    status: 'waiting',
    operationalNote: ''
  }));
}

function normalizeTime(value: string): string {
  const normalized = value.replace('시', ':');
  const [hourRaw, minuteRaw = '00'] = normalized.split(':');
  return `${hourRaw.padStart(2, '0')}:${minuteRaw.padEnd(2, '0').slice(0, 2)}`;
}
