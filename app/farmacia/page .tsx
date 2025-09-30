"use client";

export default function FarmaciaPage() {
  const produtos = [
    {
      nome: "Dipirona Sódica 500mg",
      preco: "R$ 12,90",
    },
    {
      nome: "Paracetamol 750mg",
      preco: "R$ 9,50",
    },
    {
      nome: "Amoxicilina 500mg",
      preco: "R$ 24,90",
    },
    {
      nome: "Vitamina C 1g",
      preco: "R$ 18,00",
    },
    {
      nome: "Omeprazol 20mg",
      preco: "R$ 15,90",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center flex-grow p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Farmácia Virtual
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
        {produtos.map((produto, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {produto.nome}
              </h2>
              <p className="text-gray-700 mb-4">{produto.preco}</p>
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
              Adicionar ao Carrinho
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
