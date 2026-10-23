import { useCallback, useEffect, useRef, useState } from 'react';
import { OmdbError, peekSearch, searchMovies } from '../api/omdb';
import type { MovieSummary } from '../api/types';

type Status = 'idle' | 'loading' | 'success' | 'error';

export interface SearchState {
  status: Status;
  movies: MovieSummary[];
  total: number;
  error?: OmdbError;
  loadingMore: boolean;
}

const IDLE: SearchState = { status: 'idle', movies: [], total: 0, loadingMore: false };
/** Remembers how many pages were loaded per query, so Back restores the full list. */
const pagesLoaded = new Map<string, number>();

/** Builds the state straight from cache when every loaded page is cached (no flash of skeletons). */
function fromCache(q: string): SearchState | undefined {
  const pages = pagesLoaded.get(q.toLowerCase()) ?? 1;
  let movies: MovieSummary[] = [];
  let total = 0;
  for (let p = 1; p <= pages; p++) {
    const page = peekSearch(q, p);
    if (!page) return undefined;
    movies = movies.concat(page.movies);
    total = page.total;
  }
  return { status: 'success', movies: dedupe(movies), total, loadingMore: false };
}

export function useMovieSearch(query: string) {
  const q = query.trim();
  const [state, setState] = useState<SearchState>(() => (q.length >= 2 && fromCache(q)) || IDLE);
  const [attempt, setAttempt] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    controllerRef.current?.abort();
    if (q.length < 2) {
      setState(IDLE);
      return;
    }
    const cached = fromCache(q);
    if (cached) {
      setState(cached);
      return;
    }

    // Abort the previous search so a slow, stale answer can't overwrite this one.
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ ...IDLE, status: 'loading' });

    searchMovies(q, 1, controller.signal)
      .then((page) => {
        pagesLoaded.set(q.toLowerCase(), 1);
        setState({ status: 'success', movies: dedupe(page.movies), total: page.total, loadingMore: false });
      })
      .catch((err: OmdbError) => {
        if (err.kind !== 'aborted') setState({ ...IDLE, status: 'error', error: err });
      });

    return () => controller.abort();
  }, [q, attempt]);

  const loadMore = useCallback(async () => {
    const key = q.toLowerCase();
    const next = (pagesLoaded.get(key) ?? 1) + 1;
    setState((s) => ({ ...s, loadingMore: true }));
    try {
      const page = await searchMovies(q, next);
      pagesLoaded.set(key, next);
      setState((s) => ({ ...s, movies: dedupe(s.movies.concat(page.movies)), loadingMore: false }));
    } catch {
      setState((s) => ({ ...s, loadingMore: false }));
    }
  }, [q]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const hasMore = state.status === 'success' && state.movies.length < state.total;

  return { ...state, hasMore, loadMore, retry };
}

function dedupe(movies: MovieSummary[]) {
  const seen = new Set<string>();
  return movies.filter((m) => (seen.has(m.imdbID) ? false : (seen.add(m.imdbID), true)));
}
