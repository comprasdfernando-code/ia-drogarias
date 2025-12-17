"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProdutoModal({ produto, onClose, onAdd }: any) {
  const [qtd, setQtd] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-11/12 max-w-md overflow-hidden">
        {produto.imagem_url && (
          <Image
            src={produto.imagem_url}
            alt={produto.nome}
            width={400}
            height={300}
            className="object-cover"
          />
        )}

        <div className="p-4">
          <h2 className="text-xl font-bold">{produto.nome}</h2>
          <p className="text-gray-500">{produto.descricao}</p>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQtd(Math.max(1, qtd - 1))}
                className="w-8 h-8 rounded-full border"
              >
                −
              </button>
              <span>{qtd}</span>
              <button
                onClick={() => setQtd(qtd + 1)}
                className="w-8 h-8 rounded-full bg-red-600 text-white"
              >
                +
              </button>
            </div>

            <p className="font-bold text-red-600">
              R$ {(produto.preco * qtd).toFixed(2)}
            </p>
          </div>

          <button
            onClick={() => {
              onAdd(produto, qtd);
              onClose();
            }}
            className="mt-4 w-full bg-red-600 text-white py-2 rounded"
          >
            Adicionar ao carrinho
          </button>

          <button
            onClick={onClose}
            className="mt-2 w-full text-sm text-gray-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
