"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔹 Conexão com Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CategoriaPage() {
  const { slug } = useParams();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarProdutos() {
      setCarregando(true);

      // 🔹 Busca os produtos da categoria clicada
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .ilike('categoria', `%${slug}%`);

      if (error) {
        console.error("Erro ao carregar produtos:", error);
      } else {
        setProdutos(data || []);
      }

      setCarregando(false);
    }

    carregarProdutos();
  }, [slug]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 capitalize">
        Categoria: {slug}
      </h1>

      {carregando ? (
        <p className="text-gray-500 text-center">Carregando produtos...</p>
      ) : produtos.length === 0 ? (
        <p className="text-gray-500 text-center">
          Nenhum produto encontrado nesta categoria.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {produtos.map((p) => (
            <div
              key={p.id}
              className="bg-white shadow-md rounded-lg p-4 text-center hover:shadow-lg transition"
            >
              {p.imagem && (
                <img
                  src={p.imagem}
                  alt={p.nome}
                  className="w-24 h-24 object-contain mx-auto mb-3"
                />
              )}
              <h2 className="font-semibold text-gray-800">{p.nome}</h2>
              <p className="text-blue-600 font-bold mt-2">
                R$ {Number(p.preco_venda || 0).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}