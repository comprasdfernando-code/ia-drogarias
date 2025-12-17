"use client";

export default function CarrinhoModal({ aberto, setAberto, carrinho }: any) {
  if (!aberto) return null;

  const total = carrinho.reduce(
    (s: number, i: any) => s + i.preco * i.quantidade,
    0
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
      <div className="bg-white w-80 h-full p-4">
        <h2 className="font-bold text-lg mb-4">🛒 Seu carrinho</h2>

        {carrinho.map((i: any) => (
          <div key={i.id} className="flex justify-between mb-2">
            <span>
              {i.quantidade}x {i.nome}
            </span>
            <span>R$ {(i.preco * i.quantidade).toFixed(2)}</span>
          </div>
        ))}

        <p className="font-bold mt-4">
          Total: R$ {total.toFixed(2)}
        </p>

        <button className="mt-4 w-full bg-green-600 text-white py-2 rounded">
          Finalizar pedido
        </button>

        <button
          onClick={() => setAberto(false)}
          className="mt-2 w-full text-sm text-gray-500"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
