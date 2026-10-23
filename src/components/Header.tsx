import { Link } from 'react-router';
import { ReelIcon } from './Icons';
import { SearchBar } from './SearchBar';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink/65 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3.5 sm:gap-8 sm:px-8">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="Movie Explorer home">
          <ReelIcon className="size-7 text-gold transition-transform duration-700 group-hover:rotate-180" />
          <span className="hidden font-display text-2xl leading-none tracking-tight text-white sm:block">
            Movie <em className="text-gold-soft">Explorer</em>
          </span>
        </Link>
        <SearchBar />
      </div>
    </header>
  );
}
