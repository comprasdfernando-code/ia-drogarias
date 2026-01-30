// app/dayfestas/_components/Services.tsx
export default function Services() {
  const items = [
    { icon: "🎂", title: "Mini festa na mesa", desc: "Montagem encantadora, perfeita para fotos e momentos especiais." },
    { icon: "🎨", title: "Papelaria personalizada", desc: "Topos, tags, displays e detalhes finos com a identidade do tema." },
    { icon: "🎈", title: "Decoração temática", desc: "Composição elegante e harmoniosa, com toque premium." },
    { icon: "🎁", title: "Detalhes sob medida", desc: "Cada projeto pensado para a sua celebração ser única." },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((it) => (
        <div
          key={it.title}
          className="rounded-3xl bg-white ring-1 ring-black/10 p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-neutral-50 ring-1 ring-black/10 flex items-center justify-center text-xl">
              {it.icon}
            </div>
            <div>
              <p className="font-semibold">{it.title}</p>
              <p className="text-sm text-neutral-700 mt-1">{it.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
