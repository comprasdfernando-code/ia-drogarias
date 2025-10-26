"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ProdutoPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [produto, setProduto] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
  async function fetchProduto() {
    setCarregando(true);

    // 🧹 Corrige e normaliza o slug recebido
    const cleanSlug = String(slug)
      .replace(/^[-\s]+|[-\s]+$/g, "") // remove traços e espaços no início/fim
      .trim()
      .toLowerCase();

    // 🧠 Tenta buscar de forma mais flexível
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .filter("slug", "ilike", `%${cleanSlug}%`)
      .limit(1)
      .single();

    if (error || !data) {
      console.warn("Produto não encontrado, tentando alternativa...");
      // Tenta buscar por ID se o slug for só número
      if (/^\d+$/.test(cleanSlug)) {
        const { data: byId } = await supabase
          .from("produtos")
          .select("*")
          .eq("id", cleanSlug)
          .single();
        if (byId) setProduto(byId);
      } else {
        setProduto(null);
      }
    } else {
      setProduto(data);
    }

    setCarregando(false);
  }

  if (slug) fetchProduto();
}, [slug]);

  if (carregando)
    return (
      <div className="text-center text-gray-500 py-20 text-lg">
        Carregando produto...
      </div>
    );

  if (!produto)
    return (
      <div className="text-center text-red-600 py-20 text-lg">
        Produto não encontrado 😕
      </div>
    );

  const mensagem = encodeURIComponent(
    `💊 Olá! Tenho interesse no produto ${produto.nome} (R$ ${produto.preco_venda?.toFixed(
      2
    )}). Pode confirmar a disponibilidade pra mim?`
  );

  const whatsapp = `https://wa.me/5511948343725?text=${mensagem}`;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div className="bg-white shadow-lg rounded-xl p-6 text-center">
        {/* 🖼️ Imagem do produto */}
        <Image
          src={produto.imagem || "/no-image.png"}
          alt={produto.nome}
          width={300}
          height={300}
          className="mx-auto mb-4 rounded-md object-contain"
        />

        {/* 🧾 Informações */}
        <h1 className="text-2xl font-bold text-blue-700 mb-2">
          {produto.nome}
        </h1>
        <p className="text-gray-600 mb-3">
          {produto.descricao || "Produto sem descrição detalhada."}
        </p>

        {/* 📦 Estoque e preços */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-6">
          <div className="text-sm text-gray-700">
            <p>
              <strong>Estoque:</strong>{" "}
              <span className="text-green-600 font-semibold">
                {produto.estoque || 0}
              </span>
            </p>
          </div>
          <div className="text-sm text-gray-700">
            <p>
              <strong>Preço de venda:</strong>{" "}
              <span className="text-blue-700 font-bold">
                R$ {Number(produto.preco_venda || 0).toFixed(2)}
              </span>
            </p>
          </div>
          <div className="text-sm text-gray-700">
            <p>
              <strong>Preço de custo:</strong>{" "}
              <span className="text-gray-500">
                R$ {Number(produto.preco_custo || 0).toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {/* 🛒 Botões */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => {
              // salva produto no carrinho
              const carrinhoAtual =
                JSON.parse(localStorage.getItem("carrinhoFabiano") || "[]") || [];
              const existente = carrinhoAtual.find(
                (p: any) => p.id === produto.id
              );
              let atualizado;

              if (existente) {
                atualizado = carrinhoAtual.map((p: any) =>
                  p.id === produto.id ? { ...p, quantidade: p.quantidade + 1 } : p
                );
              } else {
                atualizado = [...carrinhoAtual, { ...produto, quantidade: 1 }];
              }

              localStorage.setItem(
                "carrinhoFabiano",
                JSON.stringify(atualizado)
              );
              router.push("/drogarias/drogariaredefabiano/carrinho");
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-md transition"
          >
            🛒 Comprar Agora
          </button>

          <Link
            href="/drogarias/drogariaredefabiano"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-5 rounded-md transition"
          >
            ⬅️ Continuar Comprando
          </Link>

          <a
            href={whatsapp}
            target="_blank"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md transition"
          >
            💬 Falar no WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}