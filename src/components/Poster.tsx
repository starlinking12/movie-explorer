import { useState } from 'react';
import { posterAt } from '../lib/poster';
import { FilmIcon } from './Icons';

interface Props {
  src: string;
  title: string;
  width?: number;
  className?: string;
  eager?: boolean;
}

/** A poster that fades in when loaded and falls back to a styled placeholder when OMDb has none. */
export function Poster({ src, title, width = 400, className = '', eager = false }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const url = useOriginal ? src : posterAt(src, width);

  if (!url || failed) {
    return (
      <div
        role="img"
        aria-label={`No poster available for ${title}`}
        className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-ink-3 to-ink-2 p-4 text-center ${className}`}
      >
        <FilmIcon className="size-8 text-white/20" />
        <span className="line-clamp-3 font-display text-lg leading-tight text-white/50">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`Poster for ${title}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      // If the resized variant doesn't exist, fall back to OMDb's original URL before giving up.
      onError={() => (useOriginal ? setFailed(true) : setUseOriginal(true))}
      className={`bg-ink-3 object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}
