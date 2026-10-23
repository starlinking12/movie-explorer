import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { CloseIcon, SearchIcon } from './Icons';

/**
 * The search box in the sticky header.
 * Typing is debounced, then written to the URL (?q=) — the URL is the single source of truth,
 * so results are shareable, refresh-safe, and the Back button restores them.
 */
export function SearchBar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const urlQuery = pathname === '/' ? (params.get('q') ?? '') : null;

  const [text, setText] = useState(urlQuery ?? '');
  const typed = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebouncedValue(text, 350);

  // Keep the box in sync when the URL changes (Back/Forward, suggestion chips).
  useEffect(() => {
    if (urlQuery !== null && !typed.current) setText(urlQuery);
  }, [urlQuery]);

  // Push the debounced text to the URL, but only after the user actually typed.
  useEffect(() => {
    if (!typed.current) return;
    typed.current = false;
    const q = debounced.trim();
    if (q === (urlQuery ?? '').trim() && pathname === '/') return;
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/', { replace: pathname === '/' });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // "/" focuses search from anywhere, like on GitHub or YouTube.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const update = (value: string) => {
    typed.current = true;
    setText(value);
  };

  return (
    <form
      role="search"
      className="relative flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        const q = text.trim();
        if (q) navigate(`/?q=${encodeURIComponent(q)}`);
        inputRef.current?.blur();
      }}
    >
      <label htmlFor="search" className="sr-only">
        Search movies by title
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-white/40" />
      <input
        ref={inputRef}
        id="search"
        type="search"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search for a movie…"
        value={text}
        onChange={(e) => update(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && update('')}
        className="h-11 w-full appearance-none rounded-full border border-white/10 bg-white/[0.05] pr-20 pl-11 text-[15px] text-white placeholder:text-white/35 transition-[background-color,border-color,box-shadow] duration-300 hover:border-white/15 focus:border-gold/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgb(233_180_90/0.12)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {text ? (
        <button
          type="button"
          onClick={() => {
            update('');
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Clear search"
        >
          <CloseIcon className="size-4" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-white/10 px-2 py-0.5 font-sans text-xs text-white/35 sm:block">
          /
        </kbd>
      )}
    </form>
  );
}
