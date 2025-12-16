"use client";

import Image from "next/image";

type ItemCarrinho = {
  id: string;
  nome: string;
  preco_venda: number;
  quantidade: number;
  imagem?: string;
};

type Props = {
  carrinho: ItemCarrinho[];
  setCarrinho: (c: ItemCarrinho[]) => void;
  onClose: () => void;
  onFinalizar: () => void;
};

export default function ModalCarrinho({
  carrinho,
  setCarrinho,
  onClose,
  onFinalizar,
}: Props) {
  const total = carrinho.reduce(
    (acc, i) => acc + i.preco_venda * i.quantidade,
    0
  );

  function alterarQtd(id: string, delta: number) {
    const atualizado = carrinho.map((i) =>
      i.id === id
        ? { ...i, quantidade: Math.max(1, i.quantidade + delta) }
        : i
    );
    setCarrinho(atualizado);
    localStorage.setItem("carrinhoFabiano", JSON.stringify(atualizado));
  }

  function remover(id: string) {
    const atualizado = carrinho.filter((i) => i.id !== id);
    setCarrinho(atualizado);
    localStorage.setItem("carrinhoFabiano", JSON.stringify(atualizado));
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center">
      <div className="bg-white w-[95%] max-w-md rounded-xl shadow-xl p-4 relative">
        <h2 className="text-xl font-bold text-blue-700 text-center mb-4">
          🛒 Seu Carrinho
        </h2>

        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-xl text-gray-400"
        >
          ✕
        </button>

        {carrinho.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            Seu carrinho está vazio
          </p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {carrinho.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 border rounded-lg p-2"
              >
                <Image
                  src={p.imagem || "/produtos/caixa-padrao.png"}
                  alt={p.nome}
                  width={60}
                  height={60}
                  className="rounded object-contain"
                />

                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800">
                    {p.nome}
                  </p>
                  <p className="text-green-600 font-bold text-sm">
                    R$ {p.preco_venda.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alterarQtd(p.id, -1)}
                    className="px-2 bg-gray-200 rounded"
                  >
                    -
                  </button>
                  <span>{p.quantidade}</span>
                  <button
                    onClick={() => alterarQtd(p.id, 1)}
                    className="px-2 bg-gray-200 rounded"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => remover(p.id)}
                  className="text-red-500 text-sm"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t mt-4 pt-3 text-right">
          <p className="font-bold text-lg text-blue-700">
            Total: R$ {total.toFixed(2)}
          </p>

          <button
            onClick={onFinalizar}
            disabled={carrinho.length === 0}
            className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-semibold disabled:opacity-50"
          >
            ✅ Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
