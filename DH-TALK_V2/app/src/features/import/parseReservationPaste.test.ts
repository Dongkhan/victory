import { describe, expect, it } from 'vitest';
import { parseReservationPaste } from './parseReservationPaste';

describe('parseReservationPaste', () => {
  it('parses time and Korean name rows', () => {
    expect(parseReservationPaste('09:30 홍길동')).toEqual([{ appointmentTime: '09:30', name: '홍길동' }]);
  });

  it('parses csv rows and ignores empty lines', () => {
    expect(parseReservationPaste('\n10:00, 김영희\n\n')).toEqual([{ appointmentTime: '10:00', name: '김영희' }]);
  });
});
