"use client";

type Card = {
  label: string;
  value: string | number;
  hint?: string;
};

export default function ResumoCards({ cards }: { cards: Card[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="text-sm font-medium text-slate-500">{card.label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {card.value}
          </div>
          {card.hint ? (
            <div className="mt-1 text-xs text-slate-500">{card.hint}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}