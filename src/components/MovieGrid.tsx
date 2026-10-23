import type { ReactNode } from 'react';

export function MovieGrid({
  children,
  busy,
  className = 'md:grid-cols-4 lg:grid-cols-5',
}: {
  children: ReactNode;
  busy?: boolean;
  className?: string;
}) {
  return (
    <ul
      aria-busy={busy}
      className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:gap-x-6 ${className} lg:gap-y-10`}
    >
      {children}
    </ul>
  );
}
