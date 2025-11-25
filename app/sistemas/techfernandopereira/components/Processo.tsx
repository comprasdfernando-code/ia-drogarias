const etapas = [
  "1. Conversa inicial — entender o negócio",
  "2. Planejamento da solução",
  "3. Desenvolvimento do sistema/site",
  "4. Testes e aprovação",
  "5. Ajustes finais",
  "6. Entrega e suporte"
];

export default function Processo() {
  return (
    <section className="w-full py-24 px-6 bg-[#05070A]">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-10">
          Meu processo de trabalho
        </h2>

        <ul className="text-gray-300 grid gap-3 text-lg">
          {etapas.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
