// app/dayfestas/_components/HowItWorks.tsx
export default function HowItWorks() {
  const steps = [
    { n: "1", title: "Você escolhe o tema", desc: "Me conte a ideia, data e o estilo da festa." },
    { n: "2", title: "Criação com carinho", desc: "Montamos a proposta e os detalhes personalizados." },
    { n: "3", title: "Entrega e encanto", desc: "Você recebe tudo pronto para viver um momento inesquecível." },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {steps.map((s) => (
        <div key={s.n} className="rounded-3xl bg-white ring-1 ring-black/10 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center font-semibold">
              {s.n}
            </div>
            <p className="font-semibold">{s.title}</p>
          </div>
          <p className="text-sm text-neutral-700 mt-3">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}
