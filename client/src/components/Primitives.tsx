import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

/**
 * Primitive Card component for dashboard screens.
 */
export function Card({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Primitive Button component: primary brand red, outline, or danger style.
 */
export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost' | 'dark';
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-extrabold rounded-xl transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed select-none text-sm';
  const variants = {
    primary:
      'bg-brand-600 hover:bg-brand-500 text-white shadow-md hover:shadow-lg py-3 px-5',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-3 px-5 shadow-xs',
    danger:
      'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-3 px-5',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 py-2.5 px-4',
    dark:
      'bg-slate-900 hover:bg-slate-800 text-white py-3 px-5 shadow-md',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/**
 * Primitive StatusPill component with strict red/white/navy/slate palette (no green).
 */
export function StatusPill({
  status,
  label,
  className = '',
}: {
  status: 'online' | 'offline' | 'busy' | 'pending' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
  label?: string;
  className?: string;
}) {
  const displayLabel = label || status.replace('_', ' ').toUpperCase();

  const styles: Record<typeof status, string> = {
    online: 'bg-blue-50 text-blue-700 border-blue-200',
    busy: 'bg-sky-50 text-sky-700 border-sky-200',
    offline: 'bg-slate-100 text-slate-600 border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    arriving: 'bg-brand-50 text-brand-600 border-brand-200',
    in_progress: 'bg-slate-900 text-white border-slate-800',
    completed: 'bg-slate-100 text-slate-800 border-slate-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-2xs ${styles[status]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{displayLabel}</span>
    </span>
  );
}
