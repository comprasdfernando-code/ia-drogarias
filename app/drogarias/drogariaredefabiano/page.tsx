"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

// ✅ Lê as variáveis do .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DrogariaRedeFabianoPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarProdutos() {
      setCarregando(true);
      console.log("🧩 Iniciando conexão com Supabase...");
      console.log("🔗 URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("🔑 KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 15) + "...");

      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("loja","drogariaredefabiano")
        .eq("disponivel", true)
        .order("nome", { ascending: true });

      if (error) {
        console.error("❌ Erro ao carregar produtos:", error);
      } else {
        console.log(`✅ ${data?.length || 0} produtos retornados`);
        setProdutos(data || []);
      }

      setCarregando(false);
    }

    carregarProdutos();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-blue-700 text-center mb-8 flex justify-center items-center gap-2">
        Drogaria Rede Fabiano 💊
      </h1>

      {carregando ? (
        <p className="text-center text-gray-500">Carregando produtos...</p>
      ) : produtos.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {produtos.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition"
            >
              <Image
                src={p.imagem || "/no-image.png"}
                alt={p.nome}
                width={150}
                height={150}
                className="mx-auto rounded"
              />
              <h2 className="font-semibold text-blue-800 mt-2 text-sm">{p.nome}</h2>
              <p className="text-sm text-gray-500">{p.categoria}</p>
              <p className="text-lg font-bold text-green-600 mt-1">
                R$ {Number(p.preco_venda).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
