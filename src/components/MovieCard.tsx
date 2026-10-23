import { Link } from 'react-router';
import type { MovieSummary } from '../api/types';
import { useRating } from '../hooks/useRating';
import { StarIcon } from './Icons';
import { Poster } from './Poster';

export function MovieCard({ movie, index }: { movie: MovieSummary; index: number }) {
  const { rating, loading } = useRating(movie.imdbID);

  return (
    <li className="animate-fade-up" style={{ animationDelay: `${Math.min(index % 10, 9) * 45}ms` }}>
      <Link
        to={`/movie/${movie.imdbID}`}
        className="group block rounded-2xl outline-offset-4"
        aria-label={`${movie.Title} (${movie.Year})${rating ? `, rated ${rating} out of 10` : ''}`}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-ink-3 ring-1 ring-white/10 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_60px_-20px_rgb(233_180_90/0.45)] group-hover:ring-gold/40 group-focus-visible:-translate-y-1.5">
          <Poster
            src={movie.Poster}
            title={movie.Title}
            width={400}
            className="size-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="absolute top-2.5 right-2.5">
            {loading ? (
              <span className="skeleton block h-6 w-12 rounded-full" />
            ) : rating ? (
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
                <StarIcon className="size-3.5 text-gold" />
                {rating}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 px-0.5">
          <h3 className="line-clamp-1 text-[15px] font-medium text-white/90 transition-colors group-hover:text-white">
            {movie.Title}
          </h3>
          <p className="mt-0.5 text-[13px] text-white/45">
            {movie.Year}
            <span className="mx-1.5 text-white/20">·</span>
            <span className="capitalize">{movie.Type}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

export function MovieCardSkeleton() {
  return (
    <li aria-hidden>
      <div className="skeleton aspect-[2/3] rounded-2xl" />
      <div className="skeleton mt-3 h-4 w-3/4 rounded" />
      <div className="skeleton mt-2 h-3 w-1/3 rounded" />
    </li>
  );
}
