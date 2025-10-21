"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../../lib/supabaseClient";

export default function CategoriaPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carrinho, setCarrinho] = useState<any[]>([]);

  // 🔹 Cores do banner por categoria
  const cores = {
    genericos: "bg-yellow-500",
    vitaminas: "bg-green-500",
    beleza: "bg-pink-500",
    natural: "bg-teal-500",
    infantil: "bg-blue-500",
    promocoes: "bg-purple-500",
  };

  const cor = cores[slug as keyof typeof cores] || "bg-blue-500";

  // 🔹 Buscar produtos da categoria
  useEffect(() => {
    async function carregarProdutos() {
      setCarregando(true);
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .ilike("categoria", `%${slug}%`)
        .order("nome", { ascending: true });

      if (error) console.error("Erro ao carregar produtos:", error);
      else setProdutos(data || []);
      setCarregando(false);
    }

    if (slug) carregarProdutos();
  }, [slug]);

  // 🔹 Adicionar ao carrinho
  function adicionarAoCarrinho(produto: any) {
    setCarrinho((prev) => [...prev, produto]);
    alert(`${produto.nome} adicionado ao carrinho! 🛒`);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 🔹 Banner da categoria */}
      <div className={`${cor} text-white text-center py-8 shadow-md relative`}>
        {/* Botão Voltar */}
        <button
          onClick={() => router.push("/")}
          className="absolute left-4 top-4 bg-white text-blue-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-100 transition-all"
        >
          ← Voltar
        </button>

        <h1 className="text-3xl font-bold">
          Categoria: {`slug.charAt(0).toUpperCase() + slug.slice(1)`}
        </h1>
        <p className="text-sm mt-2 opacity-90">
          Confira os melhores produtos desta categoria
        </p>
      </div>

      {/* 🔹 Lista de produtos */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {carregando ? (
          <p className="text-center text-gray-600 py-20">
            Carregando produtos...
          </p>
        ) : produtos.length === 0 ? (
          <p className="text-center text-gray-600 py-20">
            Nenhum produto encontrado nesta categoria.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {produtos.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg p-4 shadow hover:shadow-xl transition-all text-center border border-gray-100"
              >
                <Image
                  src={p.imagem || "/sem-imagem.png"}
                  width={150}
                  height={150}
                  alt={p.nome}
                  className="mx-auto mb-3 rounded-md object-contain"
                />
                <h3 className="font-semibold text-gray-700 text-sm mb-1 line-clamp-2">
                  {p.nome}
                </h3>
                <p className="text-blue-700 font-bold text-sm mb-3">
                  R$ {Number(p.preco_venda || 0).toFixed(2)}
                </p>

                {/* Botão Adicionar */}
                <button
                  onClick={() => adicionarAoCarrinho(p)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-all"
                >
                  Adicionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}