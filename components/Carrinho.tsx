export default function Carrinho({ aberto, setAberto, carrinho }: any) {
  if (!aberto) return null;

  const total = carrinho.reduce((s: number, i: any) => s + i.preco, 0);

  const mensagem = encodeURIComponent(
    carrinho.map((i: any) => `• ${i.nome}`).join("\n") +
      `\n\nTotal: R$ ${total.toFixed(2)}`
  );

  return (
    <div className="fixed right-0 top-0 w-80 h-full bg-white shadow-xl p-4">
      <h2 className="font-bold text-lg mb-4">🛒 Seu pedido</h2>

      <ul className="space-y-2">
        {carrinho.map((i: any, idx: number) => (
          <li key={idx} className="text-sm">
            {i.nome} — R$ {i.preco.toFixed(2)}
          </li>
        ))}
      </ul>

      <div className="mt-4 font-bold">
        Total: R$ {total.toFixed(2)}
      </div>

      <a
        href={`https://wa.me/55SEUNUMERO?text=${mensagem}`}
        target="_blank"
        className="block mt-4 bg-green-600 text-white text-center py-2 rounded"
      >
        Finalizar no WhatsApp
      </a>

      <button
        onClick={() => setAberto(false)}
        className="mt-2 w-full text-sm text-gray-500"
      >
        Fechar
      </button>
    </div>
  );
}
