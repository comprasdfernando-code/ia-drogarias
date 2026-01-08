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
const LOJA_SLUG = "drogariaredefabiano";
const CARRINHO_KEY = "carrinhoFabiano";

// 🧩 Tipos (Catálogo Global)
type FVProduto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  imagens: string[] | null;
  ativo: boolean | null;
};

// 🧩 Tipos (Estoque por Loja)
type LojaProduto = {
  produto_id: string;
  loja_slug: string;
  estoque: number | null;
  preco_venda: number | null;
  ativo: boolean | null;
};

// ✅ Produto final da tela (join)
type ProdutoTela = FVProduto & {
  loja_estoque: number;
  loja_preco: number | null;
  loja_ativo: boolean;
  disponivel: boolean;
};

type ItemCarrinho = {
  id: string;
  ean: string;
  nome: string;
  preco: number;
  imagem: string;
  quantidade: number;
};

// 📸 helpers
function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}
function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}
function precoFinalGlobal(p: FVProduto) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);
  const final = emPromo ? promo : pmc;
  const offDb = Number(p.percentual_off || 0);
  const off = emPromo ? (offDb > 0 ? offDb : calcOff(pmc, promo)) : 0;
  return { pmc, promo, emPromo, final, off };
}

// 🔥 Promoções (mock) — pode trocar depois por promos reais do banco
const promocoes = [
  { id: 1, nome: "Amoxicilina 500mg", preco: "R$ 9,99", imagem: "/promocoes/amoxicilina.png" },
  { id: 2, nome: "Dipirona 500mg", preco: "R$ 4,99", imagem: "/promocoes/dipirona.png" },
  { id: 3, nome: "Vitamina C", preco: "R$ 12,90", imagem: "/promocoes/vitamina-c.png" },
];

export default function DrogariaRedeFabianoPage() {
  const [produtos, setProdutos] = useState<ProdutoTela[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  // 🔄 Carrega catálogo global + estoque da loja, e monta "disponível/indisponível"
  useEffect(() => {
    async function carregarTudo() {
      try {
        setCarregando(true);

        // 1) Catálogo global (ativo no catálogo)
        const { data: catalogo, error: e1 } = await supabase
          .from("fv_produtos")
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,imagens,ativo"
          )
          .eq("ativo", true)
          .limit(2500);

        if (e1) throw e1;

        // 2) Estoque específico da loja
        // ⚠️ ajuste o nome da tabela/colunas se estiver diferente
        const { data: loja, error: e2 } = await supabase
          .from("fv_loja_produtos")
          .select("produto_id,loja_slug,estoque,preco_venda,ativo")
          .eq("loja_slug", LOJA_SLUG)
          .limit(10000);

        if (e2) throw e2;

        const mapa = new Map<string, LojaProduto>();
        (loja || []).forEach((r) => mapa.set(r.produto_id, r));

        const joined: ProdutoTela[] = (catalogo || []).map((p: FVProduto) => {
          const lp = mapa.get(p.id);

          const loja_ativo = !!lp?.ativo;
          const loja_estoque = Number(lp?.estoque || 0);
          const loja_preco = lp?.preco_venda != null ? Number(lp.preco_venda) : null;

          const disponivel = loja_ativo && loja_estoque > 0;

          return {
            ...p,
            loja_ativo,
            loja_estoque,
            loja_preco,
            disponivel,
          };
        });

        // ordena: disponíveis primeiro, depois promo, depois nome
        joined.sort((a, b) => {
          const da = a.disponivel ? 1 : 0;
          const db = b.disponivel ? 1 : 0;
          if (db !== da) return db - da;

          const pa = a.em_promocao ? 1 : 0;
          const pb = b.em_promocao ? 1 : 0;
          if (pb !== pa) return pb - pa;

          return (a.nome || "").localeCompare(b.nome || "");
        });

        setProdutos(joined);
      } catch (err) {
        console.error("Erro carregarTudo:", err);
        setProdutos([]);
      } finally {
        setCarregando(false);
      }
    }

    carregarTudo();
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

  function adicionarAoCarrinho(p: ProdutoTela) {
    if (!p.disponivel) return;

    const global = precoFinalGlobal(p);
    const preco = p.loja_preco != null && p.loja_preco > 0 ? p.loja_preco : global.final;

    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === p.id);
      if (existe) {
        return prev.map((i) => (i.id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [
        ...prev,
        {
          id: p.id,
          ean: p.ean,
          nome: p.nome,
          preco: preco || 0,
          imagem: firstImg(p.imagens),
          quantidade: 1,
        },
      ];
    });
  }

  const produtosFiltrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return produtos;
    return produtos.filter((p) => {
      const nome = (p.nome || "").toLowerCase();
      const ean = (p.ean || "").toLowerCase();
      const cat = (p.categoria || "").toLowerCase();
      const lab = (p.laboratorio || "").toLowerCase();
      return nome.includes(t) || ean.includes(t) || cat.includes(t) || lab.includes(t);
    });
  }, [produtos, busca]);

  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      {/* HERO */}
      <section className="relative h-[320px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/banners/hero-drogaria-rede-fabiano.png')" }}
        />
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-extrabold text-blue-700">Drogaria Rede Fabiano</h1>
          <p className="text-gray-600 mt-2">Saúde, confiança e economia perto de você</p>
        </div>
      </section>

      {/* HEADER BUSCA + CARRINHO */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar medicamentos, marcas, EAN ou categorias..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <span className="text-blue-600 font-bold">🔍</span>
          </div>

          <Link href="/drogarias/drogariaredefabiano/carrinho" className="relative">
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
        <h2 className="font-semibold text-lg mb-3">🔥 Promoções da Semana</h2>

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imagem} alt={p.nome} className="h-32 mx-auto object-contain mb-2" />
                <div className="text-sm font-medium">{p.nome}</div>
                <div className="text-green-600 font-bold">{p.preco}</div>
              </div>
            </div>
          ))}
        </Slider>
      </section>

      {/* PRODUTOS */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {carregando ? (
          <div className="col-span-full text-gray-600">Carregando produtos...</div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="col-span-full text-gray-600">Nenhum produto encontrado.</div>
        ) : (
          produtosFiltrados.map((p) => {
            const global = precoFinalGlobal(p);
            const preco = p.loja_preco != null && p.loja_preco > 0 ? p.loja_preco : global.final;

            return (
              <div
                key={p.id}
                className={`bg-white rounded shadow p-3 border ${
                  p.disponivel ? "border-transparent" : "border-gray-200 opacity-80"
                }`}
              >
                <Image
                  src={firstImg(p.imagens)}
                  alt={p.nome}
                  width={150}
                  height={150}
                  className="mx-auto h-32 object-contain"
                />

                <div className="text-sm font-medium mt-2 line-clamp-2">{p.nome}</div>

                {/* Info menor */}
                <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                  {p.laboratorio || "—"} • {p.categoria || "—"}
                </div>

                {/* Preço (loja > global) */}
                <div className="mt-2">
                  {global.emPromo ? (
                    <>
                      <div className="text-xs text-gray-500">
                        De <span className="line-through">{brl(global.pmc)}</span>
                      </div>
                      <div className="text-green-600 font-extrabold">
                        Por {brl(preco)}
                        {global.off > 0 ? (
                          <span className="ml-2 inline-block bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {global.off}% OFF
                          </span>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="text-green-600 font-extrabold">{brl(preco)}</div>
                  )}
                </div>

                {/* Status estoque */}
                <div className="mt-2 text-xs">
                  {p.disponivel ? (
                    <span className="text-emerald-700 font-bold">Disponível</span>
                  ) : (
                    <span className="text-red-600 font-bold">Indisponível</span>
                  )}
                </div>

                <button
                  onClick={() => adicionarAoCarrinho(p)}
                  disabled={!p.disponivel}
                  className={`w-full mt-2 py-1 rounded font-semibold ${
                    p.disponivel
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {p.disponivel ? "Adicionar" : "Sem estoque"}
                </button>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}
