import { describe, expect, it } from 'vitest';
import { isSupabaseConfigured } from './supabaseClient';

describe('supabaseClient configuration', () => {
  it('treats empty environment variables as unconfigured local mode', () => {
    expect(isSupabaseConfigured('', '')).toBe(false);
    expect(isSupabaseConfigured('https://example.supabase.co', '')).toBe(false);
  });

  it('treats url and anon key as configured cloud mode', () => {
    expect(isSupabaseConfigured('https://example.supabase.co', 'anon-key')).toBe(true);
  });
});
