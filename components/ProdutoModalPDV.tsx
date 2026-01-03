"use client";

import { useMemo, useState } from "react";

type Produto = {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number; // para kg: PREÇO POR KG
  vendido_por?: "unidade" | "kg" | string;
};

export default function ProdutoModalPDV({
  produto,
  onClose,
  onAdd,
}: {
  produto: Produto;
  onClose: () => void;
  onAdd: (produto: Produto, quantidade: number) => void; // unidade OU kg (decimal)
}) {
  const isKg = String(produto.vendido_por || "unidade") === "kg";

  const [qtdUn, setQtdUn] = useState<number>(1);
  const [pesoTexto, setPesoTexto] = useState<string>(""); // "850" (g) ou "0,850" (kg)
  const [modoPeso, setModoPeso] = useState<"kg" | "g">("kg");

  function parsePesoKg(): number {
    const raw = (pesoTexto || "").trim();
    if (!raw) return 0;
    const n = Number(raw.replace(",", "."));
    if (Number.isNaN(n) || n <= 0) return 0;
    return modoPeso === "g" ? n / 1000 : n;
  }

  const subtotal = useMemo(() => {
    if (isKg) {
      const kg = parsePesoKg();
      return kg > 0 ? Number(produto.preco) * kg : 0;
    }
    return Number(produto.preco) * qtdUn;
  }, [isKg, produto.preco, qtdUn, pesoTexto, modoPeso]);

  function confirmar() {
    if (isKg) {
      const kg = parsePesoKg();
      if (!kg || kg <= 0) {
        alert("Informe o peso da balança.");
        return;
      }
      onAdd(produto, Number(kg.toFixed(3)));
      onClose();
      return;
    }

    onAdd(produto, Math.max(1, qtdUn));
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
              {isKg
                ? `R$ ${Number(produto.preco).toFixed(2)} / kg`
                : `R$ ${Number(produto.preco).toFixed(2)}`}
            </div>
          </div>

          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        <div className="mt-4">
          {!isKg ? (
            <div className="flex items-center justify-between">
              <span className="font-semibold">Quantidade</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQtdUn((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
                >
                  −
                </button>
                <div className="w-10 text-center font-bold">{qtdUn}</div>
                <button
                  onClick={() => setQtdUn((p) => p + 1)}
                  className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">Peso da balança</span>

                <div className="flex gap-1">
                  <button
                    onClick={() => setModoPeso("kg")}
                    className={`px-3 py-2 rounded border ${
                      modoPeso === "kg" ? "bg-black text-white" : "bg-white"
                    }`}
                  >
                    kg
                  </button>
                  <button
                    onClick={() => setModoPeso("g")}
                    className={`px-3 py-2 rounded border ${
                      modoPeso === "g" ? "bg-black text-white" : "bg-white"
                    }`}
                  >
                    g
                  </button>
                </div>
              </div>

              <input
                value={pesoTexto}
                onChange={(e) => setPesoTexto(e.target.value)}
                placeholder={modoPeso === "kg" ? "Ex: 0,850" : "Ex: 850"}
                className="w-full border p-3 rounded-xl"
              />

              <div className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                Exemplo: 850g = 0,850kg. O valor é calculado automaticamente.
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 border-t pt-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Subtotal</div>
            <div className="text-xl font-extrabold">R$ {subtotal.toFixed(2)}</div>
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
