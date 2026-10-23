import { useEffect, useState } from 'react';
import { getMovie, value } from '../api/omdb';
import { createLimiter } from '../lib/limit';

// OMDb search results carry no rating, so each card asks for its movie's details.
// At most 4 requests run at once, and answers are cached by the API client
// (the details page reuses them for free).
const limit = createLimiter(4);

export function useRating(imdbID: string) {
  const [rating, setRating] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    limit(() => getMovie(imdbID))
      .then((movie) => !cancelled && setRating(value(movie.imdbRating)))
      .catch(() => undefined)
      .finally(() => !cancelled && setDone(true));
    return () => {
      cancelled = true;
    };
  }, [imdbID]);

  return { rating, loading: !done };
}
