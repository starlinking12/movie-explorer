import { LruCache } from './lru.js';

/**
 * The core of the /api/omdb proxy, shared by the Vercel function and the Vite dev server.
 *
 * - API keys stay on the server (env OMDB_API_KEYS="key1,key2").
 * - Keys are tried in order; a key that hits its daily limit (or is invalid)
 *   is benched for a while and the next one is used.
 * - Successful answers are cached in memory and marked cacheable for the CDN.
 */

const OMDB_URL = 'https://www.omdbapi.com/';
const ALLOWED_PARAMS = ['s', 'i', 'page', 'type', 'y', 'plot'] as const;

export const CACHE_HEADER_OK = 'public, s-maxage=86400, stale-while-revalidate=604800';
export const CACHE_HEADER_NOT_FOUND = 'public, s-maxage=3600';
export const CACHE_HEADER_NONE = 'no-store';

export interface ProxyResult {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

export interface ProxyOptions {
  keys: string[];
  fetchImpl?: typeof fetch;
  cache?: LruCache<unknown>;
  now?: () => number;
  /** How long a key that hit its limit is skipped. */
  benchMs?: number;
}

type KeyFailure = 'limit' | 'invalid';

export function parseKeys(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

/** Classifies an OMDb error message that means "this key can't be used right now". */
export function keyFailure(error: unknown): KeyFailure | null {
  if (typeof error !== 'string') return null;
  const msg = error.toLowerCase();
  if (msg.includes('limit')) return 'limit';
  if (msg.includes('invalid api key') || msg.includes('no api key')) return 'invalid';
  return null;
}

/** Builds a stable cache key from whitelisted params only (order-independent). */
export function cacheKeyFor(params: URLSearchParams): string {
  return ALLOWED_PARAMS.filter((p) => params.has(p))
    .map((p) => `${p}=${(params.get(p) ?? '').trim().toLowerCase()}`)
    .join('&');
}

function json(status: number, body: unknown, cacheControl: string): ProxyResult {
  return {
    status,
    body,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheControl },
  };
}

export function createOmdbProxy(options: ProxyOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const cache = options.cache ?? new LruCache<unknown>(500, 6 * 60 * 60 * 1000);
  const now = options.now ?? Date.now;
  const benchMs = options.benchMs ?? 60 * 60 * 1000;
  const benchedUntil = new Map<string, number>();

  return async function handle(params: URLSearchParams): Promise<ProxyResult> {
    if (!params.get('s')?.trim() && !params.get('i')?.trim()) {
      return json(400, { Response: 'False', Error: 'Provide a search term (s) or an IMDb id (i).' }, CACHE_HEADER_NONE);
    }
    if (options.keys.length === 0) {
      return json(500, { Response: 'False', Error: 'Server is missing OMDB_API_KEYS.' }, CACHE_HEADER_NONE);
    }

    const key = cacheKeyFor(params);
    const cached = cache.get(key);
    if (cached) {
      const res = json(200, cached, CACHE_HEADER_OK);
      res.headers['X-Cache'] = 'HIT';
      return res;
    }

    // Try available keys first; if every key is benched, try them all anyway
    // (the bench is only a guess about when the limit resets).
    const available = options.keys.filter((k) => (benchedUntil.get(k) ?? 0) <= now());
    const order = available.length > 0 ? available : options.keys;

    for (const apiKey of order) {
      const url = new URL(OMDB_URL);
      for (const p of ALLOWED_PARAMS) {
        const v = params.get(p);
        if (v) url.searchParams.set(p, v.trim());
      }
      url.searchParams.set('apikey', apiKey);

      let data: { Response?: string; Error?: string };
      let status: number;
      try {
        const upstream = await fetchImpl(url.toString());
        status = upstream.status;
        data = (await upstream.json()) as typeof data;
      } catch {
        return json(502, { Response: 'False', Error: 'Could not reach the movie database.' }, CACHE_HEADER_NONE);
      }

      const failure = keyFailure(data.Error) ?? (status === 401 ? 'invalid' : null);
      if (failure) {
        benchedUntil.set(apiKey, now() + (failure === 'invalid' ? 24 * benchMs : benchMs));
        continue; // next key
      }

      if (data.Response === 'True') {
        cache.set(key, data);
        const res = json(200, data, CACHE_HEADER_OK);
        res.headers['X-Cache'] = 'MISS';
        return res;
      }
      // A real "not found" style answer: pass it through, cache it briefly.
      return json(200, data, CACHE_HEADER_NOT_FOUND);
    }

    return json(
      503,
      { Response: 'False', Error: 'The movie database is busy right now. Please try again in a little while.' },
      CACHE_HEADER_NONE,
    );
  };
}
