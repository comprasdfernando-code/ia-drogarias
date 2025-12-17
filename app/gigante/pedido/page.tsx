"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import ProdutoModal from "../../../components/ProdutoModal";
import CarrinhoModal from "@/components/CarrinhoModal";

type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagem_url?: string;
};

type ItemCarrinho = Produto & { quantidade: number };

export default function PedidoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Produto | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  useEffect(() => {
    supabase
      .from("gigante_produtos")
      .select("*")
      .eq("ativo", true)
      .then(({ data }) => setProdutos(data || []));
  }, []);

  const filtrados = useMemo(
    () =>
      produtos.filter((p) =>
        p.nome.toLowerCase().includes(busca.toLowerCase())
      ),
    [busca, produtos]
  );

  function add(produto: Produto, qtd: number) {
    setCarrinho((prev) => {
      const item = prev.find((i) => i.id === produto.id);
      if (item) {
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
    <div className="bg-gray-100 min-h-screen">
      {/* HERO */}
      <div className="relative h-[280px]">
        <Image
          src="/hero-assados.jpg" // coloque uma imagem bonita aqui
          alt="Gigante dos Assados"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <h1 className="text-3xl font-bold mb-4">
            🍖 Gigante dos Assados
          </h1>

          {/* BUSCA FLUTUANTE */}
          <input
            placeholder="Buscar espetinho, kit, combo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-11/12 max-w-md p-3 rounded-full text-black shadow-xl"
          />
        </div>

        {/* CARRINHO ICON */}
        <button
          onClick={() => setCarrinhoAberto(true)}
          className="absolute top-4 right-4 bg-white rounded-full p-3 shadow"
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
            className="bg-white rounded-xl shadow hover:scale-[1.02] transition"
          >
            {p.imagem_url && (
              <Image
                src={p.imagem_url}
                alt={p.nome}
                width={300}
                height={200}
                className="rounded-t-xl object-cover"
              />
            )}
            <div className="p-2 text-left">
              <h3 className="font-bold text-sm">{p.nome}</h3>
              <p className="text-red-600 font-bold">
                R$ {p.preco.toFixed(2)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* MODAIS */}
      {selecionado && (
        <ProdutoModal
          produto={selecionado}
          onClose={() => setSelecionado(null)}
          onAdd={add}
        />
      )}

      <CarrinhoModal
        aberto={carrinhoAberto}
        setAberto={setCarrinhoAberto}
        carrinho={carrinho}
      />
    </div>
  );
}
