import type { MovieDetails, SearchPage, SearchResponse } from './types';

/**
 * Typed client for our own /api/omdb proxy (the proxy holds the API keys).
 * Every request is abortable and answers are cached in memory + sessionStorage,
 * so going back to a page you've seen is instant and costs no network request.
 */

export type OmdbErrorKind = 'not-found' | 'unavailable' | 'network' | 'aborted' | 'bad-request';

export class OmdbError extends Error {
  constructor(
    public readonly kind: OmdbErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'OmdbError';
  }
}

const API_BASE = '/api/omdb';
const STORAGE_PREFIX = 'omdb:';
const memory = new Map<string, unknown>();

function readCache<T>(key: string): T | undefined {
  if (memory.has(key)) return memory.get(key) as T;
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (raw) {
      const value = JSON.parse(raw) as T;
      memory.set(key, value);
      return value;
    }
  } catch {
    /* storage unavailable (private mode) — memory cache still works */
  }
  return undefined;
}

function writeCache(key: string, value: unknown) {
  memory.set(key, value);
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota exceeded — ignore */
  }
}

/** Test helper. */
export function clearOmdbCache() {
  memory.clear();
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

async function request<T>(params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const cached = readCache<T>(query);
  if (cached) return cached;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}?${query}`, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new OmdbError('aborted', 'Request was cancelled.');
    }
    throw new OmdbError('network', 'Can’t reach the server. Check your connection and try again.');
  }

  let data: { Response?: string; Error?: string };
  try {
    data = await res.json();
  } catch {
    throw new OmdbError('unavailable', 'The movie service sent an unexpected answer.');
  }

  if (res.status === 400) throw new OmdbError('bad-request', data.Error ?? 'Bad request.');
  if (!res.ok) throw new OmdbError('unavailable', data.Error ?? 'The movie service is unavailable right now.');
  if (data.Response === 'False') {
    const message = data.Error ?? 'Nothing found.';
    const notFound = /not found/i.test(message);
    throw new OmdbError(notFound ? 'not-found' : 'unavailable', message);
  }

  writeCache(query, data);
  return data as T;
}

export async function searchMovies(query: string, page = 1, signal?: AbortSignal): Promise<SearchPage> {
  const data = await request<SearchResponse>({ s: query.trim(), page: String(page) }, signal);
  return { movies: data.Search, total: Number(data.totalResults) || data.Search.length };
}

/** Synchronously returns a cached search page, if we have it (lets Back render instantly). */
export function peekSearch(query: string, page = 1): SearchPage | undefined {
  const data = readCache<SearchResponse>(new URLSearchParams({ s: query.trim(), page: String(page) }).toString());
  return data && { movies: data.Search, total: Number(data.totalResults) || data.Search.length };
}

export function getMovie(imdbID: string, signal?: AbortSignal): Promise<MovieDetails> {
  return request<MovieDetails>({ i: imdbID, plot: 'full' }, signal);
}

/** OMDb answers "N/A" for missing fields; normalise that to undefined. */
export function value(field: string | undefined): string | undefined {
  return field && field !== 'N/A' ? field : undefined;
}
