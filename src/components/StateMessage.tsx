import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

/** Shared layout for empty, not-found and error states. */
export function StateMessage({ icon, title, children, action }: Props) {
  return (
    <div
      role="status"
      className="mx-auto flex max-w-md animate-fade-up flex-col items-center py-20 text-center sm:py-28"
    >
      <div className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-gold">
        {icon}
      </div>
      <h2 className="mt-6 font-display text-4xl text-white">{title}</h2>
      {children && <p className="mt-3 text-[15px] leading-relaxed text-white/55">{children}</p>}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function Button({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-soft active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
