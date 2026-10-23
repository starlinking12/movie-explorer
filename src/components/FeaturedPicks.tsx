import { getMovie } from '../api/omdb';
import type { MovieDetails } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { MovieCard, MovieCardSkeleton } from './MovieCard';
import { MovieGrid } from './MovieGrid';

/** A hand-picked shelf for the empty state, loaded live from OMDb by IMDb id. */
const PICKS = ['tt1375666', 'tt0816692', 'tt0468569', 'tt0245429', 'tt6751668', 'tt15239678'];

export function FeaturedPicks() {
  const { state } = useAsync(
    (signal) =>
      Promise.allSettled(PICKS.map((id) => getMovie(id, signal))).then((results) =>
        results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      ),
    [],
  );

  if (state.status === 'success' && state.data.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8" aria-labelledby="picks-title">
      <div className="mb-6 flex items-center gap-4">
        <h2 id="picks-title" className="font-display text-3xl text-white">
          Start with a classic
        </h2>
        <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
      </div>
      <MovieGrid busy={state.status === 'loading'} className="md:grid-cols-3 lg:grid-cols-6">
        {state.status === 'success'
          ? state.data.map((movie: MovieDetails, i) => <MovieCard key={movie.imdbID} movie={movie} index={i} />)
          : PICKS.map((id) => <MovieCardSkeleton key={id} />)}
      </MovieGrid>
    </section>
  );
}
