import { describe, expect, it } from 'vitest';
import { createLimiter } from './limit';

describe('createLimiter', () => {
  it('never runs more than N tasks at once', async () => {
    const limit = createLimiter(2);
    let running = 0;
    let peak = 0;
    const task = () =>
      limit(async () => {
        running++;
        peak = Math.max(peak, running);
        await new Promise((r) => setTimeout(r, 5));
        running--;
      });
    await Promise.all(Array.from({ length: 6 }, task));
    expect(peak).toBe(2);
  });
});
