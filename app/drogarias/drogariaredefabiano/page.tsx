"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// 🔌 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ⚙️ Constantes
const LOJA = "drogariaredefabiano";
const CARRINHO_KEY = "carrinhoFabiano";

// 🧩 Tipos
type Produto = {
  id: string;
  nome: string;
  preco_venda: number;
  estoque: number;
  imagem?: string;
  categoria?: string;
};

type ItemCarrinho = Produto & { quantidade: number };

// 📸 Imagem helper
function imgUrl(src?: string) {
  if (!src) return "/produtos/caixa-padrao.png";
  return src.startsWith("http")
    ? src
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public${src}`;
}

// 🔥 Promoções (mock)
const promocoes = [
  {
    id: 1,
    nome: "Amoxicilina 500mg",
    preco: "R$ 9,99",
    imagem: "/promocoes/amoxicilina.png",
  },
  {
    id: 2,
    nome: "Dipirona 500mg",
    preco: "R$ 4,99",
    imagem: "/promocoes/dipirona.png",
  },
  {
    id: 3,
    nome: "Vitamina C",
    preco: "R$ 12,90",
    imagem: "/promocoes/vitamina-c.png",
  },
];

export default function DrogariaRedeFabianoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  // 🔄 Produtos
  useEffect(() => {
    async function carregarProdutos() {
      const { data } = await supabase
        .from("produtos")
        .select("id,nome,preco_venda,estoque,imagem,categoria")
        .eq("loja", LOJA)
        .eq("disponivel", true)
        .gt("estoque", 0)
        .order("nome");

      setProdutos(data || []);
      setCarregando(false);
    }
    carregarProdutos();
  }, []);

  // 🛒 Carrinho — leitura
  useEffect(() => {
    const salvo = localStorage.getItem(CARRINHO_KEY);
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, []);

  // 🛒 Carrinho — gravação
  useEffect(() => {
    localStorage.setItem(CARRINHO_KEY, JSON.stringify(carrinho));
  }, [carrinho]);

  function adicionarAoCarrinho(produto: Produto) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id);
      if (existe) {
        return prev.map((i) =>
          i.id === produto.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  }

  const produtosFiltrados = useMemo(
    () =>
      produtos.filter((p) =>
        p.nome.toLowerCase().includes(busca.toLowerCase())
      ),
    [produtos, busca]
  );

  function fmt(n: number) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      {/* HERO */}
      <section className="relative h-[320px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/banners/hero-drogaria-rede-fabiano.png')",
          }}
        />
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-extrabold text-blue-700">
            Drogaria Rede Fabiano
          </h1>
          <p className="text-gray-600 mt-2">
            Saúde, confiança e economia perto de você
          </p>
        </div>
      </section>

      {/* HEADER BUSCA + CARRINHO */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar medicamentos, marcas ou categorias..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <span className="text-blue-600 font-bold">🔍</span>
          </div>

          <Link
            href="/drogarias/drogariaredefabiano/carrinho"
            className="relative"
          >
            <span className="text-2xl">🛒</span>
            {totalItens > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItens}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* PROMOÇÕES */}
      <section className="max-w-6xl mx-auto px-4 mt-8">
        <h2 className="font-semibold text-lg mb-3">
          🔥 Promoções da Semana
        </h2>

        <Slider
          infinite
          speed={500}
          slidesToShow={3}
          slidesToScroll={1}
          responsive={[
            { breakpoint: 1024, settings: { slidesToShow: 3 } },
            { breakpoint: 768, settings: { slidesToShow: 2 } },
            { breakpoint: 480, settings: { slidesToShow: 1 } },
          ]}
        >
          {promocoes.map((p) => (
            <div key={p.id} className="px-2">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <img
                  src={p.imagem}
                  alt={p.nome}
                  className="h-32 mx-auto object-contain mb-2"
                />
                <div className="text-sm font-medium">{p.nome}</div>
                <div className="text-green-600 font-bold">{p.preco}</div>
              </div>
            </div>
          ))}
        </Slider>
      </section>

      {/* PRODUTOS */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {carregando
          ? "Carregando produtos..."
          : produtosFiltrados.map((p) => (
              <div key={p.id} className="bg-white rounded shadow p-3">
                <Image
                  src={imgUrl(p.imagem)}
                  alt={p.nome}
                  width={150}
                  height={150}
                  className="mx-auto h-32 object-contain"
                />
                <div className="text-sm font-medium mt-2 line-clamp-2">
                  {p.nome}
                </div>
                <div className="text-green-600 font-bold">
                  R$ {fmt(p.preco_venda)}
                </div>
                <button
                  onClick={() => adicionarAoCarrinho(p)}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded"
                >
                  Adicionar
                </button>
              </div>
            ))}
      </section>
    </main>
  );
}
