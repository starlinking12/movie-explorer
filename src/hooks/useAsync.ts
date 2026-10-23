import { useCallback, useEffect, useState } from 'react';
import { OmdbError } from '../api/omdb';

export type AsyncState<T> =
  { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: OmdbError };

/**
 * Runs `load` whenever `deps` change. The previous request is aborted
 * (AbortController) so a slow, stale answer can never overwrite a newer one.
 */
export function useAsync<T>(load: ((signal: AbortSignal) => Promise<T>) | null, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ status: load ? 'loading' : 'idle' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!load) {
      setState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    load(controller.signal)
      .then((data) => setState({ status: 'success', data }))
      .catch((err: unknown) => {
        const error = err instanceof OmdbError ? err : new OmdbError('network', 'Something went wrong.');
        if (error.kind !== 'aborted') setState({ status: 'error', error });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
