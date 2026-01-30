// app/dayfestas/_components/SectionTitle.tsx
export default function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl">
      {kicker ? (
        <p className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 ring-black/10 bg-white/70">
          {kicker}
        </p>
      ) : null}
      <h2 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight text-[rgb(var(--brand-2))]">
  {title}
</h2>

      {subtitle ? <p className="mt-2 text-neutral-700">{subtitle}</p> : null}
    </div>
  );
}
