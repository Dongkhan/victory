import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLocalStorageState } from './useLocalStorageState';

describe('useLocalStorageState', () => {
  it('loads initial state from localStorage and persists updates', () => {
    window.localStorage.setItem('dh-test', JSON.stringify(['saved']));

    const { result } = renderHook(() => useLocalStorageState<string[]>('dh-test', ['initial']));
    expect(result.current[0]).toEqual(['saved']);

    act(() => result.current[1](['next']));
    expect(JSON.parse(window.localStorage.getItem('dh-test') ?? '[]')).toEqual(['next']);
  });
});
