import type { TodayPatient } from '../../domain/types';

export interface ParsedReservation {
  name: string;
  appointmentTime?: string;
}

const timeTokenPattern = /^(?:[01]?\d|2[0-3])(?::?[0-5]\d|시[0-5]?\d?)?$/;
const timeAtStartPattern = /^(?<time>(?:[01]?\d|2[0-3])[:시][0-5]\d?)\s*(?<name>.+)$/;

export function parseReservationPaste(text: string): ParsedReservation[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseReservationLine)
    .filter((row) => row.name.length > 0);
}

function parseReservationLine(line: string): ParsedReservation {
  const delimitedParts = line.split(/[\t,]/).map((part) => part.trim()).filter(Boolean);
  if (delimitedParts.length >= 2) {
    const timePart = delimitedParts.find(isTimeToken);
    const namePart = delimitedParts.find((part) => !isTimeToken(part));
    if (timePart && namePart) {
      return { appointmentTime: normalizeTime(timePart), name: namePart };
    }
  }

  const match = line.match(timeAtStartPattern);
  if (match?.groups?.time && match.groups.name) {
    return { appointmentTime: normalizeTime(match.groups.time), name: match.groups.name.trim() };
  }

  return { name: line };
}

function isTimeToken(value: string): boolean {
  return timeTokenPattern.test(value.replace(/\s/g, ''));
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
