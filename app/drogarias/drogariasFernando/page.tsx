"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabaseClient";

// ⚙️ Identificação da loja
const LOJA = {
  nome: "Drogarias Fernando",
  slug: "drogarias-fernando",
  whatsapp: "5511952068432",
  corPrimaria: "bg-blue-700",
};

const LIMITE = 40;

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
  ativo: boolean | null;
  imagens: string[] | null;
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "R$ 0,00";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function getPrecoFinal(p: FVProduto) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);
  return emPromo ? promo : pmc;
}

export default function DrogariasFernandoPage() {
  const [itens, setItens] = useState<FVProduto[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const set = new Set(itens.map((p) => p.categoria).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [itens]);

  // 🔍 Buscar produtos (fv_produtos)
  async function carregar() {
    try {
      setCarregando(true);
      setErro(null);

      let query = supabase
        .from("fv_produtos")
        .select(
          "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,ativo,imagens"
        )
        // aqui você decide: mostrar só ativos ou deixar aparecer tudo com badge
        .eq("ativo", true)
        .order("nome", { ascending: true })
        .limit(LIMITE);

      if (categoria) {
        // categoria exata (mais estável). Se preferir parcial, troque por ilike
        query = query.eq("categoria", categoria);
      }

      const termo = busca.trim();
      if (termo) {
        const digits = onlyDigits(termo);

        // EAN exato quando digitar só números (8–14 dígitos)
        if (digits && digits.length >= 8 && digits.length <= 14 && digits === termo) {
          query = query.eq("ean", digits);
        } else if (digits && digits.length >= 8 && digits.length <= 14) {
          // mistura: tenta ean OU nome/apresentacao
          query = query.or(
            `ean.eq.${digits},nome.ilike.%${termo}%,apresentacao.ilike.%${termo}%`
          );
        } else {
          query = query.or(`nome.ilike.%${termo}%,apresentacao.ilike.%${termo}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setItens((data || []) as FVProduto[]);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar produtos.");
      setItens([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => carregar(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, categoria]);

  function linkWhatsApp(p: FVProduto) {
    const preco = brl(getPrecoFinal(p));
    const msg = `Olá! Tenho interesse no produto:
• ${p.nome}
• EAN: ${p.ean}
• Preço: ${preco}`;
    return `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className={`${LOJA.corPrimaria} text-white py-8`}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold">{LOJA.nome}</h1>
          <p>Saúde com Inteligência • IA Drogarias</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <input
              placeholder="Buscar por nome ou EAN"
              className="p-2 rounded text-black"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <select
              className="p-2 rounded text-black"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setBusca("");
                setCategoria("");
              }}
              className="bg-gray-200 text-black rounded p-2"
            >
              Limpar filtros
            </button>
          </div>

          <div className="mt-2 text-xs text-white/80">
            Dica: se digitar só números (8–14 dígitos) ele busca <b>EAN exato</b>.
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {erro && <p className="text-red-600">{erro}</p>}
        {carregando && <p>Carregando produtos...</p>}
        {!carregando && itens.length === 0 && <p>Nenhum produto encontrado.</p>}

        {itens.map((p) => {
          const preco = getPrecoFinal(p);
          const emPromo = !!p.em_promocao && Number(p.preco_promocional || 0) > 0;

          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
              <Image
                src={firstImg(p.imagens)}
                alt={p.nome}
                width={300}
                height={200}
                className="w-full h-48 object-contain bg-white"
              />

              <div className="p-4">
                <h2 className="font-bold text-lg line-clamp-2">{p.nome}</h2>

                <p className="text-xs text-gray-500 mt-1">
                  <b>EAN:</b> <span className="font-mono">{p.ean}</span>
                </p>

                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {p.apresentacao || p.laboratorio || ""}
                </p>

                {emPromo ? (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">
                      De <span className="line-through">{brl(p.pmc)}</span>
                    </div>
                    <p className="font-extrabold text-blue-700">{brl(preco)}</p>
                  </div>
                ) : (
                  <p className="font-extrabold text-blue-700 mt-2">{brl(preco)}</p>
                )}

                <div className="flex justify-between items-center mt-3">
                  {/* aqui é sempre disponível porque filtramos ativo=true */}
                  <span className="text-green-600 font-semibold">Disponível</span>

                  <a
                    href={linkWhatsApp(p)}
                    target="_blank"
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Pedir no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
