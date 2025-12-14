"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, ShoppingCart, X, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  id: number;
  nome: string;
  preco: number;
  preco_normal?: number;
  validade?: string;
  categoria?: string;
  foto?: string;
};

export default function LojinhaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [produtoAtivo, setProdutoAtivo] = useState<Produto | null>(null);
  const [carrinho, setCarrinho] = useState<Produto[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
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

  function adicionarAoCarrinho(p: Produto) {
    setCarrinho((prev) => [...prev, p]);
    setProdutoAtivo(null);
    setCarrinhoAberto(true);
  }

  function removerItem(index: number) {
    setCarrinho((prev) => prev.filter((_, i) => i !== index));
  }

  const total = carrinho.reduce((sum, p) => sum + p.preco, 0);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 relative">

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center">
        <Image
          src="/lojinha-bg.png"
          alt="Lojinha da Oportunidade"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-white/75 backdrop-blur-sm" />

        <div className="relative z-10 w-full max-w-3xl px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-500 mb-6">
            Lojinha da Oportunidade 💛🖤
          </h1>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produtos, categorias, ofertas..."
              className="w-full pl-12 pr-4 py-4 rounded-full bg-white border border-yellow-400 shadow-lg focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* LISTA */}
      <section className="px-6 py-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {filtrados.map((p) => (
            <div
              key={p.id}
              onClick={() => setProdutoAtivo(p)}
              className="bg-white rounded-xl shadow cursor-pointer"
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

              <div className="p-3">
                <h3 className="text-sm font-semibold line-clamp-2">
                  {p.nome}
                </h3>
                <p className="text-yellow-500 font-bold">
                  R$ {p.preco.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL PRODUTO */}
      {produtoAtivo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-4">
            <button
              className="mb-2 text-zinc-500"
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

            <h2 className="font-bold">{produtoAtivo.nome}</h2>
            <p className="text-yellow-500 text-xl font-extrabold mt-2">
              R$ {produtoAtivo.preco.toFixed(2)}
            </p>

            <button
              onClick={() => adicionarAoCarrinho(produtoAtivo)}
              className="mt-4 w-full bg-yellow-400 text-black py-3 rounded-xl font-bold"
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      )}

      {/* BOTÃO CARRINHO */}
      {carrinho.length > 0 && (
        <button
          onClick={() => setCarrinhoAberto(true)}
          className="fixed bottom-5 right-5 z-40 bg-yellow-400 text-black rounded-full px-6 py-4 shadow-xl flex items-center gap-2 font-bold"
        >
          <ShoppingCart />
          {carrinho.length}
        </button>
      )}

      {/* BOTTOM SHEET CARRINHO */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Meu carrinho</h3>
              <button onClick={() => setCarrinhoAberto(false)}>
                <X />
              </button>
            </div>

            {carrinho.length === 0 ? (
              <p className="text-zinc-400 text-center">
                Carrinho vazio
              </p>
            ) : (
              <div className="space-y-3">
                {carrinho.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border-b pb-2"
                  >
                    {p.foto && (
                      <Image
                        src={p.foto}
                        alt={p.nome}
                        width={50}
                        height={50}
                        className="rounded"
                      />
                    )}

                    <div className="flex-1">
                      <p className="text-sm font-semibold">{p.nome}</p>
                      <p className="text-yellow-500 font-bold">
                        R$ {p.preco.toFixed(2)}
                      </p>
                    </div>

                    <button onClick={() => removerItem(i)}>
                      <Trash2 className="text-red-500" />
                    </button>
                  </div>
                ))}

                <div className="flex justify-between font-bold text-lg mt-4">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>

                <button className="w-full mt-4 bg-green-500 text-white py-3 rounded-xl font-bold">
                  Finalizar no WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
