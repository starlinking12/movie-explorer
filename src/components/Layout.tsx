import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { Header } from './Header';

export function Layout() {
  const location = useLocation();
  return (
    <div className="grain relative flex min-h-dvh flex-col">
      {/* Ambient light behind everything. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-ember/10 blur-[120px]" />
      </div>

      <Header />

      {/* Keying by path replays the page-in animation on every route change. */}
      <main key={location.pathname} className="flex-1 animate-page-in">
        <Outlet />
      </main>

      <footer className="mx-auto w-full max-w-7xl px-5 py-10 text-xs text-white/35 sm:px-8">
        Movie data from the{' '}
        <a
          className="underline decoration-white/20 underline-offset-4 hover:text-white/70"
          href="https://www.omdbapi.com/"
        >
          OMDb API
        </a>
        . Built with React, TypeScript and Tailwind CSS.
      </footer>
      <ScrollRestoration />
    </div>
  );
}
