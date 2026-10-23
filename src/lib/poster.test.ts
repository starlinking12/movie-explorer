import { describe, expect, it } from 'vitest';
import { posterAt } from './poster';

describe('posterAt', () => {
  it('rewrites the Amazon size suffix', () => {
    expect(posterAt('https://m.media-amazon.com/images/M/abc._V1_SX300.jpg', 800)).toBe(
      'https://m.media-amazon.com/images/M/abc._V1_SX800.jpg',
    );
  });
  it('returns undefined for N/A', () => {
    expect(posterAt('N/A', 300)).toBeUndefined();
  });
});
