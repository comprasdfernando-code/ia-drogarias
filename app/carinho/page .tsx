"use client";

export default function CarrinhoPage() {
  // Itens de exemplo no carrinho (por enquanto estático)
  const itens = [
    {
      nome: "Dipirona Sódica 500mg",
      preco: 12.9,
      quantidade: 2,
    },
    {
      nome: "Paracetamol 750mg",
      preco: 9.5,
      quantidade: 1,
    },
  ];

  const total = itens.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  return (
    <div className="flex flex-col items-center justify-center flex-grow p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Carrinho de Compras
      </h1>

      {itens.length === 0 ? (
        <p className="text-gray-600">Seu carrinho está vazio.</p>
      ) : (
        <div className="w-full max-w-3xl space-y-4">
          {itens.map((item, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">{item.nome}</h2>
                <p className="text-gray-600">
                  {item.quantidade}x R$ {item.preco.toFixed(2)}
                </p>
              </div>
              <span className="font-bold text-gray-800">
                R$ {(item.preco * item.quantidade).toFixed(2)}
              </span>
            </div>
          ))}

          {/* Total */}
          <div className="bg-gray-100 p-4 rounded-lg shadow flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-xl font-bold text-green-600">
              R$ {total.toFixed(2)}
            </span>
          </div>

          {/* Botão finalizar */}
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg shadow hover:bg-blue-700 transition text-lg font-semibold">
            Finalizar Pedido
          </button>
        </div>
      )}
    </div>
  );
}
