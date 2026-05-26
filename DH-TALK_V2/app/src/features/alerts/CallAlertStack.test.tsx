import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CallAlert } from '../../domain/types';
import { CallAlertStack } from './CallAlertStack';

const alert: CallAlert = {
  id: 'a-1',
  body: '홍길동님 들어오세요.',
  patientName: '홍길동',
  sender: '원장실',
  createdAt: '2026-05-25T00:00:00.000Z',
  status: 'unread'
};

describe('CallAlertStack sound', () => {
  it('plays a call alert beep when a new alert appears and sound is enabled', () => {
    const playCallAlertBeep = vi.fn().mockResolvedValue(undefined);
    render(
      <CallAlertStack
        alerts={[alert]}
        onClose={vi.fn()}
        soundEnabled={true}
        onSoundEnabledChange={vi.fn()}
        playCallAlertBeep={playCallAlertBeep}
      />
    );

    expect(playCallAlertBeep).toHaveBeenCalledTimes(1);
  });

  it('shows a browser permission message when sound playback fails', async () => {
    const playCallAlertBeep = vi.fn().mockRejectedValue(new Error('not allowed'));
    render(
      <CallAlertStack
        alerts={[alert]}
        onClose={vi.fn()}
        soundEnabled={true}
        onSoundEnabledChange={vi.fn()}
        playCallAlertBeep={playCallAlertBeep}
      />
    );

    expect(await screen.findByText(/브라우저 소리 권한/)).toBeInTheDocument();
  });
});
