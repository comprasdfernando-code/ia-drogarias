"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Search } from "lucide-react";

type Produto = {
  id: number;
  nome: string;
  preco: number;
  preco_normal?: number;
  validade?: string;
  categoria?: string;
  foto?: string;
};
export const dynamic = "force-dynamic";

export default function LojinhaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data } = await supabase
      .from("lojinha_produtos")
      .select("*")
      .order("id", { ascending: false });

    setProdutos(data || []);
  }

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.categoria || "").toLowerCase().includes(q)
    );
  }, [busca, produtos]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="relative h-[70vh] flex items-center justify-center">
        {/* imagem de fundo */}
        <Image
          src="/lojinha-bg.png" // coloque a imagem aqui (public/lojinha-bg.png)
          alt="Lojinha da Oportunidade"
          fill
          priority
          className="object-contain opacity-20"
        />
        <div className="absolute inset-0 bg-black/70" />

        {/* conteúdo */}
        <div className="relative z-10 max-w-3xl w-full px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-400 mb-6">
            Lojinha da Oportunidade 💛🖤
          </h1>

          {/* BUSCA */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produtos, categorias, ofertas..."
              className="w-full pl-12 pr-4 py-4 rounded-full bg-zinc-900 border border-yellow-400 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>
      </section>

      {/* LISTA */}
      <section className="px-6 py-10 max-w-7xl mx-auto">
        {filtrados.length === 0 ? (
          <p className="text-zinc-400 text-center">
            Nenhum produto encontrado.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {filtrados.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-900 rounded-xl border border-zinc-800 hover:border-yellow-400 transition"
              >
                <div className="relative h-40">
                  {p.foto && (
                    <Image
                      src={p.foto}
                      alt={p.nome}
                      fill
                      className="object-cover rounded-t-xl"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{p.nome}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold">
                      R$ {p.preco.toFixed(2)}
                    </span>
                    {p.preco_normal && p.preco_normal > 0 && (
                      <span className="text-zinc-500 line-through text-sm">
                        R$ {p.preco_normal.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {p.validade && (
                    <p className="text-xs text-zinc-400 mt-1">
                      Validade: {new Date(p.validade).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
