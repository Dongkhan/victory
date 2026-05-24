import { describe, expect, it } from 'vitest';
import { parseReservationPaste } from './parseReservationPaste';

describe('parseReservationPaste', () => {
  it('parses time and Korean name rows', () => {
    expect(parseReservationPaste('09:30 홍길동')).toEqual([{ appointmentTime: '09:30', name: '홍길동' }]);
  });

  it('parses csv rows and ignores empty lines', () => {
    expect(parseReservationPaste('\n10:00, 김영희\n\n')).toEqual([{ appointmentTime: '10:00', name: '김영희' }]);
  });

  it('parses Excel tab-separated time and name columns', () => {
    expect(parseReservationPaste('09:30\t홍길동\n10:00\t김영희')).toEqual([
      { appointmentTime: '09:30', name: '홍길동' },
      { appointmentTime: '10:00', name: '김영희' }
    ]);
  });

  it('parses Excel rows when the name column comes before the time column', () => {
    expect(parseReservationPaste('홍길동\t09:30')).toEqual([{ appointmentTime: '09:30', name: '홍길동' }]);
  });

  it('uses the first non-time text column as the patient name when extra Excel columns are present', () => {
    expect(parseReservationPaste('09:30\t홍길동\t초진')).toEqual([{ appointmentTime: '09:30', name: '홍길동' }]);
  });
});
