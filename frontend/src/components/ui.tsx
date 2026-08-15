import type { ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-violet-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`surface ${className}`}>{children}</section>;
}
export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500">
      <LoaderCircle className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}
export function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
export function ScoreRing({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  return (
    <div
      className={`${size === 'lg' ? 'h-28 w-28 text-3xl' : 'h-14 w-14 text-base'} grid shrink-0 place-items-center rounded-full font-bold text-violet-700`}
      style={{
        background: `radial-gradient(closest-side,#fff 76%,transparent 77% 99%),conic-gradient(#7c3aed ${score}%,#ede9fe 0)`,
      }}
    >
      {score}%
    </div>
  );
}
