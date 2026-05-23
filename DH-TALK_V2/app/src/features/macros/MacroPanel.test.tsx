import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MacroTemplate, TodayPatient } from '../../domain/types';
import { MacroPanel } from './MacroPanel';

const patient: TodayPatient = {
  id: 'p-1',
  date: '2026-05-23',
  name: '홍길동',
  status: 'waiting',
  sortOrder: 1
};

const macros: MacroTemplate[] = [
  {
    id: 'm-1',
    title: '들어오세요',
    template: '{name}님 들어오세요.',
    color: '#2563eb',
    sortOrder: 1,
    target: 'staff',
    scope: 'personal'
  }
];

describe('MacroPanel', () => {
  it('can apply a macro to the direct message composer without sending immediately', () => {
    const onDirectMessageChange = vi.fn();
    const onSend = vi.fn();

    render(
      <MacroPanel
        selectedPatient={patient}
        macros={macros}
        directMessage=""
        onDirectMessageChange={onDirectMessageChange}
        onSend={onSend}
        onAddMacro={vi.fn()}
        onUpdateMacro={vi.fn()}
        onDeleteMacro={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '문구 넣기: 들어오세요' }));

    expect(onDirectMessageChange).toHaveBeenCalledWith('홍길동님 들어오세요.');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('keeps a separate one-click send action for frequent calls', () => {
    const onSend = vi.fn();

    render(
      <MacroPanel
        selectedPatient={patient}
        macros={macros}
        directMessage=""
        onDirectMessageChange={vi.fn()}
        onSend={onSend}
        onAddMacro={vi.fn()}
        onUpdateMacro={vi.fn()}
        onDeleteMacro={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '바로 보내기: 들어오세요' }));

    expect(onSend).toHaveBeenCalledWith('홍길동님 들어오세요.');
  });
});
