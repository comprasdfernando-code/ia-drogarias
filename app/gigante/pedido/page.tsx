"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProdutoCard from "@/components/ProdutoCard";
import Carrinho from "@/components/Carrinho";

type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagem_url?: string;
};

export default function PedidoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<Produto[]>([]);
  const [aberto, setAberto] = useState(false);

  // 🧾 Dados do cliente (temporário, sem login)
  const [tipoEntrega, setTipoEntrega] = useState<"retirada" | "entrega">(
    "retirada"
  );
  const [cliente, setCliente] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  });

  const frete = tipoEntrega === "entrega" ? 5 : 0;

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data } = await supabase
      .from("gigante_produtos")
      .select("*")
      .eq("ativo", true);

    setProdutos(data || []);
  }

  function adicionar(produto: Produto) {
    setCarrinho((prev) => [...prev, produto]);
    setAberto(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="p-4 bg-red-600 text-white text-xl font-bold">
        🍖 Gigante dos Assados
      </header>

      {/* PRODUTOS */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {produtos.map((p) => (
          <ProdutoCard key={p.id} produto={p} onAdd={adicionar} />
        ))}
      </div>

      {/* CHECKOUT SIMPLES */}
      {carrinho.length > 0 && (
        <div className="p-4 bg-white shadow mt-4">
          <h2 className="font-bold mb-2">Finalizar pedido</h2>

          {/* ENTREGA OU RETIRADA */}
          <div className="flex gap-4 mb-3">
            <button
              onClick={() => setTipoEntrega("retirada")}
              className={`px-3 py-1 rounded ${
                tipoEntrega === "retirada"
                  ? "bg-red-600 text-white"
                  : "border"
              }`}
            >
              Retirada
            </button>

            <button
              onClick={() => setTipoEntrega("entrega")}
              className={`px-3 py-1 rounded ${
                tipoEntrega === "entrega"
                  ? "bg-red-600 text-white"
                  : "border"
              }`}
            >
              Entrega
            </button>
          </div>

          {/* DADOS DO CLIENTE */}
          {tipoEntrega === "entrega" && (
            <div className="space-y-2 mb-3">
              <input
                placeholder="Nome"
                className="w-full border p-2 rounded"
                onChange={(e) =>
                  setCliente({ ...cliente, nome: e.target.value })
                }
              />

              <input
                placeholder="WhatsApp"
                className="w-full border p-2 rounded"
                onChange={(e) =>
                  setCliente({ ...cliente, telefone: e.target.value })
                }
              />

              <input
                placeholder="Endereço"
                className="w-full border p-2 rounded"
                onChange={(e) =>
                  setCliente({ ...cliente, endereco: e.target.value })
                }
              />
            </div>
          )}

          {/* TOTAL */}
          <p className="font-bold">
            Total: R$
            {(
              carrinho.reduce((s, i) => s + i.preco, 0) + frete
            ).toFixed(2)}
          </p>

          {/* FINALIZAR */}
          <a
            href={`https://wa.me/55SEUNUMERO?text=${encodeURIComponent(
              `🛒 Pedido - Gigante dos Assados\n\n` +
                carrinho.map((i) => `• ${i.nome}`).join("\n") +
                `\n\nEntrega: ${tipoEntrega}` +
                `\nFrete: R$ ${frete.toFixed(2)}` +
                `\nTotal: R$ ${(
                  carrinho.reduce((s, i) => s + i.preco, 0) + frete
                ).toFixed(2)}`
            )}`}
            className="block mt-3 bg-green-600 text-white text-center py-2 rounded"
            target="_blank"
          >
            Finalizar no WhatsApp
          </a>
        </div>
      )}

      {/* CARRINHO */}
      <Carrinho
        aberto={aberto}
        setAberto={setAberto}
        carrinho={carrinho}
      />
    </div>
  );
}
