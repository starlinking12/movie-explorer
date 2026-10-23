import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getMovie, value } from '../api/omdb';
import type { MovieDetails } from '../api/types';
import { ArrowLeftIcon, FilmIcon, StarIcon } from '../components/Icons';
import { Poster } from '../components/Poster';
import { Button, StateMessage } from '../components/StateMessage';
import { useAsync } from '../hooks/useAsync';
import { posterAt } from '../lib/poster';

export function MoviePage() {
  const { id = '' } = useParams();
  const { state, retry } = useAsync((signal) => getMovie(id, signal), [id]);

  return (
    <article className="relative">
      {state.status === 'success' && <Backdrop poster={state.data.Poster} />}
      <div className="relative mx-auto max-w-7xl px-5 pt-6 pb-10 sm:px-8 sm:pt-10">
        <BackButton />
        {state.status === 'loading' && <DetailsSkeleton />}
        {state.status === 'error' && (
          <StateMessage
            icon={<FilmIcon className="size-7" />}
            title={state.error.kind === 'not-found' ? 'Movie not found' : 'Intermission'}
            action={state.error.kind !== 'not-found' ? <Button onClick={retry}>Try again</Button> : undefined}
          >
            {state.error.message}
          </StateMessage>
        )}
        {state.status === 'success' && <Details movie={state.data} />}
      </div>
    </article>
  );
}

/** The poster, blown up and blurred, becomes a cinematic backdrop for the page. */
function Backdrop({ poster }: { poster: string }) {
  const url = posterAt(poster, 300);
  if (!url) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[780px] overflow-hidden">
      <img
        src={url}
        alt=""
        onLoad={(e) => e.currentTarget.classList.replace('opacity-0', 'opacity-45')}
        className="size-full scale-125 object-cover opacity-0 blur-3xl saturate-150 transition-opacity duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/70 to-ink" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-ink/60" />
    </div>
  );
}

function BackButton() {
  const navigate = useNavigate();
  // Go back in history when we came from the results (keeps the list and scroll position).
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));
  return (
    <button
      type="button"
      onClick={goBack}
      className="group mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/75 backdrop-blur-md transition hover:border-white/20 hover:text-white sm:mb-12"
    >
      <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
      Back
    </button>
  );
}

function Details({ movie }: { movie: MovieDetails }) {
  const genres = value(movie.Genre)?.split(', ') ?? [];
  const cast = value(movie.Actors)?.split(', ') ?? [];
  const meta = [value(movie.Year), value(movie.Rated), value(movie.Runtime)].filter(Boolean);
  const otherRatings = movie.Ratings.filter((r) => r.Source !== 'Internet Movie Database');

  const credits: Array<[string, string | undefined]> = [
    ['Director', value(movie.Director)],
    ['Writer', value(movie.Writer)],
    ['Released', value(movie.Released)],
    ['Language', value(movie.Language)],
    ['Country', value(movie.Country)],
    ['Box office', value(movie.BoxOffice)],
    ['Awards', value(movie.Awards)],
  ];

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,340px)_1fr] md:gap-14 lg:gap-20">
      <div className="mx-auto w-full max-w-[300px] animate-fade-up md:mx-0 md:max-w-none">
        <div className="overflow-hidden rounded-3xl shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
          <Poster src={movie.Poster} title={movie.Title} width={800} eager className="aspect-[2/3] w-full" />
        </div>
      </div>

      <div className="min-w-0 animate-fade-up" style={{ animationDelay: '90ms' }}>
        {genres.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Genres">
            {genres.map((g) => (
              <li
                key={g}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-white/70"
              >
                {g}
              </li>
            ))}
          </ul>
        )}

        <h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-tight text-balance text-white sm:text-7xl">
          {movie.Title}
        </h1>
        {meta.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center gap-x-3 text-[15px] text-white/55">
            {meta.map((m, i) => (
              <span key={m} className="flex items-center gap-3">
                {i > 0 && <span className="text-white/20">•</span>}
                {m}
              </span>
            ))}
            {movie.Type !== 'movie' && <span className="capitalize text-white/55">• {movie.Type}</span>}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-stretch gap-3">
          {value(movie.imdbRating) && (
            <div className="flex items-center gap-3 rounded-2xl border border-gold/25 bg-gold/[0.08] px-5 py-3.5">
              <StarIcon className="size-7 text-gold" />
              <div>
                <p className="text-2xl leading-none font-semibold text-white">
                  {movie.imdbRating}
                  <span className="text-sm font-normal text-white/40"> / 10</span>
                </p>
                <p className="mt-1 text-xs text-white/50">
                  IMDb{value(movie.imdbVotes) ? ` · ${movie.imdbVotes} votes` : ''}
                </p>
              </div>
            </div>
          )}
          {otherRatings.map((r) => (
            <div key={r.Source} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5">
              <p className="text-2xl leading-none font-semibold text-white">{r.Value}</p>
              <p className="mt-1 text-xs text-white/50">
                {r.Source === 'Rotten Tomatoes' ? 'Rotten Tomatoes' : r.Source}
              </p>
            </div>
          ))}
        </div>

        {value(movie.Plot) && (
          <section className="mt-10">
            <h2 className="text-xs font-medium tracking-[0.2em] text-gold/80 uppercase">Story</h2>
            <Plot text={movie.Plot} />
          </section>
        )}

        {cast.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-medium tracking-[0.2em] text-gold/80 uppercase">Cast</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {cast.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pr-4 pl-1.5"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-gold/70 to-ember/70 text-xs font-semibold text-ink">
                    {initials(name)}
                  </span>
                  <span className="text-sm text-white/85">{name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <dl className="mt-10 grid gap-x-10 gap-y-5 border-t border-white/[0.08] pt-8 sm:grid-cols-2">
          {credits
            .filter(([, v]) => v)
            .map(([label, v]) => (
              <div key={label}>
                <dt className="text-xs tracking-wide text-white/40">{label}</dt>
                <dd className="mt-1 text-[15px] leading-relaxed text-white/80">{v}</dd>
              </div>
            ))}
        </dl>
      </div>
    </div>
  );
}

function Plot({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 420;
  return (
    <>
      <p
        id="plot"
        className={`mt-3 max-w-2xl text-[17px] leading-[1.75] text-pretty text-white/75 ${long && !open ? 'line-clamp-5' : ''}`}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls="plot"
          onClick={() => setOpen((o) => !o)}
          className="mt-2 rounded text-sm font-medium text-gold hover:text-gold-soft"
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function DetailsSkeleton() {
  return (
    <div aria-busy className="grid gap-10 md:grid-cols-[minmax(0,340px)_1fr] md:gap-14 lg:gap-20">
      <div className="skeleton mx-auto aspect-[2/3] w-full max-w-[300px] rounded-3xl md:max-w-none" />
      <div>
        <div className="flex gap-2">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
        <div className="skeleton mt-6 h-14 w-4/5 rounded-xl" />
        <div className="skeleton mt-4 h-4 w-48 rounded" />
        <div className="skeleton mt-8 h-16 w-44 rounded-2xl" />
        <div className="mt-10 space-y-3">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-11/12 rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
      </div>
    </div>
  );
}
