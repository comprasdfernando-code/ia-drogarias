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
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<any[]>([]); // 🛒 novo estado do carrinho
  const [mensagemAdd, setMensagemAdd] = useState(""); // 💬 feedback visual

  // ✅ 1. Carregar carrinho existente ao abrir a pagina
  useEffect(() => {
    const salvo = localStorage.getItem("carrinho-rede-fabiano");
    if (salvo) {
      setCarrinho(JSON.parse(salvo));
    }
  }, []);

  useEffect(() => {
    async function fetchProduto() {
      setCarregando(true);

      const cleanSlug = decodeURIComponent(slug.toString().trim());

      let { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("slug", cleanSlug)
        .single();

      if (!data && !error) {
        const { data: dataById } = await supabase
          .from("produtos")
          .select("*")
          .eq("id", cleanSlug)
          .single();
        data = dataById;
      }

      if (error || !data) {
        console.warn("Produto nao encontrado.");
        setProduto(null);
      } else {
        setProduto(data);
      }

      setCarregando(false);
    }

    if (slug) fetchProduto();
  }, [slug]);

  // 🧠 Busca por texto
const handleBuscar = (e: React.FormEvent) => {
  e.preventDefault();

  if (busca.trim()) {
    const destino = `/drogarias/drogariaredefabiano?busca=${encodeURIComponent(busca)}`;
    router.push(destino); // redireciona via Next.js
    router.refresh(); // 🔁 força recarregar a nova rota (corrige cache)
  }
};

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

  // ✅ 2. Função de adicionar ao carrinho (agora sem sair da página)
  function adicionarAoCarrinho(produto: any) {
    const carrinhoAtual =
      JSON.parse(localStorage.getItem("carrinho-rede-fabiano") || "[]");

    const existente = carrinhoAtual.find((p: any) => p.id === produto.id);
    let atualizado;

    if (existente) {
      atualizado = carrinhoAtual.map((p: any) =>
        p.id === produto.id ? { ...p, quantidade: p.quantidade + 1 } : p
      );
    } else {
      atualizado = [...carrinhoAtual, { ...produto, quantidade: 1 }];
    }

    localStorage.setItem("carrinho-rede-fabiano", JSON.stringify(atualizado));
    setCarrinho(atualizado);

    // 💬 Feedback visual (dura 2s e some)
    setMensagemAdd("✅ Produto adicionado ao carrinho!");
    setTimeout(() => setMensagemAdd(""), 2000);
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 relative">
      {/* 🔍 Barra de busca */}
      <form
        onSubmit={handleBuscar}
        className="flex items-center bg-white shadow-md rounded-md mb-6 border"
      >
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-grow px-4 py-2 rounded-l-md outline-none"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
        >
          🔍
        </button>
      </form>

      {/* 🧾 Card do produto */}
      <div className="bg-white shadow-lg rounded-xl p-6 text-center relative">
        <Image
          src={produto.imagem || "/no-image.png"}
          alt={produto.nome}
          width={300}
          height={300}
          className="mx-auto mb-4 rounded-md object-contain"
        />

        <h1 className="text-2xl font-bold text-blue-700 mb-2">
          {produto.nome}
        </h1>

        <p className="text-gray-600 mb-3">
          {produto.descricao || "Produto sem descrição detalhada."}
        </p>

        <div className="text-sm text-gray-700 mb-6">
          <p>
            <strong>Preço:</strong>{" "}
            <span className="text-blue-700 font-bold">
              R$ {Number(produto.preco_venda || 0).toFixed(2)}
            </span>
          </p>
        </div>

        {/* 🛒 Botões */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => adicionarAoCarrinho(produto)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-md transition"
          >
            🛒 Adicionar ao Carrinho
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

        {/* ✅ Mensagem de confirmação flutuante */}
        {mensagemAdd && (
          <div className="absolute top-3 right-3 bg-green-600 text-white text-sm px-4 py-2 rounded shadow-md animate-fade">
            {mensagemAdd}
          </div>
        )}
      </div>
    </main>
  );
}