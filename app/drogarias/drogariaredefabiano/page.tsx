"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

// 🔌 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DrogariaRedeFabianoPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  // Carregar produtos
  useEffect(() => {
    async function carregarProdutos() {
      setCarregando(true);
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("loja", "drogariaredefabiano")
        .eq("disponivel", true)
        .order("nome", { ascending: true });

      if (error) console.error("❌ Erro ao carregar produtos:", error);
      else setProdutos(data || []);

      setCarregando(false);
    }
    carregarProdutos();
  }, []);

  // Carrinho (local)
  const adicionarAoCarrinho = (produto: any) => {
    setCarrinho((prev) => {
      const existente = prev.find((i) => i.id === produto.id);
      if (existente) {
        return prev.map((i) =>
          i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  };

  // Filtro por busca
  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // Limitar vitrine inicial
  const produtosVisiveis = mostrarTodos ? produtosFiltrados : produtosFiltrados.slice(0, 9);

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      {/* 🔵 Faixa interna da página (NÃO substitui o header global) */}
      <section className="w-full bg-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Barra de busca 100% width */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white rounded-lg px-3 py-2 w-full">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="flex-1 text-gray-700 outline-none text-sm"
              />
              <span className="text-blue-700 font-bold">🔍</span>
            </div>

            {/* Carrinho + 3 pontinhos ⋮ */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="text-white text-2xl cursor-pointer">🛒</span>
                {carrinho.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {carrinho.length}
                  </span>
                )}
              </div>

              <button
                aria-label="Abrir menu"
                className="text-white text-2xl leading-none px-2"
                onClick={() => setMenuAberto(true)}
                title="Menu"
              >
                ⋮
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 🩵 Banner principal abaixo da faixa */}
      <section className="relative w-full">
        <img
          src="/banners/banner-rede-fabiano-faixa.jpg"
          alt="Drogaria Rede Fabiano"
          className="w-full h-36 sm:h-48 md:h-56 object-cover shadow-md"
        />
      </section>

      {/* 📱 Menu lateral (abre com os três pontinhos) */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-blue-700 text-white shadow-2xl transform ${
          menuAberto ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-500 z-50`}
      >
        <div className="p-6 flex flex-col gap-4">
          <div
            className="text-right text-2xl cursor-pointer"
            onClick={() => setMenuAberto(false)}
          >
            ✖
          </div>
          <h2 className="text-lg font-semibold mb-4 border-b border-blue-400 pb-2">
            Menu
          </h2>
          <button className="text-left hover:text-blue-200">🏠 Início</button>
          <button className="text-left hover:text-blue-200">💊 Meus Pedidos</button>
          <button className="text-left hover:text-blue-200">👤 Meu Perfil</button>
          <button className="text-left hover:text-blue-200">📦 Entregas</button>
          <button className="text-left hover:text-blue-200">📞 Contato</button>
        </div>
      </div>

      {/* 🧩 Produtos */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {carregando ? (
          <p className="text-center text-gray-500">Carregando produtos...</p>
        ) : produtosFiltrados.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum produto encontrado.</p>
        ) : (
          <>
            {/* grid: 3 no celular, 4 no md, 5 no lg */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
              {produtosVisiveis.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg shadow p-2 sm:p-3 text-center hover:shadow-lg transition flex flex-col justify-between"
                >
                  <Image
                    src="/produtos/caixa-padrao.png"}
                    alt={p.nome || "Produto"}
                    width={150}
                    height={150}
                    className="mx-auto rounded shadow-sm"
/>
                  <h2 className="font-medium text-blue-800 mt-2 text-[12px] sm:text-sm line-clamp-2">
                    {p.nome}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-500">{p.categoria}</p>
                  <p className="text-sm sm:text-base font-bold text-green-600 mt-1">
                    R$ {Number(p.preco_venda).toFixed(2)}
                  </p>

                  <button
                    onClick={() => adicionarAoCarrinho(p)}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-md text-xs sm:text-sm font-medium transition"
                  >
                    Adicionar
                  </button>
                </div>
              ))}
            </div>

            {/* Ver mais / Ver menos */}
            {produtosFiltrados.length > 9 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setMostrarTodos(!mostrarTodos)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition font-medium text-sm"
                >
                  {mostrarTodos ? "Ver menos ▲" : "Ver mais ▼"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}