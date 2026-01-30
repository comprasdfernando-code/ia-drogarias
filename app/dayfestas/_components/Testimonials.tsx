// app/dayfestas/_components/Testimonials.tsx
export default function Testimonials() {
  const items = [
    {
      name: "Cliente",
      text: "Ficou tudo perfeito! Os detalhes da papelaria fizeram toda diferença. Um capricho surreal ✨",
    },
    {
      name: "Cliente",
      text: "A mini festa ficou elegante e delicada. Todo mundo elogiou e as fotos ficaram lindas!",
    },
    {
      name: "Cliente",
      text: "Atendimento maravilhoso e resultado acima do esperado. Dá pra ver o carinho em cada item.",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {items.map((t, i) => (
        <div key={i} className="rounded-3xl bg-white ring-1 ring-black/10 p-5 shadow-sm">
          <p className="text-sm text-neutral-800 leading-relaxed">“{t.text}”</p>
          <p className="mt-4 text-xs text-neutral-600 font-semibold">{t.name}</p>
        </div>
      ))}
    </div>
  );
}
