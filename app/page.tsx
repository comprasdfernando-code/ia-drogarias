"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ModalFinalizar from "../components/ModalFinalizar";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";



const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;


const LOJA = "drogariaredefabiano";
const WHATSAPP = "5511948343725";
const PIX_CHAVE = "CNPJ 62157257000109";

type Produto = {
  id: string;
  nome: string;
  categoria?: string;
  preco_venda: number;
  estoque: number;
  imagem?: string;
  disponivel?: boolean;
};

type ItemCarrinho = Produto & { quantidade: number };

type Cliente = {
  nome: string;
  telefone: string;
  endereco: string;
  bairro?: string;
  complemento?: string;
};

function imgUrl(src?: string) {
  if (!src || src.trim() === "") return "/produtos/caixa-padrao.png";
  return src.startsWith("http")
    ? src
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public${src}`;
}

export default function HomePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const router = useRouter();
  const [visiveis, setVisiveis] = useState(20);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("carrinho-home");
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, []);
  useEffect(() => {
    localStorage.setItem("carrinho-home", JSON.stringify(carrinho));
  }, [carrinho]);

  // 🔄 Carregar produtos (da view unificada)
  useEffect(() => {
  async function carregarProdutos() {
    try {
      setCarregando(true);
      // 🔹 busca todos os produtos visíveis (estoque 0 ou não)
      const { data, error } = await supabase
        .from("vw_disponibilidade_geral") // usa a view principal
        .select("*")
        .eq("disponivel", true);

      if (error) throw error;
      setProdutos(data || []);
    } catch (e) {
      console.error("❌ Erro ao carregar produtos:", e);
    } finally {
      setCarregando(false);
    }
  }
  carregarProdutos();
}, []);


  const produtosFiltrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return produtos;
    return produtos.filter((p) => p.nome?.toLowerCase().includes(t));
  }, [produtos, busca]);

  function fmt(n: number) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  function adicionarAoCarrinho(produto: Produto) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id);
      if (existe) {
        return prev.map((i) =>
          i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
    setCarrinhoAberto(true);
  }

  const total = useMemo(
    () =>
      carrinho.reduce(
        (acc, i) => acc + Number(i.preco_venda || 0) * Number(i.quantidade || 0),
        0
      ),
    [carrinho]
  );

  // 🖼️ Carrossel
  const slider = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
  };

  const banners = [
    { src: "/banners/servicos-farmaceuticos.png", link: "/servicos" },
    { src: "/banners/cadastro-drogaria.png", link: "/cadastro-drogaria" },
    { src: "/banners/ecommerce.png", link: "/drogarias/drogariaredefabiano" },
    { src: "/banners/cadastro-farmaceutico.png", link: "/cadastro-farmaceutico" },
    { src: "/banners/fraldas pom pom.png", link: "/drogarias/drogariaredefabiano" },
    { src: "/banners/herbamed.png", link: "/drogarias/drogariaredefabiano" },
  ];

  const listaParaExibir = produtosFiltrados.slice(0, visiveis);

  return (
    <main className="w-full mx-auto bg-gray-50 pb-20">
      {/* 🔍 Busca */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex justify-center mt-4 mb-6 px-4"
      >
        <div className="flex w-full max-w-xl bg-white rounded-full shadow-md overflow-hidden border border-gray-200">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produtos..."
            className="flex-grow px-4 py-2 text-gray-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCarrinhoAberto(true)}
            className="bg-blue-700 text-white px-5 py-2 hover:bg-blue-800 transition-all"
          >
            🛒
          </button>
        </div>
      </form>

      {/* 🎞️ Carrossel */}
      <div className="max-w-5xl mx-auto px-4">
        <Slider {...slider}>
          {banners.map((b, i) => (
            <div key={i} className="p-2">
              <a href={b.link}>
                <img
                  src={b.src}
                  alt="banner"
                  className="w-full rounded-2xl shadow-lg object-cover"
                />
              </a>
            </div>
          ))}
        </Slider>
      </div>

      {/* 👋 Título */}
      <section className="text-center mt-8 mb-6 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-700">
          Bem-vindo à IA Drogarias
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          Inteligência a serviço da sua saúde 💙
        </p>
      </section>

      {/* 🛍️ Produtos */}
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Produtos em destaque
        </h3>

        {carregando ? (
          <p className="text-center text-gray-500 py-10">
            Carregando produtos...
          </p>
        ) : listaParaExibir.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            Nenhum produto encontrado.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
              {listaParaExibir.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg shadow p-3 text-center hover:shadow-lg transition flex flex-col justify-between"
                >
                  <Image
                    src={imgUrl(p.imagem)}
                    alt={p.nome}
                    width={150}
                    height={150}
                    className="mx-auto rounded object-contain h-24 sm:h-32"
                  />
                  <h2 className="font-medium text-blue-800 mt-2 text-xs sm:text-sm line-clamp-2">
                    {p.nome}
                  </h2>
                  <p className="text-sm font-bold text-green-600 mt-1">
                    R$ {fmt(Number(p.preco_venda))}
                  </p>
                  {p.estoque > 0 ? (
  <button
    onClick={() => adicionarAoCarrinho(p)}
    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-md text-xs sm:text-sm font-medium transition"
  >
    Adicionar
  </button>
) : (
  <button
    disabled
    className="mt-2 bg-gray-400 text-white py-1 rounded-md text-xs sm:text-sm font-medium opacity-70 cursor-not-allowed"
  >
    Indisponível
  </button>
)}

                </div>
              ))}
            </div>

            {visiveis < produtosFiltrados.length && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisiveis((v) => v + 20)}
                  className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-full hover:bg-blue-800 transition-all"
                >
                  Ver mais produtos
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
