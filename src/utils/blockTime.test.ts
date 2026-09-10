import { describe, it, expect } from 'vitest';
import { formatBlockWait } from './blockTime';

describe('formatBlockWait', () => {
  it('reads as ready when nothing is left to wait', () => {
    expect(formatBlockWait(0)).toBe('ready now');
  });

  it('describes a single block as about ten minutes', () => {
    expect(formatBlockWait(1)).toBe('~10 min');
  });

  it('describes an hour of blocks in minutes', () => {
    expect(formatBlockWait(3)).toBe('~30 min');
  });

  it('switches to hours past an hour', () => {
    expect(formatBlockWait(12)).toBe('~2 h');
  });

  it('switches to days past a day', () => {
    expect(formatBlockWait(144)).toBe('~1 d');
  });

  it('rounds a multi-day wait to whole days', () => {
    expect(formatBlockWait(2000)).toBe('~14 d');
  });

  it('treats a negative wait as ready', () => {
    expect(formatBlockWait(-5)).toBe('ready now');
  });
});
