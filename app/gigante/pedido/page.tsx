"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ProdutoCard from "@/components/ProdutoCard";
import Carrinho from "@/components/Carrinho";

// Tipagem básica (opcional, mas recomendado)
type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagem_url?: string;
  categoria?: string;
};

export default function PedidoPage() {
  const router = useRouter();

  const [liberado, setLiberado] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<Produto[]>([]);
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔐 Proteção da rota + verificação de cadastro
  useEffect(() => {
    async function verificarAcesso() {
      // 1️⃣ Verifica login
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        router.push("/gigante/login");
        return;
      }

      // 2️⃣ Verifica cadastro do cliente
      const { data: cliente, error } = await supabase
        .from("gigante_clientes")
        .select("id")
        .eq("id", auth.user.id)
        .single();

      if (error || !cliente) {
        router.push("/gigante/completar-cadastro");
        return;
      }

      // 3️⃣ Tudo certo → carrega produtos
      await carregarProdutos();
      setLiberado(true);
      setLoading(false);
    }

    verificarAcesso();
  }, [router]);

  // 📦 Carregar produtos ativos
  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("gigante_produtos")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (!error && data) {
      setProdutos(data);
    }
  }

  // ➕ Adicionar ao carrinho
  function adicionar(produto: Produto) {
    setCarrinho((prev) => [...prev, produto]);
    setAberto(true);
  }

  // ⏳ Enquanto verifica acesso
  if (loading || !liberado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Verificando acesso...</p>
      </div>
    );
  }

  // ✅ Página liberada
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="p-4 bg-red-600 text-white text-xl font-bold">
        🍖 Gigante dos Assados
      </header>

      {/* LISTA DE PRODUTOS */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {produtos.length === 0 && (
          <p className="text-gray-500 col-span-full">
            Nenhum produto disponível no momento.
          </p>
        )}

        {produtos.map((produto) => (
          <ProdutoCard
            key={produto.id}
            produto={produto}
            onAdd={adicionar}
          />
        ))}
      </div>

      {/* CARRINHO */}
      <Carrinho
        aberto={aberto}
        setAberto={setAberto}
        carrinho={carrinho}
      />
    </div>
  );
}
