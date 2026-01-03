"use client";

import { useEffect, useState } from "react";

type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagem_url?: string | null;
  vendido_por?: "unidade" | "kg" | string;
};

export default function ProdutoModal({
  produto,
  onClose,
  onAdd,
}: {
  produto: Produto;
  onClose: () => void;
  onAdd: (produto: Produto, quantidade: number) => void; // sempre unidade
}) {
  const [qtd, setQtd] = useState<number>(1);

  useEffect(() => {
    setQtd(1);
  }, [produto?.id]);

  function confirmar() {
    onAdd(produto, Math.max(1, qtd));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3">
      <div className="bg-white w-full max-w-md rounded-2xl p-4 shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-extrabold text-lg">{produto.nome}</div>
            {produto.descricao && (
              <div className="text-sm text-gray-600 mt-1">{produto.descricao}</div>
            )}
            <div className="mt-2 font-bold text-red-600">
              R$ {Number(produto.preco).toFixed(2)}
            </div>
          </div>

          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Quantidade</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQtd((p) => Math.max(1, p - 1))}
                className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                −
              </button>
              <div className="w-10 text-center font-bold">{qtd}</div>
              <button
                onClick={() => setQtd((p) => p + 1)}
                className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t pt-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Subtotal</div>
            <div className="text-xl font-extrabold">
              R$ {(Number(produto.preco) * qtd).toFixed(2)}
            </div>
          </div>

          <button
            onClick={confirmar}
            className="px-4 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
