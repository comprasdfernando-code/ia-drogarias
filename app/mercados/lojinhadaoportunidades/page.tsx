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
  const [produtoAtivo, setProdutoAtivo] = useState<Produto | null>(null);
  const [carrinho, setCarrinho] = useState<Produto[]>([]);



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
  function abrirProduto(p: Produto) {
  setProdutoAtivo(p);
}


  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.categoria || "").toLowerCase().includes(q)
    );
  }, [busca, produtos]);

  function adicionarAoCarrinho(p: Produto) {
  setCarrinho((prev) => [...prev, p]);
  setProdutoAtivo(null);
}
{carrinho.length > 0 && (
  <button className="fixed bottom-4 right-4 z-40 bg-yellow-400 text-black rounded-full px-5 py-3 shadow-xl">
    🛒 {carrinho.length}
  </button>
)}


  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
  {/* Fundo */}
  <Image
    src="/lojinha-bg.png"
    alt="Lojinha da Oportunidade"
    fill
    priority
    className="object-cover"
  />

  {/* Overlay leve (para leitura) */}
  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />

  {/* Conteúdo */}
  <div className="relative z-10 max-w-3xl w-full px-6 text-center">
    <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-500 mb-6 drop-shadow">
      Lojinha da Oportunidade 
    </h1>

    {/* Busca (mantém a sua) */}
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produtos, categorias, ofertas..."
        className="w-full pl-12 pr-4 py-4 rounded-full bg-white border border-yellow-400 text-zinc-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">

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
{produtoAtivo && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center">
    <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl p-4 animate-slide-up">
      <button
        className="text-zinc-500 mb-2"
        onClick={() => setProdutoAtivo(null)}
      >
        Fechar ✕
      </button>

      <div className="relative h-48 mb-4">
        <Image
          src={produtoAtivo.foto!}
          alt={produtoAtivo.nome}
          fill
          className="object-contain"
        />
      </div>

      <h2 className="font-bold text-lg">{produtoAtivo.nome}</h2>

      <p className="text-yellow-500 text-xl font-extrabold mt-2">
        R$ {produtoAtivo.preco.toFixed(2)}
      </p>

      <button
        className="mt-4 w-full bg-yellow-400 text-black py-3 rounded-xl font-bold"
        onClick={() => adicionarAoCarrinho(produtoAtivo)}
      >
        Adicionar ao carrinho
      </button>
    </div>
  </div>
)}

    </div>
  );
}
