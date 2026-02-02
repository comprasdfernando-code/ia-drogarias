"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartUI } from "./CartProvider";

export type Product = {
  id: string;
  nome: string;
  marca?: string | null;
  preco: number;
  estoque: number;
  foto_url?: string | null;
};

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartUI();

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if ((product.estoque ?? 0) <= 0) return;

    addItem({
      produto_id: product.id,
      nome: product.nome,
      preco_unit: Number(product.preco) || 0,
      quantidade: 1,
      foto_url: product.foto_url || null,
    });
  }

  return (
    <Link
      href={`/loja/glow10/produto/${product.id}`}
      className="group block rounded-2xl overflow-hidden bg-zinc-900/40 border border-white/10 hover:border-white/20 transition"
    >
      <div className="relative aspect-square bg-black/40">
        {product.foto_url ? (
          <Image src={product.foto_url} alt={product.nome} fill className="object-contain p-4" sizes="300px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">Sem imagem</div>
        )}
      </div>

      <div className="p-4 space-y-1">
        <div className="text-xs text-white/50 uppercase">{product.marca || " "}</div>
        <div className="text-white font-semibold leading-tight line-clamp-2">{product.nome}</div>
        <div className="text-lg font-bold text-white">{brl(product.preco)}</div>
        <div className="text-xs text-white/40">Estoque: {product.estoque}</div>

        <button
          onClick={handleAdd}
          disabled={(product.estoque ?? 0) <= 0}
          className="mt-3 w-full rounded-xl py-2 font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {(product.estoque ?? 0) > 0 ? "Adicionar ao carrinho" : "Sem estoque"}
        </button>
      </div>
    </Link>
  );
}
