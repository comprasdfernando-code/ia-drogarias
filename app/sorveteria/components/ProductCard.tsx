"use client";

import Image from "next/image";
import { SorveteProduto } from "@/types/sorveteria";

type Props = {
  item: SorveteProduto;
  onAdd: (p: SorveteProduto) => void;
};

export default function ProductCard({ item, onAdd }: Props) {
  return (
    <div
      className="rounded-xl border border-neutral-200 p-3 hover:shadow-md transition bg-white flex flex-col"
      style={{ minHeight: 320 }}
    >
      <div className="relative w-full h-40 mb-3 bg-white/40 rounded-lg overflow-hidden">
        {item.imagem_url ? (
          // se a imagem for externa, use unoptimized para evitar erro de domínio
          <Image
            src={item.imagem_url}
            alt={item.nome}
            fill
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-sm text-neutral-400">
            sem imagem
          </div>
        )}
      </div>

      <div className="text-sm text-fuchsia-900/80 font-semibold">
        {item.linha}
      </div>
      <div className="text-base font-bold leading-tight">{item.nome}</div>
      {item.sabor && (
        <div className="text-sm text-neutral-600">{item.sabor}</div>
      )}

      <div className="mt-auto flex items-end justify-between">
        <div className="text-xl font-extrabold mt-2">
          R$ {item.preco.toFixed(2).replace(".", ",")}
        </div>
        <button
          onClick={() => onAdd(item)}
          className="px-3 py-2 text-sm rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}