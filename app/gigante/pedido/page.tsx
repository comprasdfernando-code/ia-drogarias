"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import ProdutoModal from "@/components/ProdutoModal";
import CarrinhoModal from "@/components/CarrinhoModal";

type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagem_url?: string | null;
};

type ItemCarrinho = Produto & {
  quantidade: number;
};

export default function PedidoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Produto | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  // 🔄 Carregar produtos
  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from("gigante_produtos")
        .select("id, nome, descricao, preco, imagem_url")
        .eq("ativo", true)
        .order("nome");

      setProdutos(data || []);
    }

    carregar();
  }, []);

  // 🔍 Busca
  const filtrados = useMemo(() => {
    return produtos.filter((p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase())
    );
  }, [busca, produtos]);

  // ➕ Adicionar ao carrinho
  function add(produto: Produto, qtd: number) {
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
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HERO */}
      <div className="relative h-[280px]">
        <Image
          src="/hero-assados.jpg" // coloque sua imagem aqui
          alt="Gigante dos Assados"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/55" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-3xl font-bold mb-4 text-center">
            🍖 Gigante dos Assados
          </h1>

          {/* BUSCA FLUTUANTE */}
          <input
            placeholder="Buscar espetinho, kit, combo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full max-w-md p-3 rounded-full text-black shadow-xl outline-none"
          />
        </div>

        {/* BOTÃO CARRINHO */}
        <button
          onClick={() => setCarrinhoAberto(true)}
          className="absolute top-4 right-4 bg-white rounded-full px-4 py-2 shadow font-bold"
        >
          🛒 {carrinho.length}
        </button>
      </div>

      {/* PRODUTOS */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtrados.map((p) => (
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
              <p className="text-red-600 font-bold mt-1">
                R$ {p.preco.toFixed(2)}
              </p>
            </div>
          </button>
        ))}
      </div>

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
