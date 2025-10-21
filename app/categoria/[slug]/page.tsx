"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CategoriaPage() {
  const { slug } = useParams();
  const [produtos, setProdutos] = useState<any[]>([]);

  useEffect(() => {
    // Aqui você pode filtrar produtos do Supabase ou de uma lista local
    // Por enquanto, só para teste:
    const produtosFake = [
      { nome: "Dipirona Genérico", preco: 12.9, categoria: "genericos" },
      { nome: "Vitamina C", preco: 19.9, categoria: "vitaminas" },
      { nome: "Creme Facial", preco: 35.0, categoria: "beleza" },
    ];

    const filtrados = produtosFake.filter((p) => p.categoria === slug);
    setProdutos(filtrados);
  }, [slug]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 capitalize">
        Categoria: {slug}
      </h1>

      {produtos.length === 0 ? (
        <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {produtos.map((p, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-lg p-4 text-center hover:shadow-lg transition"
            >
              <h2 className="font-semibold text-gray-800">{p.nome}</h2>
              <p className="text-blue-600 font-bold mt-2">R$ {p.preco.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}