const servicos = [
  { nome: "Alongamento em Gel", preco: "R$ 150" },
  { nome: "Fibra de Vidro", preco: "R$ 180" },
  { nome: "Blindagem", preco: "R$ 90" },
  { nome: "Manutenção", preco: "R$ 100" },
];

export default function Servicos() {
  return (
    <section className="py-16 px-4">
      <h2 className="text-2xl text-center mb-8 text-yellow-400">
        Serviços
      </h2>

      <div className="grid gap-4 max-w-md mx-auto">
        {servicos.map((s, i) => (
          <div
            key={i}
            className="bg-zinc-900 p-4 rounded-xl flex justify-between"
          >
            <span>{s.nome}</span>
            <span>{s.preco}</span>
          </div>
        ))}
      </div>
    </section>
  );
}