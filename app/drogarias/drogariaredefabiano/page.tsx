"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import ModalFinalizar from "../../../components/ModalFinalizar";
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
const WHATSAPP = "5511948343725";
const PIX_CHAVE = "62157257000109";

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

type Cliente = {
  nome: string;
  telefone: string;
  endereco: string;
  bairro?: string;
  complemento?: string;
};

// 📸 Helper imagem
function imgUrl(src?: string) {
  if (!src) return "/produtos/caixa-padrao.png";
  return src.startsWith("http")
    ? src
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public${src}`;
}

// 🔥 Promoções (mock – depois liga no Supabase)
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
  const [modalAberto, setModalAberto] = useState(false);

  // 🔄 Carregar produtos
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

  // 💾 Carrinho local
  useEffect(() => {
    const salvo = localStorage.getItem("carrinho-rede-fabiano");
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, []);

  useEffect(() => {
    localStorage.setItem("carrinho-rede-fabiano", JSON.stringify(carrinho));
  }, [carrinho]);

  // 🛒 Ações carrinho
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

  function alterarQtd(id: string, qtd: number) {
    if (qtd <= 0)
      setCarrinho((prev) => prev.filter((i) => i.id !== id));
    else
      setCarrinho((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantidade: qtd } : i))
      );
  }

  // 🔍 Filtro
  const produtosFiltrados = useMemo(
    () =>
      produtos.filter((p) =>
        p.nome.toLowerCase().includes(busca.toLowerCase())
      ),
    [produtos, busca]
  );

  // 💰 Total
  const total = useMemo(
    () =>
      carrinho.reduce(
        (acc, i) => acc + i.preco_venda * i.quantidade,
        0
      ),
    [carrinho]
  );

  function fmt(n: number) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  // 🧾 Finalizar
  async function finalizarPedido(cliente: Cliente, pagamento: any) {
    await supabase.from("pedidos").insert({
      loja: LOJA,
      cliente,
      itens: carrinho,
      total,
      pagamento,
      status: "pendente",
    });

    const texto = `
🛒 Pedido - Drogaria Rede Fabiano

${carrinho
  .map(
    (i) =>
      `• ${i.nome} (${i.quantidade}x) - R$ ${fmt(
        i.preco_venda * i.quantidade
      )}`
  )
  .join("\n")}

Total: R$ ${fmt(total)}
Pagamento: ${pagamento}

Cliente:
${cliente.nome}
${cliente.telefone}
${cliente.endereco}
`;

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`,
      "_blank"
    );

    setCarrinho([]);
    setModalAberto(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-28">
      {/* 🟦 HERO */}
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

      {/* 🔍 BUSCA FLUTUANTE */}
      <div className="sticky top-3 z-50 px-4 -mt-8">
        <div className="max-w-4xl mx-auto bg-white rounded-full shadow-xl flex items-center px-4 py-3 border border-blue-200">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar medicamentos, marcas ou categorias..."
            className="flex-1 outline-none text-gray-700"
          />
          <button className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-semibold">
            Buscar
          </button>
        </div>
      </div>

      {/* 🎠 PROMOÇÕES */}
      <section className="max-w-6xl mx-auto px-4 mt-10">
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
                  className="h-32 mx-auto object-contain mb-2"
                />
                <div className="text-sm font-medium">{p.nome}</div>
                <div className="text-green-600 font-bold">{p.preco}</div>
              </div>
            </div>
          ))}
        </Slider>
      </section>

      {/* 📦 PRODUTOS */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {carregando
          ? "Carregando..."
          : produtosFiltrados.map((p) => (
              <div key={p.id} className="bg-white rounded shadow p-3">
                <Image
                  src={imgUrl(p.imagem)}
                  alt={p.nome}
                  width={150}
                  height={150}
                  className="mx-auto h-32 object-contain"
                />
                <div className="text-sm font-medium mt-2">{p.nome}</div>
                <div className="text-green-600 font-bold">
                  R$ {fmt(p.preco_venda)}
                </div>
                <button
                  onClick={() => adicionarAoCarrinho(p)}
                  className="w-full mt-2 bg-blue-600 text-white py-1 rounded"
                >
                  Adicionar
                </button>
              </div>
            ))}
      </section>

      {/* 🛒 BOTÃO CARRINHO FLUTUANTE */}
      {carrinho.length > 0 && (
        <button
          onClick={() => setModalAberto(true)}
          className="fixed bottom-20 right-4 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-xl px-5 py-4 flex items-center gap-2"
        >
          <span className="text-xl">🛒</span>
          <span className="font-semibold">{carrinho.length}</span>
        </button>
      )}

      {/* 🧾 BARRA INFERIOR */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex justify-between items-center">
          <div>
            {carrinho.length} item(s) — <b>R$ {fmt(total)}</b>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-green-600 text-white px-6 py-2 rounded font-semibold"
          >
            Finalizar Pedido
          </button>
        </div>
      )}

      {modalAberto && (
        <ModalFinalizar
          loja="Drogaria Rede Fabiano"
          whatsapp={WHATSAPP}
          pixChave={PIX_CHAVE}
          total={total}
          carrinho={carrinho}
          onConfirm={finalizarPedido}
          onClose={() => setModalAberto(false)}
        />
      )}
    </main>
  );
}
