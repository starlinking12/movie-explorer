import { describe, expect, it, vi } from 'vitest';
import { cacheKeyFor, createOmdbProxy, keyFailure, parseKeys } from './omdbProxy.js';
import { LruCache } from './lru.js';

const ok = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

const params = (q: Record<string, string>) => new URLSearchParams(q);

describe('parseKeys / keyFailure / cacheKeyFor', () => {
  it('parses a comma separated list', () => {
    expect(parseKeys(' a, b ,,c ')).toEqual(['a', 'b', 'c']);
    expect(parseKeys(undefined)).toEqual([]);
  });

  it('recognises key problems', () => {
    expect(keyFailure('Request limit reached!')).toBe('limit');
    expect(keyFailure('Invalid API key!')).toBe('invalid');
    expect(keyFailure('Movie not found!')).toBeNull();
  });

  it('builds the same cache key regardless of order or case', () => {
    expect(cacheKeyFor(params({ page: '2', s: 'Batman' }))).toBe(cacheKeyFor(params({ s: 'batman', page: '2' })));
    expect(cacheKeyFor(params({ s: 'x', apikey: 'leak' }))).toBe('s=x');
  });
});

describe('createOmdbProxy', () => {
  it('falls back to the next key when the first hits its limit', async () => {
    const fetchImpl = vi.fn((url: string) =>
      url.includes('apikey=one')
        ? ok({ Response: 'False', Error: 'Request limit reached!' }, 401)
        : ok({ Response: 'True', Search: [] }),
    ) as unknown as typeof fetch;

    const handle = createOmdbProxy({ keys: ['one', 'two'], fetchImpl });
    const res = await handle(params({ s: 'batman' }));

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('skips a benched key on the next request', async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn((url: string) => {
      calls.push(new URL(url).searchParams.get('apikey')!);
      return url.includes('apikey=one')
        ? ok({ Response: 'False', Error: 'Request limit reached!' })
        : ok({ Response: 'True', Search: [] });
    }) as unknown as typeof fetch;

    const handle = createOmdbProxy({ keys: ['one', 'two'], fetchImpl });
    await handle(params({ s: 'a' }));
    await handle(params({ s: 'b' }));

    expect(calls).toEqual(['one', 'two', 'two']);
  });

  it('returns a clean 503 when every key is exhausted', async () => {
    const fetchImpl = vi.fn(() =>
      ok({ Response: 'False', Error: 'Request limit reached!' }),
    ) as unknown as typeof fetch;
    const handle = createOmdbProxy({ keys: ['one', 'two'], fetchImpl });
    const res = await handle(params({ s: 'batman' }));

    expect(res.status).toBe(503);
    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('serves repeat requests from cache without calling OMDb again', async () => {
    const fetchImpl = vi.fn(() => ok({ Response: 'True', Title: 'Inception' })) as unknown as typeof fetch;
    const handle = createOmdbProxy({ keys: ['one'], fetchImpl });

    const first = await handle(params({ i: 'tt1375666' }));
    const second = await handle(params({ i: 'tt1375666' }));

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(first.headers['X-Cache']).toBe('MISS');
    expect(second.headers['X-Cache']).toBe('HIT');
    expect(second.headers['Cache-Control']).toContain('s-maxage=86400');
  });

  it('never forwards the key or unknown params from the client', async () => {
    let seen = '';
    const fetchImpl = vi.fn((url: string) => {
      seen = url;
      return ok({ Response: 'True' });
    }) as unknown as typeof fetch;
    const handle = createOmdbProxy({ keys: ['secret'], fetchImpl });
    await handle(params({ s: 'x', apikey: 'evil', foo: 'bar' }));

    const sent = new URL(seen).searchParams;
    expect(sent.get('apikey')).toBe('secret');
    expect(sent.has('foo')).toBe(false);
  });

  it('rejects requests without a search term or id', async () => {
    const handle = createOmdbProxy({ keys: ['one'], fetchImpl: vi.fn() as unknown as typeof fetch });
    expect((await handle(params({}))).status).toBe(400);
  });
});

describe('LruCache', () => {
  it('evicts the least recently used entry', () => {
    const cache = new LruCache<number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // a is now most recent
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
  });

  it('expires entries after their TTL', () => {
    let t = 0;
    const cache = new LruCache<number>(10, 1000, () => t);
    cache.set('a', 1);
    t = 999;
    expect(cache.get('a')).toBe(1);
    t = 1001;
    expect(cache.get('a')).toBeUndefined();
  });
});
