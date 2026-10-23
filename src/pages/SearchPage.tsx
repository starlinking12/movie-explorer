import { Link, useSearchParams } from 'react-router';
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard';
import { MovieGrid } from '../components/MovieGrid';
import { Button, StateMessage } from '../components/StateMessage';
import { FilmIcon, SearchIcon } from '../components/Icons';
import { useMovieSearch } from '../hooks/useMovieSearch';
import { FeaturedPicks } from '../components/FeaturedPicks';

const SUGGESTIONS = ['Inception', 'Interstellar', 'The Dark Knight', 'Spirited Away', 'Parasite', 'Dune', 'La La Land'];

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const search = useMovieSearch(query);

  if (search.status === 'idle')
    return (
      <>
        <Welcome />
        <FeaturedPicks />
      </>
    );

  return (
    <section className="mx-auto max-w-7xl px-5 pt-10 pb-6 sm:px-8 sm:pt-14">
      <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-gold/80 uppercase">Results</p>
          <h1 className="mt-2 font-display text-4xl leading-none text-white sm:text-5xl">“{query.trim()}”</h1>
        </div>
        {search.status === 'success' && (
          <p className="shrink-0 pb-1 text-sm text-white/45" aria-live="polite">
            {search.total.toLocaleString()} {search.total === 1 ? 'title' : 'titles'}
          </p>
        )}
      </div>

      {search.status === 'loading' && (
        <MovieGrid busy>
          {Array.from({ length: 10 }, (_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </MovieGrid>
      )}

      {search.status === 'error' && search.error?.kind === 'not-found' && (
        <StateMessage icon={<SearchIcon className="size-7" />} title="No matches">
          We couldn’t find anything for “{query.trim()}”. Check the spelling, or try one of the suggestions below.
          <Suggestions className="mt-6 justify-center" />
        </StateMessage>
      )}

      {search.status === 'error' && search.error?.kind !== 'not-found' && (
        <StateMessage
          icon={<FilmIcon className="size-7" />}
          title="Intermission"
          action={<Button onClick={search.retry}>Try again</Button>}
        >
          {search.error?.message ?? 'Something went wrong while loading movies.'}
        </StateMessage>
      )}

      {search.status === 'success' && (
        <>
          <MovieGrid>
            {search.movies.map((movie, i) => (
              <MovieCard key={movie.imdbID} movie={movie} index={i} />
            ))}
          </MovieGrid>
          {search.hasMore && (
            <div className="mt-14 flex justify-center">
              <button
                type="button"
                onClick={search.loadMore}
                disabled={search.loadingMore}
                className="rounded-full border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-medium text-white/85 transition hover:border-gold/40 hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
              >
                {search.loadingMore ? 'Loading…' : 'Show more'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Welcome() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center px-5 pt-16 pb-16 text-center sm:px-8 sm:pt-24 sm:pb-20">
      <p className="animate-fade-up text-xs font-medium tracking-[0.25em] text-gold/80 uppercase">Your pocket cinema</p>
      <h1
        className="mt-5 animate-fade-up font-display text-[3.4rem] leading-[0.95] tracking-tight text-white sm:text-8xl"
        style={{ animationDelay: '80ms' }}
      >
        Every film,
        <br />
        <em className="bg-gradient-to-r from-gold-soft via-gold to-ember bg-clip-text text-transparent">
          one search away.
        </em>
      </h1>
      <p
        className="mt-6 max-w-md animate-fade-up text-base leading-relaxed text-white/55 sm:text-lg"
        style={{ animationDelay: '160ms' }}
      >
        Search by title to explore plots, cast and IMDb ratings — for movies and series alike.
      </p>
      <div className="mt-10 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <p className="mb-4 text-xs tracking-wide text-white/35">Try one of these</p>
        <Suggestions className="justify-center" />
      </div>
    </section>
  );
}

function Suggestions({ className = '' }: { className?: string }) {
  return (
    <span className={`flex flex-wrap gap-2.5 ${className}`}>
      {SUGGESTIONS.map((title) => (
        <Link
          key={title}
          to={`/?q=${encodeURIComponent(title)}`}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition hover:-translate-y-0.5 hover:border-gold/40 hover:bg-gold/10 hover:text-white"
        >
          {title}
        </Link>
      ))}
    </span>
  );
}
