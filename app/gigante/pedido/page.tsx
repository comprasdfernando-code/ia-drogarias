"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

const VALOR_POR_KM = 2.5;

type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagem_url?: string;
  destaque?: boolean;
};

type ItemCarrinho = Produto & {
  quantidade: number;
};

export default function PedidoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const [tipoEntrega, setTipoEntrega] = useState<"retirada" | "entrega">(
    "retirada"
  );
  const [km, setKm] = useState<number>(0);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data } = await supabase
      .from("gigante_produtos")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    setProdutos(data || []);
  }

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase())
    );
  }, [busca, produtos]);

  const destaques = produtos.filter((p) => p.destaque);

  function add(produto: Produto) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id);
      if (existe) {
        return prev.map((i) =>
          i.id === produto.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  }

  function remove(produto: Produto) {
    setCarrinho((prev) =>
      prev
        .map((i) =>
          i.id === produto.id
            ? { ...i, quantidade: i.quantidade - 1 }
            : i
        )
        .filter((i) => i.quantidade > 0)
    );
  }

  const subtotal = carrinho.reduce(
    (s, i) => s + i.preco * i.quantidade,
    0
  );

  const frete =
    tipoEntrega === "entrega" ? km * VALOR_POR_KM : 0;

  const total = subtotal + frete;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* HEADER */}
      <header className="sticky top-0 bg-red-600 p-4 text-white z-10">
        <h1 className="font-bold text-lg">🍖 Gigante dos Assados</h1>
        <input
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="mt-2 w-full p-2 rounded text-black"
        />
      </header>

      {/* CARROSSEL */}
      {destaques.length > 0 && (
        <div className="p-4">
          <h2 className="font-bold mb-2">🔥 Ofertas & Kits</h2>
          <div className="flex gap-3 overflow-x-auto">
            {destaques.map((p) => (
              <div
                key={p.id}
                className="min-w-[200px] bg-white rounded shadow p-2"
              >
                {p.imagem_url && (
                  <Image
                    src={p.imagem_url}
                    alt={p.nome}
                    width={200}
                    height={120}
                    className="rounded"
                  />
                )}
                <h3 className="font-bold text-sm">{p.nome}</h3>
                <p className="text-red-600 font-bold">
                  R$ {p.preco.toFixed(2)}
                </p>
                <button
                  onClick={() => add(p)}
                  className="mt-1 w-full bg-red-600 text-white rounded py-1"
                >
                  Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUTOS */}
      <div className="p-4 space-y-3">
        {produtosFiltrados.map((p) => {
          const item = carrinho.find((i) => i.id === p.id);

          return (
            <div
              key={p.id}
              className="bg-white rounded shadow p-3 flex gap-3 items-center"
            >
              {p.imagem_url && (
                <Image
                  src={p.imagem_url}
                  alt={p.nome}
                  width={80}
                  height={80}
                  className="rounded"
                />
              )}

              <div className="flex-1">
                <h3 className="font-bold">{p.nome}</h3>
                <p className="text-sm text-gray-500">{p.descricao}</p>
                <p className="font-bold text-red-600">
                  R$ {p.preco.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {item && (
                  <button
                    onClick={() => remove(p)}
                    className="w-8 h-8 rounded-full border"
                  >
                    −
                  </button>
                )}

                <span className="w-5 text-center">
                  {item?.quantidade || 0}
                </span>

                <button
                  onClick={() => add(p)}
                  className="w-8 h-8 rounded-full bg-red-600 text-white"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHECKOUT */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setTipoEntrega("retirada")}
              className={`flex-1 py-1 rounded ${
                tipoEntrega === "retirada"
                  ? "bg-red-600 text-white"
                  : "border"
              }`}
            >
              Retirada
            </button>

            <button
              onClick={() => setTipoEntrega("entrega")}
              className={`flex-1 py-1 rounded ${
                tipoEntrega === "entrega"
                  ? "bg-red-600 text-white"
                  : "border"
              }`}
            >
              Entrega
            </button>
          </div>

          {tipoEntrega === "entrega" && (
            <input
              type="number"
              placeholder="Distância em KM"
              value={km}
              onChange={(e) => setKm(Number(e.target.value))}
              className="w-full border p-2 rounded mb-2"
            />
          )}

          <p>Subtotal: R$ {subtotal.toFixed(2)}</p>
          <p>Frete: R$ {frete.toFixed(2)}</p>
          <p className="font-bold">
            Total: R$ {total.toFixed(2)}
          </p>

          <a
            href={`https://wa.me/55SEUNUMERO?text=${encodeURIComponent(
              carrinho
                .map(
                  (i) =>
                    `${i.quantidade}x ${i.nome} - R$ ${(
                      i.preco * i.quantidade
                    ).toFixed(2)}`
                )
                .join("\n") +
                `\n\nEntrega: ${tipoEntrega}` +
                `\nKM: ${km}` +
                `\nFrete: R$ ${frete.toFixed(2)}` +
                `\nTotal: R$ ${total.toFixed(2)}`
            )}`}
            target="_blank"
            className="block mt-2 bg-green-600 text-white text-center py-2 rounded"
          >
            Finalizar no WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
