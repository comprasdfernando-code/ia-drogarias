"use client";

type Produto = {
  id: string;
  nome: string;
  marca: string | null;
  categoria: string | null;
  foto_url: string | null;
  preco: number;
  preco_promocional: number | null;
  promo_ativa: boolean;
  quantidade: number;
  ativo: boolean;
};

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProductCard({ p }: { p: Produto }) {
  const precoFinal = p.promo_ativa && p.preco_promocional ? p.preco_promocional : p.preco;

  return (
    <div className="group rounded-3xl bg-white/5 ring-1 ring-white/10 overflow-hidden hover:ring-white/20 transition">
      <div className="aspect-square bg-white/10 flex items-center justify-center overflow-hidden">
        {p.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.foto_url} alt={p.nome} className="h-full w-full object-cover group-hover:scale-[1.02] transition" />
        ) : (
          <span className="text-white/60 text-sm">Sem foto</span>
        )}
      </div>

      <div className="p-3">
        <div className="text-xs text-white/60">{p.marca || "Premium"}</div>
        <div className="mt-1 font-medium leading-snug line-clamp-2">{p.nome}</div>

        <div className="mt-2 flex items-end gap-2">
          <div className="text-lg font-semibold">{brl(precoFinal)}</div>
          {p.promo_ativa && p.preco_promocional ? (
            <div className="text-xs text-white/50 line-through">{brl(p.preco)}</div>
          ) : null}
        </div>

        <div className="mt-1 text-xs text-white/60">
          Estoque: <span className={p.quantidade > 0 ? "text-white" : "text-red-300"}>{p.quantidade}</span>
        </div>
      </div>
    </div>
  );
}
