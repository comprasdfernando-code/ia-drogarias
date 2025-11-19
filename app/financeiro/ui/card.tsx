import type { ReactNode } from "react";

export function FCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
      {children}
    </div>
  );
}

export function FCardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

export function FCardContent({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
