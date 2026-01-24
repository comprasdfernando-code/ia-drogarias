"use client";

import Image from "next/image";
import { useCart } from "./CartContext";

type Produto = {
  id: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  preco: number;
  estoque: number;
  imagem_url?: string | null;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProductCard({ p }: { p: Produto }) {
  const cart = useCart();

  const semEstoque = Number(p.estoque) <= 0;

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="relative w-full aspect-[4/3] bg-gray-50">
        {p.imagem_url ? (
          <Image src={p.imagem_url} alt={p.nome} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sem imagem
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="text-sm text-gray-500">{p.categoria || "Produto"}</div>
        <div className="font-semibold text-gray-900 leading-tight">{p.nome}</div>

        {p.descricao ? (
          <div className="text-sm text-gray-600 mt-1 line-clamp-2">{p.descricao}</div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="font-bold text-gray-900">{brl(Number(p.preco || 0))}</div>

          <button
            disabled={semEstoque}
            onClick={() =>
              cart.add({
                produto_id: p.id,
                nome: p.nome,
                preco: Number(p.preco || 0),
                imagem_url: p.imagem_url ?? null,
              })
            }
            className={[
              "px-4 py-2 rounded-xl text-sm font-semibold",
              semEstoque
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:opacity-90",
            ].join(" ")}
          >
            {semEstoque ? "Sem estoque" : "Adicionar"}
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Estoque: <span className="font-semibold">{p.estoque}</span>
        </div>
      </div>
    </div>
  );
}
