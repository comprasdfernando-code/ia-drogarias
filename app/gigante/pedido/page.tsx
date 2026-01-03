"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import ProdutoModal from "@/components/ProdutoModal";
import CarrinhoModal from "@/components/CarrinhoModal";

type Produto = {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  imagem_url?: string | null;
};

type ItemCarrinho = Produto & { quantidade: number };

export default function PedidoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Produto | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔄 Carregar produtos
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setLoading(true);
      const { data, error } = await supabase
        .from("gigante_produtos")
        .select("id, nome, descricao, preco, imagem_url, vendido_por, ativo")
        .eq("ativo", true)
        .order("nome");

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar produtos:", error);
        setProdutos([]);
      } else {
        setProdutos((data as any) || []);
      }
      setLoading(false);
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  // 🔍 Busca (nome + descrição)
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return produtos;

    return produtos.filter((p) => {
      const nome = (p.nome || "").toLowerCase();
      const desc = (p.descricao || "").toLowerCase();
      return nome.includes(q) || desc.includes(q);
    });
  }, [busca, produtos]);

  // 🧮 Contadores do carrinho
  const qtdItens = useMemo(
    () => carrinho.reduce((s, i) => s + Number(i.quantidade || 0), 0),
    [carrinho]
  );

  const totalCarrinho = useMemo(
    () =>
      carrinho.reduce(
        (s, i) => s + Number(i.preco || 0) * Number(i.quantidade || 0),
        0
      ),
    [carrinho]
  );

  // ➕ Adicionar ao carrinho
  function add(produto: Produto, qtd: number) {
    if (!qtd || qtd <= 0) return;

    setCarrinho((prev) => {
      const existente = prev.find((i) => i.id === produto.id);
      if (existente) {
        return prev.map((i) =>
          i.id === produto.id
            ? { ...i, quantidade: i.quantidade + qtd }
            : i
        );
      }
      return [...prev, { ...produto, quantidade: qtd }];
    });

    // abre carrinho automaticamente após adicionar
    setCarrinhoAberto(true);
  }

  function abrirCarrinho() {
    setCarrinhoAberto(true);
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* HERO */}
      <div className="relative h-[280px]">
        <Image
          src="/hero-assados.jpg"
          alt="Gigante dos Assados"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/55" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-3xl font-bold mb-3 text-center">
            🍖 Gigante dos Assados
          </h1>

          {/* BUSCA FLUTUANTE */}
          <div className="w-full max-w-md">
            <input
              placeholder="Buscar espetinho, kit, combo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full p-3 rounded-full text-black shadow-xl outline-none"
            />
            <p className="text-xs text-white/80 mt-2 text-center">
              {loading
                ? "Carregando cardápio..."
                : `${filtrados.length} itens encontrados`}
            </p>
          </div>
        </div>

        {/* BOTÃO CARRINHO (topo) */}
        <button
          onClick={abrirCarrinho}
          className="absolute top-4 right-4 bg-white rounded-full px-4 py-2 shadow font-bold"
          aria-label="Abrir carrinho"
        >
          🛒 {qtdItens}
        </button>
      </div>

      {/* PRODUTOS */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {loading &&
          Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow overflow-hidden animate-pulse"
            >
              <div className="h-40 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}

        {!loading && filtrados.length === 0 && (
          <div className="col-span-full text-center text-gray-600 py-10">
            Nenhum item encontrado. Tente outra busca.
          </div>
        )}

        {!loading &&
          filtrados.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelecionado(p)}
              className="bg-white rounded-2xl shadow hover:scale-[1.02] transition overflow-hidden text-left"
            >
              {/* IMAGEM */}
              <div className="relative w-full h-40">
                <Image
                  src={p.imagem_url || "/produtos/placeholder.png"}
                  alt={p.nome}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>

              {/* INFO */}
              <div className="p-3">
                <h3 className="font-bold text-sm text-gray-800 line-clamp-2">
                  {p.nome}
                </h3>

                {p.descricao ? (
                  <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                    {p.descricao}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    Toque para ver detalhes
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <p className="text-red-600 font-bold">
                    R$ {Number(p.preco).toFixed(2)}
                  </p>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    + Add
                  </span>
                </div>
              </div>
            </button>
          ))}
      </div>

      {/* CTA FIXO (tipo iFood) */}
      <button
        onClick={abrirCarrinho}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-red-600 text-white py-3 rounded-full shadow-xl flex items-center justify-between px-5 z-50"
      >
        <span className="font-bold">
          {qtdItens > 0 ? "🛒 Ver carrinho" : "🛒 Começar pedido"}
        </span>
        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
          {qtdItens} itens • R$ {totalCarrinho.toFixed(2)}
        </span>
      </button>

      {/* MODAL PRODUTO */}
      {selecionado && (
        <ProdutoModal
          produto={selecionado}
          onClose={() => setSelecionado(null)}
          onAdd={add}
        />
      )}

      {/* MODAL CARRINHO */}
      <CarrinhoModal
        aberto={carrinhoAberto}
        setAberto={setCarrinhoAberto}
        carrinho={carrinho}
      />
    </div>
  );
}
