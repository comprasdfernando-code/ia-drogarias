"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProdutoCard from "@/components/ProdutoCard";
import Carrinho from "@/components/Carrinho";

export default function PedidoPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [aberto, setAberto] = useState(false);

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

  function adicionar(produto: any) {
    setCarrinho([...carrinho, produto]);
    setAberto(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="p-4 bg-red-600 text-white text-xl font-bold">
        🍖 Gigante dos Assados
      </header>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {produtos.map((p) => (
          <ProdutoCard key={p.id} produto={p} onAdd={adicionar} />
        ))}
      </div>

      <Carrinho
        aberto={aberto}
        setAberto={setAberto}
        carrinho={carrinho}
      />
    </div>
  );
}
